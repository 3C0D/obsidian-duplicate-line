import { debounce } from "obsidian";
import DuplicateLine from "./main";
import { getEditor, getContent } from "./utils";
import { escapeRegExp } from "lodash";

export const handleSelectionChange = (plugin: DuplicateLine) => {
    reset(plugin)
    const debounced = debounce(async () => {
        plugin.nb = getOccurrences(plugin);
        if (plugin.settings.showOccurences && plugin.nb > 1) {
            if (!plugin.statusBarItemEl) {
                await addStatusBarReps.bind(plugin)(plugin)
            }
        } else {
            reset(plugin)
        }
    }, 300, true);
    debounced()
}

export function reset(plugin: DuplicateLine) {
    plugin.selectionRegex = null
    plugin.nb = 0
    plugin.statusBarItemEl?.detach()
    plugin.statusBarItemEl = null
}

export async function addStatusBarReps(plugin: DuplicateLine) {
    plugin.statusBarItemEl = await this.addStatusBarItem() as HTMLElement
    const { statusBarItemEl } = plugin
    const caseIndicator = plugin.settings.matchCase ? ' (Aa)' : '';
    statusBarItemEl.setText(`${plugin.nb} Reps${caseIndicator}`);
    statusBarItemEl.style.color = plugin.settings.color;
    statusBarItemEl.style.fontSize = `${plugin.settings.fontSize}em`;
}


function getEditorContent(plugin: DuplicateLine) {
    const editor = getEditor(plugin);
    let text = "";
    if (editor) {
        text = getContent(editor);
    }
    return {
        editor,
        text
    }
}

export function getOccurrences(plugin: DuplicateLine): number {
    const { editor, text } = getEditorContent(plugin);
    if (!editor) return 0
    const selection = editor.getSelection().trim();
    if (!selection || selection.length < 2) return 0;

    if (!plugin.selectionRegex) {
        compileRegex(plugin, selection);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (plugin.selectionRegex!.source !== escapeRegExp(selection) ||
        (plugin.settings.matchCase && plugin.selectionRegex!.flags.includes('i')) ||
        (!plugin.settings.matchCase && !plugin.selectionRegex!.flags.includes('i'))) {
        compileRegex(plugin, selection);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const matches = [...text.matchAll(plugin.selectionRegex!)];

    return matches.length;
}

function compileRegex(plugin: DuplicateLine, selection: string) {
    let modifiers = 'g';
    if (!plugin.settings.matchCase) {
        modifiers += 'i';
    }
    try {
        plugin.selectionRegex = new RegExp(escapeRegExp(selection), modifiers);
    } catch (error) {
        console.warn(error);
    }
}


