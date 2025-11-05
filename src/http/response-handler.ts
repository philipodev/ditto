import type { ServerResponse, IncomingMessage } from "node:http";
import type { ResponseInfo } from "../core/types";

export class ResponseHandler {
	write(
		res: ServerResponse<IncomingMessage> & { req: IncomingMessage },
		response: ResponseInfo,
	): void {
		res.writeHead(response.statusCode, response.headers);
		res.write(response.body);
		res.end();
	}

	writeError(
		res: ServerResponse<IncomingMessage> & { req: IncomingMessage },
		statusCode: number,
		message: string,
	): void {
		if (!res.writableEnded) {
			res.statusCode = statusCode;
			res.end(message);
		}
	}
}

