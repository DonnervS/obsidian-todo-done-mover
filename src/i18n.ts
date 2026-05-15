// UI string localization. English is the default; German is used when
// Obsidian's interface language is German.

export type Lang = "en" | "de";

export interface Strings {
	cmdMoveCompleted: string;
	cmdMoveSelection: string;
	noticeMoved: (count: number, heading: string) => string;
	noticeAutoMoved: (count: number) => string;
	noticeNoCompleted: string;
	noticeNoSelection: string;
	settingAutoModeName: string;
	settingAutoModeDesc: string;
	settingHeadingName: string;
	settingHeadingDesc: string;
	settingDateName: string;
	settingDateDesc: string;
}

const en: Strings = {
	cmdMoveCompleted: "Move completed tasks to Done",
	cmdMoveSelection: "Move selection to Done",
	noticeMoved: (count, heading) => `Moved ${count} task(s) to "${heading}".`,
	noticeAutoMoved: (count) => `Automatically moved ${count} completed task(s).`,
	noticeNoCompleted: "No fully completed tasks found.",
	noticeNoSelection: "No tasks found in the selection.",
	settingAutoModeName: "Auto mode",
	settingAutoModeDesc:
		"Move fully completed tasks automatically as soon as they are checked " +
		"(only when all of their sub-tasks are checked too).",
	settingHeadingName: "Done heading",
	settingHeadingDesc:
		"Name of the target heading that completed tasks are moved under.",
	settingDateName: "Append completion date",
	settingDateDesc: 'Appends "✅ YYYY-MM-DD" to every moved, checked line.',
};

const de: Strings = {
	cmdMoveCompleted: "Erledigte Aufgaben nach Done verschieben",
	cmdMoveSelection: "Auswahl nach Done verschieben",
	noticeMoved: (count, heading) => `${count} Aufgabe(n) nach „${heading}" verschoben.`,
	noticeAutoMoved: (count) => `${count} erledigte Aufgabe(n) automatisch verschoben.`,
	noticeNoCompleted: "Keine vollständig erledigten Aufgaben gefunden.",
	noticeNoSelection: "Keine Aufgaben in der Auswahl gefunden.",
	settingAutoModeName: "Auto-Modus",
	settingAutoModeDesc:
		"Vollständig erledigte Aufgaben automatisch verschieben, sobald sie " +
		"abgehakt werden (nur wenn auch alle Unteraufgaben abgehakt sind).",
	settingHeadingName: "Done-Überschrift",
	settingHeadingDesc:
		"Name der Ziel-Überschrift, unter die erledigte Aufgaben verschoben werden.",
	settingDateName: "Erledigt-Datum anhängen",
	settingDateDesc: 'Hängt "✅ JJJJ-MM-TT" an jede verschobene, abgehakte Zeile an.',
};

const LANGUAGES: Record<Lang, Strings> = { en, de };

/** Returns the UI strings for the given language. */
export function getStrings(lang: Lang): Strings {
	return LANGUAGES[lang];
}
