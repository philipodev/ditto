#!/usr/bin/env node

import { Command } from "commander";
import pkg from "../package.json" with { type: "json" };
import { cleanUnused } from "./clean-unused";
import { startReplayServer } from "./replay-server";
import { startServer } from "./server";

const program = new Command()
	.name("ditto")
	.description(pkg.description)
	.version(pkg.version);

program
	.command("record")
	.description("Record and proxy requests")
	.option("-p, --port <port>", "port to listen on", "4444")
	.option("-h, --host <host>", "host to listen on", "0.0.0.0")
	.option(
		"-P, --proxy <proxy>",
		"proxy target URL (e.g. http://localhost:3000)",
	)
	.action((options) => {
		startServer(options);
	});

program
	.command("serve")
	.description("Serve only from cache (no proxying)")
	.option("-p, --port <port>", "port to listen on", "4444")
	.option("-h, --host <host>", "host to listen on", "0.0.0.0")
	.option("-d, --storage-dir <dir>", "storage directory", ".ditto/requests")
	.action((options) => {
		startReplayServer(options);
	});

program
	.command("clean-last-unused")
	.description("Remove unused cached requests from last serve session")
	.option("-d, --storage-dir <dir>", "storage directory", ".ditto/requests")
	.action((options) => {
		cleanUnused(options);
	});

program.parse(process.argv);
