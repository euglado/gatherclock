export function config(env: NodeJS.ProcessEnv = process.env) {
	const token = env.DISCORD_TOKEN?.trim();
	const applicationId = env.DISCORD_APPLICATION_ID?.trim();
	const guildId = env.DISCORD_GUILD_ID?.trim();
	if (
		!token ||
		!applicationId ||
		!guildId ||
		!/^\d{17,20}$/.test(applicationId) ||
		!/^\d{17,20}$/.test(guildId)
	) {
		throw new Error(
			"Run npm run setup: token, Application ID and Server ID are required. / Kurulumu tamamlayın.",
		);
	}
	return { token, applicationId, guildId };
}
