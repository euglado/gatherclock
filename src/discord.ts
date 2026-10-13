import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	InteractionContextType,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
	type Interaction,
} from "discord.js";
import type { Drafts } from "./drafts.js";
import {
	errors,
	InputError,
	makeCard,
	render,
	type Language,
} from "./domain.js";
export const command = new SlashCommandBuilder()
	.setName("gather")
	.setDescription("Preview an event time card / Etkinlik saat kartı hazırla")
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
	.addStringOption((o) =>
		o
			.setName("language")
			.setDescription("Form language / Form dili")
			.addChoices(
				{ name: "Türkçe", value: "tr" },
				{ name: "English", value: "en" },
			),
	);
export function modal(language: Language) {
	const tr = language === "tr";
	const inputs: [string, string, string, number, boolean][] = [
		[
			"title",
			tr ? "Etkinlik başlığı" : "Event title",
			tr ? "Topluluk buluşması" : "Community meetup",
			80,
			true,
		],
		[
			"local",
			tr ? "Tarih ve saat (24 saat)" : "Date and time (24-hour)",
			"2026-12-20 19:30",
			16,
			true,
		],
		[
			"zone",
			tr ? "IANA saat dilimi" : "IANA time zone",
			"Europe/Istanbul",
			60,
			true,
		],
		[
			"duration",
			tr ? "Süre (dakika, varsayılan 60)" : "Duration (minutes, default 60)",
			"60",
			4,
			false,
		],
		[
			"details",
			tr ? "Kısa açıklama (isteğe bağlı)" : "Short details (optional)",
			tr
				? "Herkese açık olacak; kişisel bilgi yazmayın."
				: "Will be public; avoid personal information.",
			400,
			false,
		],
	];
	return new ModalBuilder()
		.setCustomId(`gc:form:${language}`)
		.setTitle(tr ? "Etkinlik kartı hazırla" : "Prepare an event card")
		.addLabelComponents(
			inputs.map(([id, label, placeholder, max, required]) =>
				new LabelBuilder().setLabel(label).setTextInputComponent(
					new TextInputBuilder()
						.setCustomId(id)
						.setPlaceholder(placeholder)
						.setStyle(
							id === "details"
								? TextInputStyle.Paragraph
								: TextInputStyle.Short,
						)
						.setMaxLength(max)
						.setRequired(required),
				),
			),
		);
}
export const safeMentions = { parse: [] as never[], repliedUser: false };
export async function handle(i: Interaction, drafts: Drafts, guildId: string) {
	if (!i.isChatInputCommand() && !i.isModalSubmit() && !i.isButton()) return;
	if (i.isChatInputCommand() && i.commandName !== "gather") return;
	if (!i.isChatInputCommand() && !i.customId.startsWith("gc:")) return;
	const language: Language = i.isChatInputCommand()
		? i.options.getString("language") === "tr" ||
			(!i.options.getString("language") && i.locale === "tr")
			? "tr"
			: "en"
		: i.customId.split(":")[2] === "tr"
			? "tr"
			: "en";
	const tr = language === "tr";
	const say = (en: string, turkish: string) => (tr ? turkish : en);
	const reply = (content: string) =>
		i.reply({
			content,
			flags: MessageFlags.Ephemeral,
			allowedMentions: safeMentions,
		});
	if (
		!i.inGuild() ||
		!i.channelId ||
		i.guildId !== guildId ||
		i.channel?.type !== ChannelType.GuildText
	) {
		await reply(
			say(
				"Use this in a regular text channel of the configured server.",
				"Yapılandırılan sunucunun normal metin kanalında kullanın.",
			),
		);
		return;
	}
	if (
		!i.memberPermissions?.has(PermissionFlagsBits.ManageEvents) &&
		!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
	) {
		await reply(
			say(
				"An organizer needs Manage Events or Manage Server permission.",
				"Düzenleyicide Etkinlikleri Yönet veya Sunucuyu Yönet izni gerekli.",
			),
		);
		return;
	}
	if (i.isChatInputCommand()) {
		await i.showModal(modal(language));
		return;
	}
	const context = {
		userId: i.user.id,
		guildId: i.guildId,
		channelId: i.channelId,
	};
	if (i.isModalSubmit()) {
		if (i.customId !== `gc:form:${language}`) return;
		await i.deferReply({ flags: MessageFlags.Ephemeral });
		try {
			const card = makeCard({
				title: i.fields.getTextInputValue("title"),
				local: i.fields.getTextInputValue("local"),
				zone: i.fields.getTextInputValue("zone"),
				duration: i.fields.getTextInputValue("duration"),
				details: i.fields.getTextInputValue("details"),
				language,
			});
			const id = drafts.add(context, card);
			const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`gc:publish:${language}:${id}`)
					.setLabel(say("Publish in this channel", "Bu kanalda yayımla"))
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId(`gc:cancel:${language}:${id}`)
					.setLabel(say("Cancel", "Vazgeç"))
					.setStyle(ButtonStyle.Secondary),
			);
			await i.editReply({
				content: `${say("Private preview · expires in 10 minutes. Publish makes this visible to everyone in this channel.", "Özel önizleme · 10 dakika geçerli. Yayımlayınca bu kanaldaki herkes görür.")}\n\n${render(card)}`,
				components: [buttons],
				allowedMentions: safeMentions,
			});
		} catch (error) {
			await i.editReply({
				content:
					error instanceof InputError
						? errors[language][error.key]
						: say(
								"Cannot prepare a preview. Try /gather again shortly.",
								"Önizleme hazırlanamadı. Biraz sonra /gather komutunu yeniden deneyin.",
							),
				components: [],
			});
		}
		return;
	}
	const [, action, , id] = i.customId.split(":");
	if (!id || !["publish", "cancel"].includes(action ?? "")) return;
	if (
		action === "publish" &&
		!i.appPermissions?.has([
			PermissionFlagsBits.ViewChannel,
			PermissionFlagsBits.SendMessages,
		])
	) {
		await reply(
			say(
				"Give the bot View Channel and Send Messages in this channel.",
				"Bota bu kanalda Kanalı Görüntüle ve Mesaj Gönder izinlerini verin.",
			),
		);
		return;
	}
	const card = drafts.claim(id, context, action === "publish");
	if (!card) {
		await reply(
			say(
				"Preview expired, already used, or server cooldown (10 seconds). Try /gather again.",
				"Önizleme süresi doldu, kullanıldı veya sunucu beklemesi (10 saniye) var. /gather komutunu yeniden deneyin.",
			),
		);
		return;
	}
	await i.deferUpdate();
	if (action === "cancel") {
		await i.editReply({
			content: say(
				"Cancelled. Nothing was published.",
				"Vazgeçildi. Hiçbir şey yayımlanmadı.",
			),
			components: [],
		});
		return;
	}
	try {
		await i.channel.send({
			content: render(card),
			allowedMentions: safeMentions,
		});
		await i.editReply({
			content: say(
				"Published in this channel. Use Discord’s message menu to remove the card if needed.",
				"Bu kanalda yayımlandı. Gerekirse kartı Discord mesaj menüsünden kaldırın.",
			),
			components: [],
		});
	} catch {
		await i.editReply({
			content: say(
				"Could not confirm publication. Check the channel before trying again to avoid a duplicate.",
				"Yayın doğrulanamadı. Tekrar denemeden önce kopya oluşmaması için kanalı kontrol edin.",
			),
			components: [],
		});
	}
}
