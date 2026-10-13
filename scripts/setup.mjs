import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { existsSync, writeFileSync } from "node:fs";
let hidden = false;
const output = new Writable({
	write(chunk, _encoding, done) {
		if (!hidden) process.stdout.write(chunk);
		done();
	},
});
const rl = createInterface({
	input: process.stdin,
	output,
	terminal: Boolean(process.stdin.isTTY),
});
try {
	if (existsSync(".env")) {
		const answer = await rl.question(
			"Replace existing .env? / Mevcut .env değişsin mi? [yes/Hayır]: ",
		);
		if (answer.trim().toLowerCase() !== "yes") {
			console.log("Kept existing configuration. / Mevcut ayarlar korundu.");
			process.exit(0);
		}
	}
	console.log(
		"Token is secret; input will be hidden. / Token gizlidir; yazarken görünmez.",
	);
	process.stdout.write("Bot token: ");
	hidden = true;
	const token = (await rl.question("")).trim();
	hidden = false;
	process.stdout.write("\n");
	const applicationId = (
		await rl.question("Application ID / Uygulama kimliği: ")
	).trim();
	const guildId = (await rl.question("Server ID / Sunucu kimliği: ")).trim();
	if (
		!/^[A-Za-z0-9._-]{20,}$/.test(token) ||
		!/^\d{17,20}$/.test(applicationId) ||
		!/^\d{17,20}$/.test(guildId)
	)
		throw new Error("Invalid values");
	writeFileSync(
		".env",
		`DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${applicationId}\nDISCORD_GUILD_ID=${guildId}\n`,
		{ mode: 0o600 },
	);
	console.log(
		"Saved .env locally. Never share it. / .env yerelde kaydedildi; paylaşmayın.",
	);
	console.log(
		`Install / Davet: https://discord.com/oauth2/authorize?client_id=${applicationId}&scope=bot%20applications.commands&permissions=3072&guild_id=${guildId}&disable_guild_select=true`,
	);
	console.log(
		"Install first, then npm run register and npm start. / Önce davet edin, sonra npm run register ve npm start çalıştırın.",
	);
} catch {
	hidden = false;
	console.error(
		"Setup failed; check token and numeric IDs. / Kurulum başarısız; tokenı ve sayısal kimlikleri kontrol edin.",
	);
	process.exitCode = 1;
} finally {
	rl.close();
}
