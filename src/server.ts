import type { Server } from "node:http";
import { CacheService } from "./cache/cache-service";
import { FingerprintService } from "./fingerprint/fingerprint-service";
import { RequestHandler } from "./http/request-handler";
import { ResponseHandler } from "./http/response-handler";
import { parseOptions } from "./options";
import { ProxyClient } from "./proxy/proxy-client";
import { ProxyServer } from "./server/proxy-server";
import { FileStorageService } from "./storage/file-storage";

export async function startServer(inputOptions: unknown): Promise<Server> {
	const options = parseOptions(inputOptions);

	const storage = new FileStorageService();
	await storage.ensureDirectory(options.storageDir);

	const requestHandler = new RequestHandler();
	const responseHandler = new ResponseHandler();
	const fingerprintService = new FingerprintService();
	const cacheService = new CacheService(storage, requestHandler);
	const proxyClient = new ProxyClient();

	const proxyServer = new ProxyServer(
		options,
		cacheService,
		fingerprintService,
		proxyClient,
		requestHandler,
		responseHandler,
	);

	return proxyServer.start();
}
