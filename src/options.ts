import path from "node:path";
import z from "zod";

const optionsSchema = z.object({
	port: z.coerce.number().positive().default(4444),
	host: z.string().default("0.0.0.0"),
	proxy: z.url(),
	storageDir: z.string().default(path.join(process.cwd(), ".ditto/requests")),
});

export type Options = z.infer<typeof optionsSchema>;

export function parseOptions(inputOptions: unknown): Options {
	return optionsSchema.parse(inputOptions);
}
