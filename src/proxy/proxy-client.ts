import { request } from "node:http";
import type { IProxyClient } from "../core/interfaces";
import type { RequestInfo, ResponseInfo } from "../core/types";
import { RequestHandler } from "../http/request-handler";

export class ProxyClient implements IProxyClient {
	private requestHandler: RequestHandler;

	constructor() {
		this.requestHandler = new RequestHandler();
	}

	async forward(targetUrl: string, requestInfo: RequestInfo): Promise<ResponseInfo> {
		return new Promise<ResponseInfo>((resolve, reject) => {
			const proxyUrl = new URL(requestInfo.url, targetUrl);
			
			const proxyReq = request(
				proxyUrl,
				{
					method: requestInfo.method,
					headers: requestInfo.headers,
				},
				async (proxyRes) => {
					try {
						const body = await this.requestHandler.readBody(proxyRes);
						
						resolve({
							statusCode: proxyRes.statusCode ?? 200,
							headers: proxyRes.headers,
							body,
						});
					} catch (err) {
						reject(err);
					}
				},
			);
			
			proxyReq.on("error", (err) => {
				reject(err);
			});
			
			proxyReq.write(requestInfo.body);
			proxyReq.end();
		});
	}
}

