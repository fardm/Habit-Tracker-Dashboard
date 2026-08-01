import { App, Modal, Setting } from "obsidian";
import { DataSourceType, DateExtractionMethod, TrackerSettings, ReportCalendar } from "../types/habitTypes";

export interface SettingsFormData {
	dataSourceType: DataSourceType;
	dataSourceValue: string;
	dateExtractionMethod: DateExtractionMethod;
	dateFrontmatterProperty: string;
	reportCalendar: ReportCalendar;
}

/**
 * Modal for configuring habit tracker settings
 */
export class SettingsModal extends Modal {
	private formData: SettingsFormData;
	private onSubmit: (data: SettingsFormData) => void;
	private dataSourceValueContainer?: HTMLElement;
	private dateFrontmatterContainer?: HTMLElement;

	constructor(
		app: App,
		onSubmit: (data: SettingsFormData) => void,
		initialSettings?: TrackerSettings
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.formData = {
			dataSourceType: initialSettings?.dataSourceType || DataSourceType.TAG,
			dataSourceValue: initialSettings?.dataSourceValue || "",
			dateExtractionMethod: initialSettings?.dateExtractionMethod || DateExtractionMethod.FILENAME,
			dateFrontmatterProperty: initialSettings?.dateFrontmatterProperty || "",
			reportCalendar: initialSettings?.reportCalendar || ReportCalendar.GREGORIAN
		};
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Tracker Settings" });

		// Data Source Type
		new Setting(contentEl)
			.setName("Data source")
			.setDesc("Choose how to filter notes for habit data")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(DataSourceType.TAG, "Tag")
					.addOption(DataSourceType.FOLDER, "Folder")
					.setValue(this.formData.dataSourceType)
					.onChange((value) => {
						this.formData.dataSourceType = value as DataSourceType;
						this.updateDataSourceField();
					})
			);

		// Data Source Value (dynamic based on type)
		this.dataSourceValueContainer = contentEl.createDiv();
		this.updateDataSourceField();

		// Date Extraction Method
		new Setting(contentEl)
			.setName("Date extraction")
			.setDesc("Choose how to extract dates from notes")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(DateExtractionMethod.FILENAME, "From file name")
					.addOption(DateExtractionMethod.FRONTMATTER, "From frontmatter property")
					.setValue(this.formData.dateExtractionMethod)
					.onChange((value) => {
						this.formData.dateExtractionMethod = value as DateExtractionMethod;
						this.updateDateFrontmatterField();
					})
			);

		// Date Frontmatter Property (dynamic based on method)
		this.dateFrontmatterContainer = contentEl.createDiv();
		this.updateDateFrontmatterField();

		// Report Calendar
		new Setting(contentEl)
			.setName("Report Calendar")
			.setDesc("Choose the calendar system for habit reports (Heatmap, Streaks, Statistics)")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(ReportCalendar.GREGORIAN, "Gregorian")
					.addOption(ReportCalendar.JALALI, "Solar Hijri (Jalali)")
					.setValue(this.formData.reportCalendar)
					.onChange((value) => {
						this.formData.reportCalendar = value as ReportCalendar;
					})
			);

		// Buttons
		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Cancel")
					.onClick(() => {
						this.close();
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Save")
					.setCta()
					.onClick(() => {
						this.onSubmit(this.formData);
						this.close();
					})
			);
	}

	private updateDataSourceField(): void {
		if (!this.dataSourceValueContainer) return;

		this.dataSourceValueContainer.empty();

		const label = this.formData.dataSourceType === DataSourceType.TAG ? "Tag" : "Folder path";
		const placeholder = this.formData.dataSourceType === DataSourceType.TAG ? "#habit" : "Habits";

		new Setting(this.dataSourceValueContainer)
			.setName(label)
			.setDesc(`Enter the ${this.formData.dataSourceType === DataSourceType.TAG ? "tag" : "folder path"} to filter notes`)
			.addText((text) =>
				text
					.setPlaceholder(placeholder)
					.onChange((value) => {
						this.formData.dataSourceValue = value;
					})
					.setValue(this.formData.dataSourceValue)
			);
	}

	private updateDateFrontmatterField(): void {
		if (!this.dateFrontmatterContainer) return;

		this.dateFrontmatterContainer.empty();

		if (this.formData.dateExtractionMethod === DateExtractionMethod.FRONTMATTER) {
			new Setting(this.dateFrontmatterContainer)
				.setName("Frontmatter property")
				.setDesc("Enter the frontmatter property key that contains the date")
				.addText((text) =>
					text
						.setPlaceholder("date")
						.onChange((value) => {
							this.formData.dateFrontmatterProperty = value;
						})
						.setValue(this.formData.dateFrontmatterProperty)
				);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
