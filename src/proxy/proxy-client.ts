import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { IProxyClient } from "../core/interfaces";
import type { RequestInfo, ResponseInfo } from "../core/types";
import { RequestHandler } from "../http/request-handler";

export class ProxyClient implements IProxyClient {
	private requestHandler: RequestHandler;
	private rejectUnauthorized: boolean;

	constructor(rejectUnauthorized = true) {
		this.requestHandler = new RequestHandler();
		this.rejectUnauthorized = rejectUnauthorized;
	}

	async forward(
		targetUrl: string,
		requestInfo: RequestInfo,
	): Promise<ResponseInfo> {
		return new Promise<ResponseInfo>((resolve, reject) => {
			const proxyUrl = new URL(requestInfo.url, targetUrl);
			const isHttps = proxyUrl.protocol === "https:";
			const request = isHttps ? httpsRequest : httpRequest;

			const headers = { ...requestInfo.headers };
			headers.host = proxyUrl.host;

			const requestOptions = {
				method: requestInfo.method,
				headers,
				...(isHttps && {
					rejectUnauthorized: this.rejectUnauthorized,
					servername: proxyUrl.hostname,
				}),
			};

			const proxyReq = request(proxyUrl, requestOptions, async (proxyRes) => {
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
			});

			proxyReq.on("error", (err) => {
				reject(err);
			});

			proxyReq.write(requestInfo.body);
			proxyReq.end();
		});
	}
}
