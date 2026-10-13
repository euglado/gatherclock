import { Temporal } from "@js-temporal/polyfill";
export type Language = "tr" | "en";
export class InputError extends Error {
	constructor(
		public key:
			| "title"
			| "date"
			| "zone"
			| "dst"
			| "future"
			| "duration"
			| "details",
	) {
		super(key);
	}
}
export interface EventCard {
	title: string;
	zone: string;
	local: string;
	start: number;
	end: number;
	details: string;
	language: Language;
}
export function plain(value: string) {
	// Prevent mentions, markdown, automatic links and injected Discord timestamps.
	const unsafeCharacters =
		// biome-ignore lint/suspicious/noControlCharactersInRegex: Strip untrusted control characters.
		/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g;
	return value
		.replace(unsafeCharacters, " ")
		.replace(/@/g, "＠")
		.replace(/</g, "‹")
		.replace(/>/g, "›")
		.replace(/https?:\/\//gi, "link:")
		.replace(/([\\`*_~|[\]#])/g, "\\$1")
		.trim();
}
export function makeCard(
	input: {
		title: string;
		local: string;
		zone: string;
		duration: string;
		details: string;
		language: Language;
	},
	now = Date.now(),
): EventCard {
	const title = input.title.trim();
	if (!title || title.length > 80 || !plain(title))
		throw new InputError("title");
	if (input.details.length > 400) throw new InputError("details");
	if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(input.local.trim()))
		throw new InputError("date");
	const zone = input.zone.trim();
	if (!(zone === "UTC" || /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){1,2}$/.test(zone)))
		throw new InputError("zone");
	try {
		new Intl.DateTimeFormat("en", { timeZone: zone }).format();
	} catch {
		throw new InputError("zone");
	}
	let local: Temporal.PlainDateTime;
	try {
		local = Temporal.PlainDateTime.from(input.local.trim().replace(" ", "T"), {
			overflow: "reject",
		});
	} catch {
		throw new InputError("date");
	}
	let start: number;
	try {
		start =
			Number(
				local.toZonedDateTime(zone, { disambiguation: "reject" })
					.epochMilliseconds,
			) / 1000;
	} catch {
		throw new InputError("dst");
	}
	if (start * 1000 <= now || start * 1000 > now + 366 * 86400000)
		throw new InputError("future");
	const duration = input.duration.trim() || "60";
	if (
		!/^\d{1,4}$/.test(duration) ||
		Number(duration) < 5 ||
		Number(duration) > 1440
	)
		throw new InputError("duration");
	return {
		title: plain(title),
		zone,
		local: input.local.trim(),
		start,
		end: start + Number(duration) * 60,
		details: plain(input.details),
		language: input.language,
	};
}
export function render(card: EventCard) {
	const tr = card.language === "tr";
	return `**${card.title}**\n${tr ? "Başlangıç" : "Starts"}: <t:${card.start}:F> (<t:${card.start}:R>)\n${tr ? "Bitiş" : "Ends"}: <t:${card.end}:F>\n${tr ? "Girilen saat" : "Entered time"}: ${card.local} (${card.zone})${card.details ? `\n${card.details}` : ""}\n_${tr ? "Saatler Discord cihaz ayarınıza göre gösterilir." : "Times follow your Discord device settings."}_`;
}
export const errors = {
	en: {
		title: "Enter a title of 1–80 characters.",
		date: "Use a real date: YYYY-MM-DD HH:mm (24-hour clock).",
		zone: "Use an IANA zone, for example Europe/Istanbul, America/New_York or UTC.",
		dst: "This time is skipped or occurs twice during a clock change. Choose an unambiguous time, or convert it to UTC and use UTC.",
		future: "Choose a future time within the next 366 days.",
		duration: "Duration must be 5–1440 whole minutes.",
		details: "Details must be at most 400 characters.",
	},
	tr: {
		title: "1–80 karakterlik başlık girin.",
		date: "Geçerli tarih girin: YYYY-MM-DD HH:mm (24 saat).",
		zone: "Europe/Istanbul, America/New_York veya UTC gibi IANA saat dilimi girin.",
		dst: "Bu saat, yaz/kış saati geçişinde yok veya iki kez oluşuyor. Başka saat seçin ya da UTC’ye çevirip UTC kullanın.",
		future: "Gelecekte, en fazla 366 gün sonraki bir saat seçin.",
		duration: "Süre 5–1440 arası tam dakika olmalı.",
		details: "Açıklama en fazla 400 karakter olmalı.",
	},
};
