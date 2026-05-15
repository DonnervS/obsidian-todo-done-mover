// Pure markdown parsing helpers — no Obsidian imports, fully unit-testable.

import { TaskBlock } from "./types";

/** Matches a checkbox task line: indent, state char, rest of the text. */
export const TASK_RE = /^(\s*)- \[([ xX])\] ?(.*)$/;

const HEADING_RE = /^#{1,6}\s+/;
/** A thematic break: a line of only -, * or _ (3 or more), optionally spaced. */
const THEMATIC_BREAK_RE = /^\s*([-*_])(\s*\1){2,}\s*$/;

export interface ParsedLine {
	raw: string;
	isTask: boolean;
	/** Number of leading whitespace characters. */
	indent: number;
	/** Whether a task line's checkbox is checked. False for non-task lines. */
	checked: boolean;
}

/** Splits text into lines and remembers the line ending so it can be restored. */
export function splitLines(text: string): { lines: string[]; eol: string } {
	const eol = text.includes("\r\n") ? "\r\n" : "\n";
	return { lines: text.split(/\r?\n/), eol };
}

function leadingWhitespace(line: string): number {
	const m = line.match(/^\s*/);
	return m ? m[0].length : 0;
}

export function isHeading(line: string): boolean {
	return HEADING_RE.test(line);
}

export function isThematicBreak(line: string): boolean {
	return THEMATIC_BREAK_RE.test(line);
}

/** Classifies every line as a task line or not. */
export function parseLines(lines: string[]): ParsedLine[] {
	return lines.map((raw) => {
		const m = raw.match(TASK_RE);
		if (m) {
			return {
				raw,
				isTask: true,
				indent: m[1].length,
				checked: m[2] === "x" || m[2] === "X",
			};
		}
		return { raw, isTask: false, indent: leadingWhitespace(raw), checked: false };
	});
}

/**
 * Returns the index of the last line belonging to the task block that starts
 * at `startIndex`: the task line plus every following deeper-indented line.
 * Internal blank lines are kept; trailing blank lines, headings and thematic
 * breaks end the block.
 */
export function blockEnd(lines: string[], startIndex: number): number {
	const baseIndent = leadingWhitespace(lines[startIndex]);
	let end = startIndex;
	for (let i = startIndex + 1; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim() === "") continue;
		if (isHeading(line) || isThematicBreak(line)) break;
		if (leadingWhitespace(line) > baseIndent) {
			end = i;
		} else {
			break;
		}
	}
	return end;
}

/**
 * Finds the outermost task blocks across the whole document, in document
 * order. Nested sub-tasks are contained within their parent's block and are
 * not returned separately.
 */
export function topLevelBlocks(lines: string[], parsed: ParsedLine[]): TaskBlock[] {
	const blocks: TaskBlock[] = [];
	let i = 0;
	while (i < lines.length) {
		if (parsed[i].isTask) {
			const end = blockEnd(lines, i);
			blocks.push({ start: i, end });
			i = end + 1;
		} else {
			i++;
		}
	}
	return blocks;
}

/**
 * A block is "fully done" when its root checkbox is checked AND every task
 * line inside the block is checked too.
 */
export function isBlockFullyDone(parsed: ParsedLine[], block: TaskBlock): boolean {
	if (!parsed[block.start].isTask || !parsed[block.start].checked) return false;
	for (let i = block.start; i <= block.end; i++) {
		if (parsed[i].isTask && !parsed[i].checked) return false;
	}
	return true;
}

export interface DoneSection {
	/** Line index of the "### Done" heading. */
	headingIndex: number;
	/** First line index after the heading. */
	contentStart: number;
	/** Exclusive end: first line index no longer part of the section. */
	contentEnd: number;
}

/**
 * Locates the section whose heading text matches `headingName`
 * (case-insensitive). The section runs until the next heading, thematic
 * break, or end of file.
 */
export function findDoneSection(lines: string[], headingName: string): DoneSection | null {
	const target = headingName.trim().toLowerCase();
	for (let i = 0; i < lines.length; i++) {
		const m = lines[i].match(/^#{1,6}\s+(.*?)\s*$/);
		if (m && m[1].trim().toLowerCase() === target) {
			let end = lines.length;
			for (let j = i + 1; j < lines.length; j++) {
				if (isHeading(lines[j]) || isThematicBreak(lines[j])) {
					end = j;
					break;
				}
			}
			return { headingIndex: i, contentStart: i + 1, contentEnd: end };
		}
	}
	return null;
}

/**
 * Returns the line index after which new entries should be inserted into the
 * Done section: the last non-blank line of the section, or the heading itself
 * when the section is empty.
 */
export function doneInsertIndex(lines: string[], section: DoneSection): number {
	let idx = section.headingIndex;
	for (let i = section.contentStart; i < section.contentEnd; i++) {
		if (lines[i].trim() !== "") idx = i;
	}
	return idx;
}
