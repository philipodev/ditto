import { createHash } from "node:crypto";
import type { IFingerprintService } from "../core/interfaces";
import type { RequestInfo } from "../core/types";

export class FingerprintService implements IFingerprintService {
	generate(request: RequestInfo): string {
		const url = new URL(request.url, "http://0.0.0.0");
		
		let segments = [`(${request.method})`];
		
		if (url.pathname) {
			segments = segments.concat(url.pathname.split("/").filter(Boolean));
		}
		
		if (url.search) {
			segments.push(`[query=${encodeURIComponent(url.search)}]`);
		}
		
		const hashedHeaders = this.hashObject(request.headers);
		segments.push(`[${hashedHeaders}]`);
		
		if (request.body.length > 0) {
			const hashedBody = this.hashBuffer(request.body);
			segments.push(`[${hashedBody}]`);
		}
		
		return segments.join("/");
	}

	private hashObject(obj: unknown): string {
		return createHash("sha256")
			.update(JSON.stringify(obj))
			.digest("hex")
			.substring(0, 12);
	}

	private hashBuffer(buffer: Buffer): string {
		return createHash("sha256")
			.update(buffer)
			.digest("hex")
			.substring(0, 12);
	}
}

