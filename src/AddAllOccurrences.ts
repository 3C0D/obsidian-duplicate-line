import { Editor } from "obsidian";
import { getContent, getSelectionContent, selectionToRange } from "./utils";
import DuplicateLine from "./main";

export const addAllOccurrences = (editor: Editor, plugin?: DuplicateLine) => {
	let selections = editor.listSelections();
	const { word, wordRange } = getSelectionContent(editor, selections);
	selections = [];

	if (wordRange !== null && word) {

		const doc = getContent(editor);

		// Use case-insensitive search if matchCase is false
		const searchWord = (!plugin || !plugin.settings.matchCase) ? word.toLowerCase() : word;
		const searchDoc = (!plugin || !plugin.settings.matchCase) ? doc.toLowerCase() : doc;

		let nextOccurrenceIndex = searchDoc.indexOf(searchWord);
		let foundCount = 0;

		while (nextOccurrenceIndex !== -1) {
			const nextOccurrenceStart = editor.offsetToPos(nextOccurrenceIndex);
			const nextOccurrenceEnd = editor.offsetToPos(nextOccurrenceIndex + word.length);

			selections.push({
				anchor: nextOccurrenceStart,
				head: nextOccurrenceEnd,
			});

			foundCount++;
			nextOccurrenceIndex = searchDoc.indexOf(searchWord, nextOccurrenceIndex + word.length);
		}

		if (selections.length > 0) {
			const lastSelection = selections[selections.length - 1];
			const range = selectionToRange(lastSelection);
			editor.addHighlights([range], "is-flashing");
		}

		editor.removeHighlights("is-flashing");
		editor.setSelections(selections);
		for (const sel of selections) {
			const range = selectionToRange(sel);
			editor.addHighlights([range], "is-flashing");
		}
	}
};