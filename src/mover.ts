// Pure task-moving logic — no Obsidian imports, fully unit-testable.

import { MoveOptions, MoveResult, TaskBlock } from "./types";
import {
	TASK_RE,
	blockEnd,
	doneInsertIndex,
	findDoneSection,
	isBlockFullyDone,
	parseLines,
	splitLines,
	topLevelBlocks,
} from "./taskParser";

/** Detects an already-present "✅ YYYY-MM-DD" completion date. */
const DATE_RE = /✅\s*\d{4}-\d{2}-\d{2}/;

/** Appends "✅ today" to checked checkbox lines that do not yet have a date. */
function appendDateToBlock(blockLines: string[], today: string): string[] {
	return blockLines.map((line) => {
		const m = line.match(TASK_RE);
		if (!m) return line;
		const checked = m[2] === "x" || m[2] === "X";
		if (!checked || DATE_RE.test(line)) return line;
		return line.replace(/\s*$/, "") + " ✅ " + today;
	});
}

/** Removes the first line's leading whitespace from every line of the block. */
function dedent(blockLines: string[]): string[] {
	const first = blockLines[0] ?? "";
	const rootIndent = (first.match(/^\s*/)?.[0] ?? "").length;
	if (rootIndent === 0) return blockLines.slice();
	return blockLines.map((line) => {
		let removed = 0;
		let k = 0;
		while (k < line.length && removed < rootIndent && /\s/.test(line[k])) {
			k++;
			removed++;
		}
		return line.slice(k);
	});
}

/** True when a block starts inside the Done section (and so must not be moved). */
function inDoneSection(
	block: TaskBlock,
	section: { headingIndex: number; contentEnd: number } | null
): boolean {
	return (
		section !== null &&
		block.start >= section.headingIndex &&
		block.start < section.contentEnd
	);
}

/**
 * Moves the given blocks into the Done section. Pure: takes document text,
 * returns new text. Blocks already inside the Done section must be filtered
 * out by the caller.
 */
function performMove(text: string, blocksToMove: TaskBlock[], opts: MoveOptions): MoveResult {
	if (blocksToMove.length === 0) return { text, movedCount: 0 };

	const { lines, eol } = splitLines(text);
	const blocks = [...blocksToMove].sort((a, b) => a.start - b.start);

	const movedSet = new Set<number>();
	for (const b of blocks) {
		for (let i = b.start; i <= b.end; i++) movedSet.add(i);
	}

	let movedLines: string[] = [];
	for (const b of blocks) {
		let blockLines = dedent(lines.slice(b.start, b.end + 1));
		if (opts.appendDate) blockLines = appendDateToBlock(blockLines, opts.today);
		movedLines = movedLines.concat(blockLines);
	}

	const section = findDoneSection(lines, opts.doneHeading);
	const result: string[] = [];

	if (section) {
		const insertAfter = doneInsertIndex(lines, section);
		for (let i = 0; i < lines.length; i++) {
			if (!movedSet.has(i)) result.push(lines[i]);
			if (i === insertAfter) result.push(...movedLines);
		}
	} else {
		for (let i = 0; i < lines.length; i++) {
			if (!movedSet.has(i)) result.push(lines[i]);
		}
		if (result.length > 0 && result[result.length - 1].trim() !== "") {
			result.push("");
		}
		result.push("### " + opts.doneHeading.trim());
		result.push("");
		result.push(...movedLines);
	}

	return { text: result.join(eol), movedCount: blocks.length };
}

/** Moves every fully completed top-level task into the Done section. */
export function moveCompletedTasks(text: string, opts: MoveOptions): MoveResult {
	const { lines } = splitLines(text);
	const parsed = parseLines(lines);
	const section = findDoneSection(lines, opts.doneHeading);
	const blocks = topLevelBlocks(lines, parsed).filter(
		(b) => !inDoneSection(b, section) && isBlockFullyDone(parsed, b)
	);
	return performMove(text, blocks, opts);
}

export interface SelectionRange {
	startLine: number;
	endLine: number;
}

/**
 * Moves the top-level task blocks touched by the selection into the Done
 * section, regardless of their checkbox state.
 */
export function moveSelectedTasks(
	text: string,
	opts: MoveOptions & { selection: SelectionRange }
): MoveResult {
	const { lines } = splitLines(text);
	const parsed = parseLines(lines);
	const section = findDoneSection(lines, opts.doneHeading);
	const { startLine, endLine } = opts.selection;
	const blocks = topLevelBlocks(lines, parsed).filter(
		(b) => !inDoneSection(b, section) && b.start <= endLine && b.end >= startLine
	);
	return performMove(text, blocks, opts);
}

// Re-exported so callers can build blocks without reaching into taskParser.
export { blockEnd };
