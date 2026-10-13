import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { config } from "./config.js";
import { handle, safeMentions } from "./discord.js";
import { Drafts } from "./drafts.js";
const client = new Client({
	intents: [GatewayIntentBits.Guilds],
	allowedMentions: safeMentions,
});
const drafts = new Drafts();
const cleanup = setInterval(() => drafts.prune(), 60000);
cleanup.unref();
try {
	const settings = config();
	client.once(Events.ClientReady, () =>
		console.log("GatherClock is online. / GatherClock çevrimiçi."),
	);
	client.on(Events.Error, () =>
		console.error("Discord connection error; check network and permissions."),
	);
	client.on(Events.InteractionCreate, async (i) => {
		try {
			await handle(i, drafts, settings.guildId);
		} catch {
			console.error(
				"Interaction failed; no user content or credentials logged.",
			);
			if (i.isRepliable()) {
				const content =
					"Could not complete this action. Check the channel before retrying. / İşlem tamamlanamadı. Yeniden denemeden önce kanalı kontrol edin.";
				try {
					if (i.deferred || i.replied)
						await i.editReply({
							content,
							components: [],
							allowedMentions: safeMentions,
						});
					else
						await i.reply({
							content,
							flags: MessageFlags.Ephemeral,
							allowedMentions: safeMentions,
						});
				} catch {
					/* The interaction may have expired; never log its token. */
				}
			}
		}
	});
	for (const signal of ["SIGINT", "SIGTERM"] as const)
		process.once(signal, () => {
			clearInterval(cleanup);
			client.destroy();
		});
	await client.login(settings.token);
} catch {
	console.error(
		"Startup failed. Run npm run setup; check token and network. / Kurulumu, tokenı ve bağlantıyı kontrol edin.",
	);
	client.destroy();
	process.exitCode = 1;
}
