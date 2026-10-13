import test from "node:test";
import assert from "node:assert/strict";
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
const context = { userId: "u", guildId: "g", channelId: "c" };
test("only original user, guild and channel can consume draft", () => {
	const d = new Drafts(() => origin);
	const id = d.add(context, card);
	for (const key of ["userId", "guildId", "channelId"])
		assert.equal(d.claim(id, { ...context, [key]: "other" }, true), undefined);
	assert.deepEqual(d.claim(id, context, true), card);
});
test("publish is consumed once, including rapid clicks", () => {
	const d = new Drafts(() => origin);
	const id = d.add(context, card);
	assert.ok(d.claim(id, context, true));
	assert.equal(d.claim(id, context, true), undefined);
});
test("cancellation consumes without triggering cooldown", () => {
	const d = new Drafts(() => origin);
	assert.ok(d.claim(d.add(context, card), context, false));
	assert.ok(d.claim(d.add(context, card), context, true));
});
test("draft expires at ten minutes", () => {
	let now = origin;
	const d = new Drafts(() => now);
	const id = d.add(context, card);
	now += 600000;
	assert.equal(d.claim(id, context, true), undefined);
});
test("new preview replaces previous user draft in server", () => {
	const d = new Drafts(() => origin);
	const old = d.add(context, card);
	const fresh = d.add(context, card);
	assert.equal(d.claim(old, context, true), undefined);
	assert.ok(d.claim(fresh, context, true));
});
test("per-server cooldown expires without deleting next draft", () => {
	let now = origin;
	const d = new Drafts(() => now);
	d.claim(d.add(context, card), context, true);
	const id = d.add(context, card);
	assert.equal(d.claim(id, context, true), undefined);
	now += 10000;
	assert.ok(d.claim(id, context, true));
});
test("time passing beyond event start prevents publication", () => {
	let now = origin;
	const d = new Drafts(() => now);
	const soon = { ...card, start: (now + 1000) / 1000 };
	const id = d.add(context, soon);
	now += 2000;
	assert.equal(d.claim(id, context, true), undefined);
});
test("bounds memory by refusing a thousand-and-first active draft", () => {
	const d = new Drafts(() => origin);
	for (let n = 0; n < 1000; n++) d.add({ ...context, userId: String(n) }, card);
	assert.throws(() => d.add({ ...context, userId: "overflow" }, card));
});
