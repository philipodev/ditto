import type { Server } from "node:http";
import path from "node:path";
import { ReplayServer } from "./server/replay-server";
import { FileStorageService } from "./storage/file-storage";
import { FingerprintService } from "./fingerprint/fingerprint-service";
import { CacheService } from "./cache/cache-service";
import { RequestHandler } from "./http/request-handler";
import { ResponseHandler } from "./http/response-handler";
import { UnusedTrackerService } from "./tracking/unused-tracker-service";

export async function startReplayServer(inputOptions: {
	port?: number;
	host?: string;
	storageDir?: string;
}): Promise<Server> {
	const options = {
		port: inputOptions.port ?? 4444,
		host: inputOptions.host ?? "0.0.0.0",
		defaultStorageDir: inputOptions.storageDir ?? path.join(process.cwd(), ".ditto/requests"),
	};
	
	const storage = new FileStorageService();
	await storage.ensureDirectory(options.defaultStorageDir);
	
	const requestHandler = new RequestHandler();
	const responseHandler = new ResponseHandler();
	const fingerprintService = new FingerprintService();
	const cacheService = new CacheService(storage, requestHandler);
	
	const unusedTracker = new UnusedTrackerService(storage);
	await unusedTracker.initialize(options.defaultStorageDir);
	
	const replayServer = new ReplayServer(
		options,
		cacheService,
		fingerprintService,
		requestHandler,
		responseHandler,
		unusedTracker,
	);
	
	return replayServer.start();
}

