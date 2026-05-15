import { describe, expect, it } from "vitest";
import {
	blockEnd,
	doneInsertIndex,
	findDoneSection,
	isBlockFullyDone,
	parseLines,
	splitLines,
	topLevelBlocks,
} from "./taskParser";

const SAMPLE = [
	"### To-DO",
	"- [x] Task 1",
	"\t- [x] Untertask1",
	"\t- [x] Untertask 2",
	"- [ ] Task 2",
	"- [ ] Task 3",
	"",
	"---",
	"",
	"### Done",
	"",
	"- [x] Erledigt 1",
].join("\n");

describe("parseLines", () => {
	it("classifies task and non-task lines", () => {
		const { lines } = splitLines(SAMPLE);
		const parsed = parseLines(lines);
		expect(parsed[0].isTask).toBe(false);
		expect(parsed[1].isTask).toBe(true);
		expect(parsed[1].checked).toBe(true);
		expect(parsed[4].isTask).toBe(true);
		expect(parsed[4].checked).toBe(false);
		expect(parsed[2].indent).toBe(1);
	});
});

describe("blockEnd", () => {
	it("includes indented sub-tasks but stops at the next top-level task", () => {
		const { lines } = splitLines(SAMPLE);
		expect(blockEnd(lines, 1)).toBe(3);
	});

	it("stops at a thematic break", () => {
		const { lines } = splitLines(SAMPLE);
		expect(blockEnd(lines, 5)).toBe(5);
	});
});

describe("topLevelBlocks", () => {
	it("returns outermost task blocks only", () => {
		const { lines } = splitLines(SAMPLE);
		const blocks = topLevelBlocks(lines, parseLines(lines));
		expect(blocks).toEqual([
			{ start: 1, end: 3 },
			{ start: 4, end: 4 },
			{ start: 5, end: 5 },
			{ start: 11, end: 11 },
		]);
	});
});

describe("isBlockFullyDone", () => {
	it("is true when the task and all sub-tasks are checked", () => {
		const { lines } = splitLines(SAMPLE);
		const parsed = parseLines(lines);
		expect(isBlockFullyDone(parsed, { start: 1, end: 3 })).toBe(true);
	});

	it("is false when a sub-task is unchecked", () => {
		const text = ["- [x] Parent", "\t- [ ] Sub"].join("\n");
		const { lines } = splitLines(text);
		const parsed = parseLines(lines);
		expect(isBlockFullyDone(parsed, { start: 0, end: 1 })).toBe(false);
	});
});

describe("findDoneSection / doneInsertIndex", () => {
	it("locates the Done heading and its content range", () => {
		const { lines } = splitLines(SAMPLE);
		const section = findDoneSection(lines, "Done");
		expect(section).not.toBeNull();
		expect(section?.headingIndex).toBe(9);
		expect(doneInsertIndex(lines, section!)).toBe(11);
	});

	it("returns null when the heading is missing", () => {
		const { lines } = splitLines("### To-DO\n- [ ] x");
		expect(findDoneSection(lines, "Done")).toBeNull();
	});
});
