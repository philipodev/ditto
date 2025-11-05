import path from "node:path";
import { FileStorageService } from "./storage/file-storage";
import { UnusedTrackerService } from "./tracking/unused-tracker-service";

export async function cleanUnused(inputOptions: {
	storageDir?: string;
}): Promise<void> {
	const storageDir = inputOptions.storageDir ?? path.join(process.cwd(), ".ditto/requests");
	const storage = new FileStorageService();
	const tracker = new UnusedTrackerService(storage);

	const unusedFingerprints = await tracker.loadUnused();

	if (unusedFingerprints.length === 0) {
		console.log("No unused requests to clean");
		return;
	}

	console.log(`Removing ${unusedFingerprints.length} unused requests...`);

	for (const fingerprint of unusedFingerprints) {
		await storage.removeFingerprint(storageDir, fingerprint);
	}

	const tmpFilePath = path.join(process.cwd(), ".ditto/tmp/unused.json");
	await storage.removeFile(tmpFilePath);

	console.log(`✅ Cleaned ${unusedFingerprints.length} unused requests from ${storageDir}`);
}

