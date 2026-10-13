import test from "node:test";
import assert from "node:assert/strict";
import {
	ChannelType,
	PermissionFlagsBits,
	PermissionsBitField,
	type Interaction,
} from "discord.js";
import { handle, modal, command } from "../src/discord.js";
import { Drafts } from "../src/drafts.js";
import { makeCard } from "../src/domain.js";
const origin = Date.parse("2026-01-01T00:00:00Z");
const card = makeCard(
	{
		title: "Club",
		local: "2026-06-01 19:30",
		zone: "UTC",
		duration: "",
		details: "",
		language: "en",
	},
	origin,
);
function fake(kind = "button") {
	const calls: { method: string; value: unknown }[] = [];
	const record = (method: string) => async (value: unknown) => {
		calls.push({ method, value });
	};
	return {
		calls,
		value: {
			isChatInputCommand: () => kind === "command",
			isModalSubmit: () => kind === "modal",
			isButton: () => kind === "button",
			inGuild: () => true,
			guildId: "g",
			channelId: "c",
			user: { id: "u" },
			locale: "en-US",
			commandName: "gather",
			customId: "gc:form:en",
			options: { getString: () => "en" },
			memberPermissions: new PermissionsBitField(
				PermissionFlagsBits.ManageEvents,
			),
			appPermissions: new PermissionsBitField([
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.SendMessages,
			]),
			channel: { type: ChannelType.GuildText, send: record("send") },
			reply: record("reply"),
			deferReply: record("deferReply"),
			deferUpdate: record("deferUpdate"),
			editReply: record("editReply"),
			showModal: record("showModal"),
			fields: {
				getTextInputValue: (key: string) =>
					({
						title: "Club",
						local: "not-a-date",
						zone: "UTC",
						duration: "",
						details: "",
					})[key as "title"],
			},
		},
	};
}
const asInteraction = (f: ReturnType<typeof fake>) =>
	f.value as unknown as Interaction;
test("command and modal serialize with bounded Discord inputs", () => {
	assert.equal(command.toJSON().contexts?.[0], 0);
	assert.equal(modal("tr").toJSON().components.length, 5);
	assert.equal(modal("en").toJSON().custom_id, "gc:form:en");
});
test("slash command opens a private form without sending a card", async () => {
	const f = fake("command");
	await handle(asInteraction(f), new Drafts(), "g");
	assert.deepEqual(
		f.calls.map((c) => c.method),
		["showModal"],
	);
});
test("wrong server and thread are rejected", async () => {
	const f = fake("command");
	await handle(asInteraction(f), new Drafts(), "other");
	assert.deepEqual(
		f.calls.map((c) => c.method),
		["reply"],
	);
	const t = fake("command");
	t.value.channel.type = ChannelType.PublicThread;
	await handle(asInteraction(t), new Drafts(), "g");
	assert.deepEqual(
		t.calls.map((c) => c.method),
		["reply"],
	);
});
test("permission revocation blocks a previously valid publish", async () => {
	const f = fake();
	const d = new Drafts(() => origin);
	f.value.customId = `gc:publish:en:${d.add({ userId: "u", guildId: "g", channelId: "c" }, card)}`;
	f.value.memberPermissions = new PermissionsBitField();
	await handle(asInteraction(f), d, "g");
	assert.ok(!f.calls.some((c) => c.method === "send"));
	assert.equal(f.calls[0]?.method, "reply");
});
test("missing bot permissions does not consume draft", async () => {
	const f = fake();
	const d = new Drafts(() => origin);
	const context = { userId: "u", guildId: "g", channelId: "c" };
	const id = d.add(context, card);
	f.value.customId = `gc:publish:en:${id}`;
	f.value.appPermissions = new PermissionsBitField();
	await handle(asInteraction(f), d, "g");
	assert.ok(d.claim(id, context, true));
	assert.ok(!f.calls.some((c) => c.method === "send"));
});
test("double publish clicks produce one message with mentions disabled", async () => {
	const f = fake();
	const d = new Drafts(() => origin);
	f.value.customId = `gc:publish:en:${d.add({ userId: "u", guildId: "g", channelId: "c" }, card)}`;
	await Promise.all([
		handle(asInteraction(f), d, "g"),
		handle(asInteraction(f), d, "g"),
	]);
	const sends = f.calls.filter((c) => c.method === "send");
	assert.equal(sends.length, 1);
	const sent = sends[0];
	assert.ok(sent);
	assert.deepEqual(
		(sent.value as { allowedMentions: unknown }).allowedMentions,
		{ parse: [], repliedUser: false },
	);
});
test("cancel removes buttons without public messages", async () => {
	const f = fake();
	const d = new Drafts(() => origin);
	f.value.customId = `gc:cancel:en:${d.add({ userId: "u", guildId: "g", channelId: "c" }, card)}`;
	await handle(asInteraction(f), d, "g");
	assert.deepEqual(
		f.calls.map((c) => c.method),
		["deferUpdate", "editReply"],
	);
});
test("invalid modal input is deferred privately then explained", async () => {
	const f = fake("modal");
	await handle(asInteraction(f), new Drafts(), "g");
	assert.deepEqual(
		f.calls.map((c) => c.method),
		["deferReply", "editReply"],
	);
	assert.match(JSON.stringify(f.calls), /YYYY-MM-DD/);
});
test("network failure consumes draft and warns to check for duplicates", async () => {
	const f = fake();
	const d = new Drafts(() => origin);
	const context = { userId: "u", guildId: "g", channelId: "c" };
	const id = d.add(context, card);
	f.value.customId = `gc:publish:en:${id}`;
	f.value.channel.send = async () => {
		throw new Error("test failure");
	};
	await handle(asInteraction(f), d, "g");
	assert.equal(d.claim(id, context, true), undefined);
	assert.match(JSON.stringify(f.calls), /Check the channel/);
});
test("valid modal creates private preview with two working actions", async () => {
	const f = fake("modal");
	const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
	f.value.fields.getTextInputValue = (key) =>
		({
			title: "Community meetup",
			local: `${tomorrow} 19:30`,
			zone: "UTC",
			duration: "90",
			details: "Bring questions",
		})[key as "title"];
	await handle(asInteraction(f), new Drafts(), "g");
	assert.deepEqual(
		f.calls.map((c) => c.method),
		["deferReply", "editReply"],
	);
	assert.match(JSON.stringify(f.calls), /Private preview/);
	const preview = f.calls[1]?.value as {
		components: { toJSON(): { components: { custom_id?: string }[] } }[];
	};
	const buttons = preview.components[0]?.toJSON().components;
	assert.equal(buttons?.length, 2);
	assert.match(buttons?.[0]?.custom_id ?? "", /^gc:publish:en:/);
	assert.match(buttons?.[1]?.custom_id ?? "", /^gc:cancel:en:/);
});
