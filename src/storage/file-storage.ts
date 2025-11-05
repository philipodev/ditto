import { access, mkdir, readFile, writeFile, readdir, rm, unlink } from "node:fs/promises";
import path from "node:path";
import type { IStorageService } from "../core/interfaces";
import type { StoredRequest, StoredResponse } from "../core/types";

export class FileStorageService implements IStorageService {
	async exists(filePath: string): Promise<boolean> {
		try {
			await access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	async readRequest(filePath: string): Promise<StoredRequest> {
		const content = await readFile(filePath, "utf-8");
		const lines = content.split("\n");
		
		const [method, url] = lines[0].split(" ");
		const headers: Record<string, string> = {};
		let bodyStartIndex = 1;
		
		for (let i = 1; i < lines.length; i++) {
			if (lines[i] === "") {
				bodyStartIndex = i + 1;
				break;
			}
			const [key, ...valueParts] = lines[i].split(": ");
			headers[key] = valueParts.join(": ");
		}
		
		const body = lines.slice(bodyStartIndex).join("\n");
		const isBase64 = /^[A-Za-z0-9+/=]+$/.test(body);
		
		return { method, url, headers, body, isBase64 };
	}

	async readResponse(filePath: string): Promise<StoredResponse> {
		const content = await readFile(filePath, "utf-8");
		const parsed = JSON.parse(content);
		
		return {
			statusCode: parsed.statusCode,
			headers: parsed.headers,
			body: parsed.body,
			isBase64: parsed.isBase64 ?? false,
			isJson: parsed.isJson ?? false,
		};
	}

	async writeRequest(filePath: string, request: StoredRequest): Promise<void> {
		await this.ensureDirectory(path.dirname(filePath));
		
		const headerLines = Object.entries(request.headers)
			.map(([key, value]) => `${key}: ${value}`)
			.join("\n");
		
		const content = [
			`${request.method} ${request.url}`,
			headerLines,
			"",
			request.body,
		].join("\n");
		
		await writeFile(filePath, content);
	}

	async writeResponse(filePath: string, response: StoredResponse): Promise<void> {
		await this.ensureDirectory(path.dirname(filePath));
		
		const content = {
			statusCode: response.statusCode,
			headers: response.headers,
			body: response.body,
			isBase64: response.isBase64,
			isJson: response.isJson,
		};
		
		await writeFile(filePath, JSON.stringify(content, null, 2));
	}

	async ensureDirectory(dirPath: string): Promise<void> {
		await mkdir(dirPath, { recursive: true });
	}

	async listFingerprints(storageDir: string): Promise<string[]> {
		const fingerprints: string[] = [];
		
		async function walkDir(dir: string, relativePath: string = ""): Promise<void> {
			try {
				const entries = await readdir(dir, { withFileTypes: true });
				
				const hasResponseFile = entries.some(
					entry => entry.isFile() && entry.name === "response.jsonc"
				);
				
				if (hasResponseFile && relativePath) {
					fingerprints.push(relativePath);
					return;
				}
				
				for (const entry of entries) {
					if (entry.isDirectory()) {
						const newRelativePath = relativePath 
							? `${relativePath}/${entry.name}`
							: entry.name;
						await walkDir(path.join(dir, entry.name), newRelativePath);
					}
				}
			} catch {
			}
		}
		
		await walkDir(storageDir);
		return fingerprints;
	}

	async removeFingerprint(storageDir: string, fingerprint: string): Promise<void> {
		const fingerprintPath = path.join(storageDir, fingerprint);
		await rm(fingerprintPath, { recursive: true, force: true });
	}

	async removeFile(filePath: string): Promise<void> {
		try {
			await unlink(filePath);
		} catch {
		}
	}
}

