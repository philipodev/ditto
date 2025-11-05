import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorageService } from "../storage/file-storage";

export class UnusedTrackerService {
	private unusedFingerprints: Set<string> = new Set();
	private tmpFilePath: string;

	constructor(private storage: FileStorageService) {
		this.tmpFilePath = path.join(process.cwd(), ".ditto/tmp/unused.json");
	}

	async initialize(storageDir: string): Promise<void> {
		const fingerprints = await this.storage.listFingerprints(storageDir);
		this.unusedFingerprints = new Set(fingerprints);
		console.log(`Tracking ${this.unusedFingerprints.size} cached requests for usage`);
	}

	markAsUsed(fingerprint: string): void {
		if (this.unusedFingerprints.has(fingerprint)) {
			this.unusedFingerprints.delete(fingerprint);
		}
	}

	async saveUnused(): Promise<void> {
		const unused = Array.from(this.unusedFingerprints);
		await this.storage.ensureDirectory(path.dirname(this.tmpFilePath));
		await writeFile(this.tmpFilePath, JSON.stringify(unused, null, 2));
		console.log(`Saved ${unused.length} unused requests to ${this.tmpFilePath}`);
	}

	async loadUnused(): Promise<string[]> {
		try {
			const content = await readFile(this.tmpFilePath, "utf-8");
			return JSON.parse(content);
		} catch {
			return [];
		}
	}

	getUnusedCount(): number {
		return this.unusedFingerprints.size;
	}
}

