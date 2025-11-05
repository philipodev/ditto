import type { IncomingMessage } from "node:http";
import type { RequestInfo } from "../core/types";

export class RequestHandler {
	async readBody(req: IncomingMessage): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			const chunks: Buffer[] = [];
			
			req.on("data", (chunk: Buffer) => {
				chunks.push(chunk);
			});
			
			req.on("end", () => {
				resolve(Buffer.concat(chunks));
			});
			
			req.on("error", (err) => {
				reject(err);
			});
		});
	}

	async parseRequest(req: IncomingMessage): Promise<RequestInfo> {
		const body = await this.readBody(req);
		
		return {
			method: req.method ?? "GET",
			url: req.url ?? "/",
			headers: req.headers,
			body,
		};
	}

	isBinary(buffer: Buffer, contentType?: string): boolean {
		if (contentType) {
			const type = contentType.toLowerCase();
			return (
				type.startsWith("image/") ||
				type.startsWith("audio/") ||
				type.startsWith("video/") ||
				type.includes("application/octet-stream") ||
				type.includes("application/pdf") ||
				type.includes("application/zip") ||
				type.includes("font/")
			);
		}
		if (buffer.length === 0) return false;
		for (let i = 0; i < Math.min(buffer.length, 512); i++) {
			const byte = buffer[i];
			if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
				return true;
			}
		}
		return false;
	}

	encodeBody(buffer: Buffer, contentType?: string): { encoded: string; isBase64: boolean } {
		const isBinary = this.isBinary(buffer, contentType);
		return {
			encoded: isBinary ? buffer.toString("base64") : buffer.toString("utf-8"),
			isBase64: isBinary,
		};
	}

	decodeBody(encoded: string, isBase64: boolean): Buffer {
		return Buffer.from(encoded, isBase64 ? "base64" : "utf-8");
	}
}

