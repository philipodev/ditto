import {
	type IncomingMessage,
	Server,
	type ServerResponse,
} from "node:http";
import type { ICacheService, IFingerprintService } from "../core/interfaces";
import { RequestHandler } from "../http/request-handler";
import { ResponseHandler } from "../http/response-handler";
import type { UnusedTrackerService } from "../tracking/unused-tracker-service";

interface ReplayServerOptions {
	port: number;
	host: string;
	defaultStorageDir: string;
}

export class ReplayServer {
	private server: Server;

	constructor(
		private options: ReplayServerOptions,
		private cacheService: ICacheService,
		private fingerprintService: IFingerprintService,
		private requestHandler: RequestHandler = new RequestHandler(),
		private responseHandler: ResponseHandler = new ResponseHandler(),
		private unusedTracker?: UnusedTrackerService,
	) {
		this.server = new Server((req, res) => this.handleRequest(req, res));
	}

	start(): Promise<Server> {
		return new Promise((resolve) => {
			this.server.listen(this.options.port, this.options.host, () => {
				console.log(
					`Replay server is running on http://${this.options.host}:${this.options.port}`,
				);
				console.log("Serving from cache only (no proxying)");
				console.log(`Storage: ${this.options.defaultStorageDir}`);
				resolve(this.server);
			});

			process.on("SIGINT", async () => {
				await this.shutdown();
				process.exit(0);
			});

			process.on("SIGTERM", async () => {
				await this.shutdown();
				process.exit(0);
			});
		});
	}

	private async shutdown(): Promise<void> {
		if (this.unusedTracker) {
			await this.unusedTracker.saveUnused();
		}
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
		
		const cachedResponse = await this.cacheService.get(fingerprint, this.options.defaultStorageDir);
		
		if (!cachedResponse) {
			console.log(`❌ No cached response for ${req.method} ${req.url}`);
			this.responseHandler.writeError(res, 404, "No cached response found");
			return;
		}
		
		if (this.unusedTracker) {
			this.unusedTracker.markAsUsed(fingerprint);
		}
		
		console.log(`✅ Replaying cached response for ${req.method} ${req.url}`);
		this.responseHandler.write(res, cachedResponse);
	}
}

