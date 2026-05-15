import { App, PluginSettingTab, Setting } from "obsidian";
import type DoneMoverPlugin from "../main";

export class DoneMoverSettingTab extends PluginSettingTab {
	plugin: DoneMoverPlugin;

	constructor(app: App, plugin: DoneMoverPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const s = this.plugin.strings;
		containerEl.empty();

		new Setting(containerEl)
			.setName(s.settingAutoModeName)
			.setDesc(s.settingAutoModeDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoMode).onChange(async (value) => {
					this.plugin.settings.autoMode = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(s.settingHeadingName)
			.setDesc(s.settingHeadingDesc)
			.addText((text) =>
				text
					.setPlaceholder("Done")
					.setValue(this.plugin.settings.doneHeading)
					.onChange(async (value) => {
						this.plugin.settings.doneHeading = value.trim() || "Done";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(s.settingDateName)
			.setDesc(s.settingDateDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.appendCompletionDate)
					.onChange(async (value) => {
						this.plugin.settings.appendCompletionDate = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
