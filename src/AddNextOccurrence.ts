import { Editor } from "obsidian";
import { getContent, getSelectionContent, rangeToPositions, selectionToRange } from "./utils.ts";
import { escapeRegExp } from "lodash";
import DuplicateLine from "./main.ts";

export const addNextOccurrence = (editor: Editor, plugin?: DuplicateLine): void => {
	const selections = editor.listSelections();
	const { word, wordRange, isWordSelected } = getSelectionContent(
		editor,
		selections
	);
	if (wordRange !== null && word) {
		// Get plugin instance to access settings
		if (!plugin) {
			plugin = (window as any).app?.plugins?.plugins?.['duplicate-line'] as DuplicateLine;
		}

		const doc = getContent(editor);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_, endPos] = rangeToPositions(wordRange);
		const pos = editor.posToOffset(endPos);

		// Use regex search for consistency with other functions
		let modifiers = 'g';
		if (!plugin || !plugin.settings.matchCase) {
			modifiers += 'i';
		}

		let regex: RegExp;
		try {
			regex = new RegExp(escapeRegExp(word.trim()), modifiers);
		} catch (error) {
			console.warn(error);
			return;
		}

		// Find all matches after current position
		const textAfterCursor = doc.substring(pos);
		const match = regex.exec(textAfterCursor);

		if (match && match.index !== undefined) {
			const nextOccurrenceIndex = pos + match.index;
			const nextOccurrenceStart = editor.offsetToPos(nextOccurrenceIndex);
			const nextOccurrenceEnd = editor.offsetToPos(
				nextOccurrenceIndex + match[0].length
			);

			editor.removeHighlights("is-flashing");

			if (!isWordSelected)
				selections[selections.length - 1] = {
					anchor: wordRange.from,
					head: wordRange.to,
				};

			if (isWordSelected)
				selections.push({
					anchor: nextOccurrenceStart,
					head: nextOccurrenceEnd,
				});

			editor.setSelections(selections);

			for (const sel of selections) {
				const range = selectionToRange(sel);
				editor.addHighlights([range], "is-flashing");
			}
		}
	}
};




