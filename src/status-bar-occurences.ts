import { debounce, Editor, Menu } from "obsidian";
import DuplicateLine from "./main.ts";
import { getEditor, getContent } from "./utils.ts";
import { escapeRegExp } from "lodash";

export const handleSelectionChange = (plugin: DuplicateLine): void => {
    reset(plugin);
    const debounced = debounce(async () => {
        plugin.nb = getOccurrences(plugin);
        if (plugin.settings.showOccurences && plugin.nb >= 1) {
            if (!plugin.statusBarItemEl) {
                await addStatusBarReps.bind(plugin)(plugin);
            }
        } else {
            reset(plugin);
        }
    }, 300, true);
    debounced();
};

export function reset(plugin: DuplicateLine): void {
    plugin.selectionRegex = null;
    plugin.nb = 0;
    plugin.statusBarItemEl?.detach();
    plugin.statusBarItemEl = null;
}

export async function addStatusBarReps(plugin: DuplicateLine): Promise<void> {
    plugin.statusBarItemEl = await this.addStatusBarItem() as HTMLElement;
    const { statusBarItemEl } = plugin;
    const caseIndicator = plugin.settings.matchCase ? ' (Aa)' : '';
    statusBarItemEl.setText(`${plugin.nb} Reps${caseIndicator}`);
    statusBarItemEl.style.color = plugin.settings.color;
    statusBarItemEl.style.fontSize = `${plugin.settings.fontSize}em`;
    statusBarItemEl.style.cursor = 'pointer';

    // Add click handler for context menu
    statusBarItemEl.addEventListener('click', (event) => {
        showStatusBarContextMenu(plugin, event);
    });
}

function getEditorContent(plugin: DuplicateLine): { editor: Editor | null; text: string } {
    const editor = getEditor(plugin) ?? null;
    let text = "";
    if (editor) {
        text = getContent(editor);
    }
    return {
        editor,
        text
    };
}

export function getOccurrences(plugin: DuplicateLine): number {
    const { editor, text } = getEditorContent(plugin);
    if (!editor) return 0;
    const selection = editor.getSelection().trim();
    if (!selection || selection.length < 2) return 0;

    if (!plugin.selectionRegex) {
        compileRegex(plugin, selection);
    }
     
    if (plugin.selectionRegex!.source !== escapeRegExp(selection) ||
        (plugin.settings.matchCase && plugin.selectionRegex!.flags.includes('i')) ||
        (!plugin.settings.matchCase && !plugin.selectionRegex!.flags.includes('i'))) {
        compileRegex(plugin, selection);
    }

     
    const matches = [...text.matchAll(plugin.selectionRegex!)];



    return matches.length;
}

