import type { IncomingMessage } from "node:http";

export interface StoredRequest {
	method: string;
	url: string;
	headers: Record<string, string | string[]>;
	body: string;
	isBase64: boolean;
}

export interface StoredResponse {
	statusCode: number;
	headers: Record<string, string | string[]>;
	body: string;
	isBase64: boolean;
}

export interface RequestInfo {
	method: string;
	url: string;
	headers: Record<string, string | string[] | undefined>;
	body: Buffer;
}

export interface ResponseInfo {
	statusCode: number;
	headers: Record<string, string | string[] | undefined>;
	body: Buffer;
}

export type FingerprintSegment = string;

export interface CacheResult {
	found: boolean;
	response?: ResponseInfo;
}

