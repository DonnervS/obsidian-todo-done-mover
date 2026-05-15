import { describe, expect, it } from "vitest";
import { moveCompletedTasks, moveSelectedTasks } from "./mover";
import { MoveOptions } from "./types";

const OPTS: MoveOptions = {
	doneHeading: "Done",
	appendDate: true,
	today: "2026-05-15",
};

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

describe("moveCompletedTasks", () => {
	it("moves a fully completed task with its sub-tasks", () => {
		const result = moveCompletedTasks(SAMPLE, OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [x] Task 1 ✅ 2026-05-15");
		expect(result.text).toContain("\t- [x] Untertask1 ✅ 2026-05-15");
		// Task 1 now lives below the Done heading.
		expect(result.text.indexOf("Task 1")).toBeGreaterThan(
			result.text.indexOf("### Done")
		);
		// Unfinished tasks stay put.
		expect(result.text).toContain("- [ ] Task 2");
		expect(result.text.indexOf("Task 2")).toBeLessThan(
			result.text.indexOf("### Done")
		);
	});

	it("leaves a task with an unchecked sub-task in place", () => {
		const text = [
			"### To-DO",
			"- [x] Parent",
			"\t- [ ] Sub",
			"",
			"### Done",
		].join("\n");
		const result = moveCompletedTasks(text, OPTS);
		expect(result.movedCount).toBe(0);
		expect(result.text).toBe(text);
	});

	it("creates the Done section when it is missing", () => {
		const text = "### To-DO\n- [x] Done task\n";
		const result = moveCompletedTasks(text, OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("### Done");
		expect(result.text).toContain("- [x] Done task ✅ 2026-05-15");
	});

	it("does not duplicate an existing completion date", () => {
		const text = ["### To-DO", "- [x] Old ✅ 2025-01-01", "", "### Done"].join(
			"\n"
		);
		const result = moveCompletedTasks(text, OPTS);
		expect(result.text).toContain("- [x] Old ✅ 2025-01-01");
		expect(result.text).not.toContain("2026-05-15");
	});

	it("does nothing when there is nothing completed", () => {
		const text = ["### To-DO", "- [ ] A", "- [ ] B", "", "### Done"].join("\n");
		const result = moveCompletedTasks(text, OPTS);
		expect(result.movedCount).toBe(0);
		expect(result.text).toBe(text);
	});
});

describe("moveSelectedTasks", () => {
	it("moves the selected task regardless of its checkbox state", () => {
		const result = moveSelectedTasks(SAMPLE, {
			...OPTS,
			selection: { startLine: 4, endLine: 4 },
		});
		expect(result.movedCount).toBe(1);
		// Task 2 is unchecked, so it moves without a completion date.
		expect(result.text).toContain("- [ ] Task 2");
		expect(result.text.indexOf("Task 2")).toBeGreaterThan(
			result.text.indexOf("### Done")
		);
		expect(result.text).not.toContain("Task 2 ✅");
	});

	it("ignores tasks that are already inside the Done section", () => {
		const result = moveSelectedTasks(SAMPLE, {
			...OPTS,
			selection: { startLine: 11, endLine: 11 },
		});
		expect(result.movedCount).toBe(0);
	});
});