function compileRegex(plugin: DuplicateLine, selection: string): void {
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

function showStatusBarContextMenu(plugin: DuplicateLine, event: MouseEvent): void {
    const menu = new Menu();

    // Toggle case sensitivity option
    menu.addItem((item) => {
        const newState = plugin.settings.matchCase ? 'Case insensitive (aa)' : 'Case sensitive (Aa)';

        item.setTitle(`Switch to ${newState}`)
            .setIcon(plugin.settings.matchCase ? 'type' : 'case-sensitive')
            .onClick(async () => {
                plugin.settings.matchCase = !plugin.settings.matchCase;
                await plugin.saveSettings();

                // Update the status bar display
                if (plugin.statusBarItemEl) {
                    const caseIndicator = plugin.settings.matchCase ? ' (Aa)' : '';
                    plugin.statusBarItemEl.setText(`${plugin.nb} Reps${caseIndicator}`);
                }

                // Refresh occurrence count with new case sensitivity
                handleSelectionChange(plugin);
            });
    });

    menu.addSeparator();

    // Color picker option
    menu.addItem((item) => {
        item.setTitle('Change highlight color')
            .setIcon('palette')
            .onClick(() => {
                // Close the menu first
                menu.hide();
                // Show color picker with smart positioning
                showColorPicker(plugin, plugin.statusBarItemEl!, event);
            });
    });

    // Show the menu at the mouse position
    menu.showAtMouseEvent(event);
}

function showColorPicker(plugin: DuplicateLine, targetElement: HTMLElement, clickEvent?: MouseEvent): void {
    // Create color picker container
    const colorPicker = document.createElement('div');
    colorPicker.className = 'duplicate-line-color-picker';
    colorPicker.style.cssText = `
        position: fixed;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        padding: 12px;
        box-shadow: var(--shadow-s);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 200px;
    `;

    // Add title
    const title = document.createElement('div');
    title.textContent = 'Choose highlight color';
    title.style.cssText = `
        font-weight: 600;
        margin-bottom: 4px;
        color: var(--text-normal);
    `;
    colorPicker.appendChild(title);

    // Create color input
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = plugin.settings.highlightColor;
    colorInput.style.cssText = `
        width: 100%;
        height: 40px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;

    // Add color input change handler
    colorInput.addEventListener('input', async (e) => {
        const newColor = (e.target as HTMLInputElement).value;
        plugin.settings.highlightColor = newColor;

        // Update colors immediately
        plugin.initializeHighlightColors();
        await plugin.saveSettings();
    });

    colorPicker.appendChild(colorInput);

    // Add preset colors
    const presetsContainer = document.createElement('div');
    presetsContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 4px;
        margin-top: 8px;
    `;

    const presetColors = [
        '#ffff00', // Yellow
        '#ff6b6b', // Red
        '#4ecdc4', // Teal
        '#45b7d1', // Blue
        '#96ceb4', // Green
        '#feca57', // Orange
        '#ff9ff3', // Pink
        '#a29bfe', // Purple
        '#fd79a8', // Rose
        '#00b894', // Emerald
        '#e17055', // Coral
        '#74b9ff'  // Sky blue
    ];

    presetColors.forEach(color => {
        const preset = document.createElement('div');
        preset.style.cssText = `
            width: 24px;
            height: 24px;
            background-color: ${color};
            border-radius: 4px;
            cursor: pointer;
            border: 2px solid ${color === plugin.settings.highlightColor ? 'var(--text-accent)' : 'transparent'};
        `;

        preset.addEventListener('click', async () => {
            plugin.settings.highlightColor = color;
            colorInput.value = color;

            // Update colors immediately
            plugin.initializeHighlightColors();
            await plugin.saveSettings();

            // Update border for selected preset
            presetsContainer.querySelectorAll('div').forEach(p => {
                (p as HTMLElement).style.border = '2px solid transparent';
            });
            preset.style.border = '2px solid var(--text-accent)';
        });

        presetsContainer.appendChild(preset);
    });

    colorPicker.appendChild(presetsContainer);

    // Position the color picker intelligently
    document.body.appendChild(colorPicker);

    const rect = targetElement.getBoundingClientRect();
    const pickerRect = colorPicker.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let left: number;
    let top: number;

    // If we have click coordinates, use them as a starting point
    if (clickEvent) {
        left = clickEvent.clientX - pickerRect.width / 2;
        top = clickEvent.clientY - pickerRect.height - 10;
    } else {
        // Fallback to status bar position
        left = rect.left;
        top = rect.top - pickerRect.height - 8;
    }

    // Adjust horizontal position if it goes off-screen
    if (left + pickerRect.width > viewportWidth - 10) {
        left = viewportWidth - pickerRect.width - 10;
    }
    if (left < 10) {
        left = 10;
    }

    // If there's not enough space above, show below
    if (top < 10) {
        if (clickEvent) {
            top = clickEvent.clientY + 10;
        } else {
            top = rect.bottom + 8;
        }
    }

    // If still not enough space below, center vertically
    if (top + pickerRect.height > viewportHeight - 10) {
        top = Math.max(10, (viewportHeight - pickerRect.height) / 2);
    }

    colorPicker.style.left = `${left}px`;
    colorPicker.style.top = `${top}px`;

    // Close on click outside
    const closeHandler = (e: MouseEvent): void => {
        if (!colorPicker.contains(e.target as Node)) {
            colorPicker.remove();
            document.removeEventListener('click', closeHandler);
        }
    };

    // Add slight delay to prevent immediate closing
    setTimeout(() => {
        document.addEventListener('click', closeHandler);
    }, 100);

    // Close on Escape key
    const keyHandler = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            colorPicker.remove();
            document.removeEventListener('click', closeHandler);
            document.removeEventListener('keydown', keyHandler);
        }
    };
    document.addEventListener('keydown', keyHandler);
}


