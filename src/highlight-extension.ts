/**
 * HIGHLIGHT EXTENSION - CodeMirror Integration (Currently UNUSED)
 *
 * This file contains a CodeMirror extension that would provide real-time highlighting
 * of text occurrences as you type or select text in the editor.
 *
 * 🚫 CURRENTLY NOT USED because:
 * - The current system (status bar + manual selections) works perfectly
 * - CodeMirror extensions are complex and harder to maintain
 * - The current approach is more predictable and user-controlled
 *
 * 🔮 POTENTIAL FUTURE ENHANCEMENTS:
 * - Real-time highlighting: All occurrences highlighted as you select text
 * - Word-under-cursor highlighting: Automatic highlighting when cursor is on a word
 * - Performance optimized: Only highlights visible text ranges
 * - Respects user settings: Uses the same color system and case sensitivity
 *
 * 💡 TO ACTIVATE: Uncomment lines 33-35 in main.ts:
 * if (this.settings.highlightOccurrences) {
 *     this.registerEditorExtension(createHighlightExtension(this));
 * }
 *
 * ⚠️ NOTE: This would add automatic highlighting ON TOP of the current system,
 * not replace it. The status bar counter and color picker would still work.
 */

import { SearchCursor } from "@codemirror/search";
import { Extension } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { debounce } from "obsidian";
import DuplicateLine from "./main";

export function createHighlightExtension(plugin: DuplicateLine): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;
            plugin: DuplicateLine;
            delayedGetDeco: any;

            constructor(view: EditorView) {
                this.plugin = plugin;
                this.delayedGetDeco = debounce(
                    (view: EditorView) => {
                        this.decorations = this.getDeco(view);
                        view.update([]);
                    },
                    300,
                    true
                );
                this.decorations = this.getDeco(view);
            }

            update(update: ViewUpdate) {
                if (update.selectionSet || update.docChanged || update.viewportChanged) {
                    // Clear decorations immediately to prevent flickering
                    setTimeout(() => {
                        this.decorations = Decoration.none;
                        update.view.update([]);
                    }, 50);

                    this.delayedGetDeco(update.view);
                }
            }

            getDeco(view: EditorView): DecorationSet {
                if (!this.plugin.settings.highlightOccurrences) return Decoration.none;

                const { state } = view;
                const sel = state.selection;

                if (sel.ranges.length > 1) return Decoration.none;

                const range = sel.main;
                let query: string;
                let matchType: string;

                if (range.empty) {
                    // No selection - highlight word under cursor
                    matchType = "word";
                    const word = state.wordAt(range.head);
                    if (!word) return Decoration.none;
                    query = state.sliceDoc(word.from, word.to);
                } else {
                    // Text selected - highlight all occurrences
                    matchType = "selection";
                    const len = range.to - range.from;
                    if (len < 2 || len > 200) return Decoration.none;
                    query = state.sliceDoc(range.from, range.to).trim();
                    if (!query) return Decoration.none;
                }

                if (query.length < 2) return Decoration.none;

                const deco: any[] = [];

                for (const part of view.visibleRanges) {
                    const caseTransform = this.plugin.settings.matchCase ? (s: string) => s : (s: string) => s.toLowerCase();
                    const cursor = new SearchCursor(state.doc, query, part.from, part.to, caseTransform);

                    while (!cursor.next().done) {
                        const { from, to } = cursor.value;
                        const string = state.sliceDoc(from, to);

                        // Determine if this is the current selection or a match
                        const isCurrent = from >= range.from && to <= range.to && !range.empty;
                        const className = isCurrent
                            ? `duplicate-line-current-${matchType}`
                            : `duplicate-line-match-${matchType}`;

                        const decoration = Decoration.mark({
                            class: className,
                            attributes: { "data-contents": string },
                        });

                        deco.push(decoration.range(from, to));

                        if (deco.length > 100) return Decoration.none;
                    }
                }

                // Only show highlights if we have at least 2 matches (or 1 if text is selected)
                const minMatches = range.empty ? 2 : 1;
                if (deco.length < minMatches) return Decoration.none;

                return Decoration.set(deco);
            }
        },
        {
            decorations: v => v.decorations,
        }
    );
}
