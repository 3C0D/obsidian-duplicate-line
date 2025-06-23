import { Direction } from "./variables.ts";

export interface CommandConfig {
	id: string;
	name: string;
	icon: string;
	direction: Direction | null;
	condition: string;
	desc: string
}

declare module "obsidian" {
	interface Editor {
		addHighlights(ranges: EditorRange[], cls: string): void;
		removeHighlights(cls: string): void;
	}
}

export interface dupliSettings {
	addSpaceBetween: boolean;
	lineDown: boolean;
	lineUp: boolean;
	moveRight: boolean;
	moveLeft: boolean;
	selectionRight: boolean;
	selectionLeft: boolean;
	selectionUp: boolean;
	selectionDown: boolean;
	mixRightDown: boolean;
	addNextOcc: boolean;
	selAllOcc: boolean;
	showOccurences: boolean;
	matchCase: boolean;
	highlightOccurrences: boolean;
	highlightColor: string;
	color: string;
	fontSize: number;
}
