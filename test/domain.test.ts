import test from "node:test";
import assert from "node:assert/strict";
import { InputError, makeCard, plain, render } from "../src/domain.js";
import { config } from "../src/config.js";
const now = Date.parse("2026-01-01T00:00:00Z");
const input = {
	title: "Study club",
	local: "2026-06-01 19:30",
	zone: "Europe/Istanbul",
	duration: "60",
	details: "",
	language: "en" as const,
};
function rejects(change: Partial<typeof input>, key: string) {
	assert.throws(
		() => makeCard({ ...input, ...change }, now),
		(e) => e instanceof InputError && e.key === key,
	);
}
test("Istanbul converts to exact UTC instant and duration", () => {
	const c = makeCard(input, now);
	assert.equal(c.start, Date.parse("2026-06-01T16:30:00Z") / 1000);
	assert.equal(c.end - c.start, 3600);
});
test("UTC and Kathmandu quarter-hour offset work", () => {
	assert.equal(
		makeCard({ ...input, zone: "Asia/Kathmandu" }, now).start,
		Date.parse("2026-06-01T13:45:00Z") / 1000,
	);
	assert.equal(
		makeCard({ ...input, zone: "UTC" }, now).start,
		Date.parse("2026-06-01T19:30:00Z") / 1000,
	);
});
test("rejects nonexistent New York spring time", () =>
	rejects({ local: "2026-03-08 02:30", zone: "America/New_York" }, "dst"));
test("rejects ambiguous New York autumn time", () =>
	rejects({ local: "2026-11-01 01:30", zone: "America/New_York" }, "dst"));
test("rejects European DST gap and fold", () => {
	rejects({ local: "2026-03-29 01:30", zone: "Europe/London" }, "dst");
	rejects({ local: "2026-10-25 01:30", zone: "Europe/London" }, "dst");
});
test("accepts unambiguous time after DST change", () =>
	assert.equal(
		makeCard(
			{ ...input, local: "2026-03-08 03:30", zone: "America/New_York" },
			now,
		).start,
		Date.parse("2026-03-08T07:30:00Z") / 1000,
	));
test("rejects invalid dates and implicit date coercion", () => {
	for (const local of [
		"2026-02-30 12:00",
		"2026-13-01 12:00",
		"2026-06-01 25:00",
		"01/06/2026 12:00",
		"2026-06-01T12:00",
	])
		rejects({ local }, "date");
});
test("rejects invalid zones, abbreviations and numeric offsets", () => {
	for (const zone of ["EST", "+03:00", "Moon/Base", "Europe/Istanbul@everyone"])
		rejects({ zone }, "zone");
});
test("rejects past and too-distant dates", () => {
	rejects({ local: "2025-12-31 20:00" }, "future");
	rejects({ local: "2027-02-01 20:00" }, "future");
});
test("rejects whitespace titles and long details", () => {
	rejects({ title: " " }, "title");
	rejects({ title: "\u200b" }, "title");
	rejects({ title: "a".repeat(81) }, "title");
	rejects({ details: "a".repeat(401) }, "details");
});
test("duration defaults and limits are enforced", () => {
	assert.equal(
		makeCard({ ...input, duration: "" }, now).end - makeCard(input, now).start,
		3600,
	);
	for (const duration of ["0", "4", "1441", "-10", "2.5", "1e2"])
		rejects({ duration }, "duration");
	assert.equal(
		makeCard({ ...input, duration: "1440" }, now).end -
			makeCard(input, now).start,
		86400,
	);
});
test("renders bilingual timestamp cards below message limit", () => {
	const c = makeCard({ ...input, details: "*".repeat(400) }, now);
	assert.match(render(c), /Starts: <t:\d+:F>/);
	assert.match(render({ ...c, language: "tr" }), /Başlangıç:/);
	assert.ok(render(c).length < 2000);
});
test("neutralizes mentions, links, markdown and injected timestamps", () => {
	const text = plain(
		"@everyone <@123> <t:123:F> **bad** https://evil.test\u202e",
	);
	assert.ok(!text.includes("@"));
	assert.ok(!text.includes("<"));
	assert.ok(!text.includes("https://"));
	assert.ok(!text.includes("\u202e"));
	assert.match(text, /\\\*/);
});
test("requires explicit single-guild configuration", () => {
	assert.throws(() => config({}));
	assert.throws(() =>
		config({
			DISCORD_TOKEN: "fake",
			DISCORD_APPLICATION_ID: "bad",
			DISCORD_GUILD_ID: "123",
		}),
	);
	assert.equal(
		config({
			DISCORD_TOKEN: "test-only",
			DISCORD_APPLICATION_ID: "12345678901234567",
			DISCORD_GUILD_ID: "12345678901234568",
		}).guildId,
		"12345678901234568",
	);
});
