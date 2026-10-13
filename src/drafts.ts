import { randomUUID } from "node:crypto";
import type { EventCard } from "./domain.js";
export interface Context {
	userId: string;
	guildId: string;
	channelId: string;
}
interface Draft {
	context: Context;
	card: EventCard;
	expires: number;
}
export class Drafts {
	private entries = new Map<string, Draft>();
	private cooldowns = new Map<string, number>();
	constructor(private clock: () => number = Date.now) {}
	prune() {
		const now = this.clock();
		for (const [id, item] of this.entries)
			if (item.expires <= now) this.entries.delete(id);
		for (const [guild, until] of this.cooldowns)
			if (until <= now) this.cooldowns.delete(guild);
	}
	add(context: Context, card: EventCard) {
		this.prune();
		for (const [id, item] of this.entries)
			if (
				item.context.userId === context.userId &&
				item.context.guildId === context.guildId
			)
				this.entries.delete(id);
		if (this.entries.size >= 1000) throw new Error("Draft capacity reached");
		const id = randomUUID();
		this.entries.set(id, { context, card, expires: this.clock() + 600000 });
		return id;
	}
	claim(id: string, context: Context, publish: boolean) {
		this.prune();
		const item = this.entries.get(id);
		if (
			!item ||
			Object.keys(context).some(
				(key) =>
					context[key as keyof Context] !== item.context[key as keyof Context],
			)
		)
			return undefined;
		if (publish && (this.cooldowns.get(context.guildId) ?? 0) > this.clock())
			return undefined;
		this.entries.delete(id); // Synchronous consumption prevents simultaneous clicks from posting twice.
		if (publish && item.card.start * 1000 <= this.clock()) return undefined;
		if (publish) this.cooldowns.set(context.guildId, this.clock() + 10000);
		return item.card;
	}
}
