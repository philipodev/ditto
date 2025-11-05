import path from "node:path";
import type { ICacheService, IStorageService } from "../core/interfaces";
import type { RequestInfo, ResponseInfo, StoredRequest, StoredResponse } from "../core/types";
import { RequestHandler } from "../http/request-handler";

export class CacheService implements ICacheService {
	constructor(
		private storage: IStorageService,
		private requestHandler: RequestHandler = new RequestHandler(),
	) {}

	async get(fingerprint: string, storageDir: string): Promise<ResponseInfo | null> {
		const responsePath = path.join(storageDir, fingerprint, "response.jsonc");
		
		const exists = await this.storage.exists(responsePath);
		if (!exists) {
			return null;
		}
		
		const storedResponse = await this.storage.readResponse(responsePath);
		const body = this.requestHandler.decodeBody(
			storedResponse.body,
			storedResponse.isBase64,
		);
		
		return {
			statusCode: storedResponse.statusCode,
			headers: storedResponse.headers,
			body,
		};
	}

	async set(
		fingerprint: string,
		storageDir: string,
		request: RequestInfo,
		response: ResponseInfo,
	): Promise<void> {
		const requestPath = path.join(storageDir, fingerprint, "request.txt");
		const responsePath = path.join(storageDir, fingerprint, "response.jsonc");
		
		const requestContentType = typeof request.headers["content-type"] === "string" 
			? request.headers["content-type"] 
			: undefined;
		const requestEncoding = this.requestHandler.encodeBody(request.body, requestContentType);
		const storedRequest: StoredRequest = {
			method: request.method,
			url: request.url,
			headers: this.normalizeHeaders(request.headers),
			body: requestEncoding.encoded,
			isBase64: requestEncoding.isBase64,
		};
		
		const responseContentType = typeof response.headers["content-type"] === "string" 
			? response.headers["content-type"] 
			: undefined;
		const responseEncoding = this.requestHandler.encodeBody(response.body, responseContentType);
		const storedResponse: StoredResponse = {
			statusCode: response.statusCode,
			headers: this.normalizeHeaders(response.headers),
			body: responseEncoding.encoded,
			isBase64: responseEncoding.isBase64,
		};
		
		await Promise.all([
			this.storage.writeRequest(requestPath, storedRequest),
			this.storage.writeResponse(responsePath, storedResponse),
		]);
	}

	private normalizeHeaders(
		headers: Record<string, string | string[] | undefined>,
	): Record<string, string | string[]> {
		const normalized: Record<string, string | string[]> = {};
		
		for (const [key, value] of Object.entries(headers)) {
			if (value !== undefined) {
				normalized[key] = value;
			}
		}
		
		return normalized;
	}
}

