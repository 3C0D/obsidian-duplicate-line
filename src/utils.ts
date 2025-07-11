import {
	Editor,
	type EditorPosition,
	type EditorRange,
	type EditorSelection,
	MarkdownView,
} from "obsidian";
import { sortBy } from "lodash";
import DuplicateLine from "./main.ts";
import { Direction } from "./variables/variables.ts";

export function selectionToLine(
	editor: Editor,
	selection: EditorSelection,
	direction: Direction
): EditorRange {
	let range = selectionToRange(selection, true);
	const isEmptySelection = isNoSelection(selection);
	const toLength = editor.getLine(range.to.line).length;

	if (direction === Direction.Up || direction === Direction.Down) {
		return {
			from: { line: range.from.line, ch: 0 },
			to: { line: range.to.line, ch: toLength },
		};
	} else if (
		direction === Direction.SelDown ||
		direction === Direction.SelUp ||
		direction === Direction.RightDown
	) {
		return isEmptySelection
			? {
				from: { line: range.to.line, ch: 0 },
				to: { line: range.to.line, ch: toLength },
			}
			: range;
	} else {
		// selection right/left
		// if no selection word before cursor
		if (isEmptySelection) {
			const line = range.from.line;
			const ch = range.from.ch;
			if (ch > 0) {
				const currentLine = editor.getLine(line);
				// find previous word
				let startOfWord = ch - 1;
				while (
					startOfWord >= 0 &&
					/\S/.test(currentLine[startOfWord])
				) {
					startOfWord--;
				}
				startOfWord++;
				// extract previous word
				const contentLength = currentLine.slice(startOfWord, ch).length;
				range = {
					from: { line: line, ch: ch - contentLength },
					to: { line: line, ch: ch },
				};
				return range;
			}
		}
		return {
			from: range.from,
			to: range.to,
		};
	}
}



interface Position {
	line: number;
	ch: number;
}

export function areObjectsEqual(obj1: Position, obj2: Position): boolean {
	return obj1.line === obj2.line && obj1.ch === obj2.ch;
}

export function isNoSelection(selection: EditorSelection): boolean {
	const { anchor, head } = selection;
	return anchor.ch === head.ch && anchor.line === head.line;
}

export function selectionToRange(
	selection: EditorSelection,
	sort?: boolean
): EditorRange {
	const positions = [selection.anchor, selection.head];
	let sorted = positions;
	if (sort) {
		sorted = sortBy(positions, ["line", "ch"]);
	}
	return {
		from: sorted[0],
		to: sorted[1],
	};
}

export function rangeToPositions(
	range: EditorRange
): [EditorPosition, EditorPosition] {
	const startPos: EditorPosition = range.from;
	const endPos: EditorPosition = range.to;
	return [startPos, endPos];
}

export const getContent = (ed: Editor): string => {
	return ed.getValue();
};

export const getSelectionContent = (
	ed: Editor,
	selections: EditorSelection[]
): { wordRange: EditorRange | null; word: string; isWordSelected: boolean } => {

	// EditorSelection anchor: EditorPosition; head: EditorPosition
	const lastSelection: EditorSelection = selections[selections.length - 1];
	const selection = ed.getSelection();
	let wordRange;

	if (selection) {
		wordRange = selectionToRange(lastSelection, true);
	} else {
		wordRange = ed.wordAt(lastSelection.head);
	}

	// wordRange: EditorRange from: EditorPosition to: EditorPosition;
	if (wordRange != null) {
		const { from, to } = wordRange;
		const word = ed.getRange(from, to);
		const isWordSelected =
			from.line === lastSelection.anchor.line &&
			from.ch === lastSelection.anchor.ch &&
			to.line === lastSelection.head.line &&
			to.ch === lastSelection.head.ch;
		return { wordRange, word, isWordSelected };
	}
	return { wordRange: null, word: "", isWordSelected: false };
};


export function getEditor(plugin: DuplicateLine): Editor | undefined {
	const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!activeView) return;
	const editor = activeView.editor;
	return editor;
}