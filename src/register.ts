import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { command } from "./discord.js";
try {
	const { token, applicationId, guildId } = config();
	await new REST({ version: "10" })
		.setToken(token)
		.post(Routes.applicationGuildCommands(applicationId, guildId), {
			body: command.toJSON(),
		});
	console.log(
		"Registered /gather in your server. Existing unrelated commands were not removed. / Komut sunucunuza kaydedildi.",
	);
} catch {
	console.error(
		"Registration failed. Check setup, bot installation, Application ID and Server ID. / Kurulumu ve kimlikleri kontrol edin.",
	);
	process.exitCode = 1;
}
