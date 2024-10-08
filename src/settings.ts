import { App, Platform, PluginSettingTab, Setting } from "obsidian";
import { CommandConfig, dupliSettings } from "./variables/types";
import DuplicateLine from "./main";
import { commandsToCreate } from "./variables/variables";

export class DuplicateLineSettings extends PluginSettingTab {
	constructor(app: App, public plugin: DuplicateLine) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		if (Platform.isDesktopApp) {
			new Setting(containerEl)
				.setName("Show selection occurences in status bar")
				.setDesc("select at least 3 characters")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.showOccurences)
						.onChange(async (value) => {
							this.plugin.settings.showOccurences = value;
							await this.plugin.saveSettings();
						});

				});

			const setting = new Setting(containerEl)
				.setName("Set color & size")
				.addColorPicker(color => color
					.setValue(this.plugin.settings.color)
					.onChange(async (value) => {
						this.plugin.settings.color = value;
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						this.plugin.statusBarItemEl!.style.color = value;
						await this.plugin.saveSettings();
					})
				)
			setting
				.addSlider((slider) => {
					slider
						.setLimits(1, 1.7, 0.1)
						.setValue(this.plugin.settings.fontSize)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.fontSize = value;
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							this.plugin.statusBarItemEl!.style.fontSize = `${value}em`;
							await this.plugin.saveSettings();
						});
				})
		}

		new Setting(containerEl)
			.setName("Add a space before right duplication")
			.setDesc("eg: 'xyz xyz, to avoid to have to insert a space")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addSpaceBetween)
					.onChange(async (value) => {
						this.plugin.settings.addSpaceBetween = value;
						await this.plugin.saveSettings();
					});
			});

		commandsToCreate.forEach((commandConfig: CommandConfig) => {
			const setting = new Setting(containerEl).setName(
				commandConfig.name
			);
			setting.setDesc(commandConfig.desc as keyof dupliSettings)
			setting.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.settings[
						commandConfig.condition as keyof dupliSettings
						] as boolean
					)
					.onChange(async (value) => {
						(this.plugin.settings[
							commandConfig.condition as keyof dupliSettings
						] as boolean) = value;

						if (this.plugin.settings[
							commandConfig.condition as keyof dupliSettings
						]) {
							const condition = commandConfig.condition;
							this.plugin.addCommandToEditor(commandConfig, condition)
						}
						else {
							this.app.commands.removeCommand(`duplicate-line:${commandConfig.id}`)
						}
						await this.plugin.saveSettings();
					});
			});
		});



	}
}
