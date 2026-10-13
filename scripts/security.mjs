import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
const root = process.cwd();
const allowed = new Set([
	"MIT",
	"MIT OR Apache-2.0",
	"Apache-2.0",
	"ISC",
	"BSD-2-Clause",
	"BSD-3-Clause",
	"0BSD",
	"BlueOak-1.0.0",
	"Python-2.0",
	"(MIT OR CC0-1.0)",
]);
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
let count = 0;
for (const [name, entry] of Object.entries(lock.packages)) {
	if (!name) continue;
	if (!allowed.has(entry.license))
		throw new Error(`Review dependency license: ${name}: ${entry.license}`);
	if (
		!entry.resolved?.startsWith("https://registry.npmjs.org/") ||
		!entry.integrity?.startsWith("sha512-")
	)
		throw new Error(`Untrusted or unpinned dependency: ${name}`);
	count++;
}
const patterns = [
	/gh[pousr]_[A-Za-z0-9]{30,}/,
	/github_pat_[A-Za-z0-9_]{30,}/,
	/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
	/[A-Za-z\d_-]{24,}\.[A-Za-z\d_-]{6}\.[A-Za-z\d_-]{25,}/,
	/DISCORD_TOKEN[ \t]*=[ \t]*[A-Za-z0-9._-]{20,}/,
];
let files = 0;
function scan(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (
			["node_modules", "dist", ".git"].includes(entry.name) ||
			(entry.name.startsWith(".env") && entry.name !== ".env.example")
		)
			continue;
		const file = join(dir, entry.name);
		if (entry.isDirectory()) scan(file);
		else {
			if (patterns.some((p) => p.test(readFileSync(file, "utf8"))))
				throw new Error(
					`Possible secret in ${relative(root, file)} (value suppressed)`,
				);
			files++;
		}
	}
}
scan(root);
console.log(
	`Dependency license/integrity checks passed: ${count} packages. Secret-pattern scan passed: ${files} files. These checks do not prove absence of every vulnerability or secret.`,
);
