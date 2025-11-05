import type {
	RequestInfo,
	ResponseInfo,
	StoredRequest,
	StoredResponse,
} from "./types";

export interface IStorageService {
	exists(filePath: string): Promise<boolean>;
	readRequest(filePath: string): Promise<StoredRequest>;
	readResponse(filePath: string): Promise<StoredResponse>;
	writeRequest(filePath: string, request: StoredRequest): Promise<void>;
	writeResponse(filePath: string, response: StoredResponse): Promise<void>;
	ensureDirectory(dirPath: string): Promise<void>;
}

export interface IFingerprintService {
	generate(request: RequestInfo): string;
}

export interface ICacheService {
	get(fingerprint: string, storageDir: string): Promise<ResponseInfo | null>;
	set(
		fingerprint: string,
		storageDir: string,
		request: RequestInfo,
		response: ResponseInfo,
	): Promise<void>;
}

export interface IProxyClient {
	forward(
		targetUrl: string,
		request: RequestInfo,
	): Promise<ResponseInfo>;
}

