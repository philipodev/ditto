import {
	type IncomingMessage,
	Server,
	type ServerResponse,
} from "node:http";
import type { Options } from "../options";
import type { ICacheService, IFingerprintService, IProxyClient } from "../core/interfaces";
import { RequestHandler } from "../http/request-handler";
import { ResponseHandler } from "../http/response-handler";

export class ProxyServer {
	private server: Server;

	constructor(
		private options: Options,
		private cacheService: ICacheService,
		private fingerprintService: IFingerprintService,
		private proxyClient: IProxyClient,
		private requestHandler: RequestHandler = new RequestHandler(),
		private responseHandler: ResponseHandler = new ResponseHandler(),
	) {
		this.server = new Server((req, res) => this.handleRequest(req, res));
	}

	start(): Promise<Server> {
		return new Promise((resolve) => {
			this.server.listen(this.options.port, this.options.host, () => {
				console.log(
					`Server is running on http://${this.options.host}:${this.options.port}`,
				);
				resolve(this.server);
			});
		});
	}

	private handleRequest(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage> & { req: IncomingMessage },
	): void {
		if (!req.url) {
			this.responseHandler.writeError(res, 400, "Bad Request");
			return;
		}

		this.processRequest(req, res)
			.catch((err) => {
				console.error(err);
				this.responseHandler.writeError(res, 500, "Internal Server Error");
			});
	}

	private async processRequest(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage> & { req: IncomingMessage },
	): Promise<void> {
		const requestInfo = await this.requestHandler.parseRequest(req);
		const fingerprint = this.fingerprintService.generate(requestInfo);
		
		const cachedResponse = await this.cacheService.get(fingerprint, this.options.storageDir);
		
		if (cachedResponse) {
			console.log("replaying cached response");
			this.responseHandler.write(res, cachedResponse);
			return;
		}
		
		const response = await this.proxyClient.forward(this.options.proxy, requestInfo);
		console.log("proxying to", new URL(requestInfo.url, this.options.proxy).href);
		
		this.responseHandler.write(res, response);
		
		await this.cacheService.set(fingerprint, this.options.storageDir, requestInfo, response);
	}
}

