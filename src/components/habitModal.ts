import { App, Modal, Setting } from "obsidian";
import { HabitType, Visualization, CompletionOperator, CompletionRule } from "../types/habitTypes";
import { HabitDataManager } from "../handlers/habitDataManager";

export interface HabitFormData {
	name: string;
	emoji: string;
	type: HabitType;
	frontmatterField: string;
	unit?: string;
	target?: number;
	visualization?: Visualization;
	themeColor?: string;
	graceDays?: number;
	completionRule?: CompletionRule;
}

/**
 * Modal for creating a new habit
 */
export class HabitModal extends Modal {
	private formData: HabitFormData;
	private onSubmit: (data: HabitFormData) => void;
	private validationErrors: string[] = [];
	private numericSettingsContainer?: HTMLElement;
	private numericSettingsContent?: HTMLElement;
	private visualizationContainer?: HTMLElement;
	private isEditMode: boolean;

	constructor(
		app: App,
		onSubmit: (data: HabitFormData) => void,
		initialData?: Partial<HabitFormData>
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.isEditMode = !!initialData; // If initialData is provided, it's edit mode
		this.formData = {
			name: initialData?.name || "",
			emoji: initialData?.emoji || "",
			type: initialData?.type || HabitType.BOOLEAN,
			frontmatterField: initialData?.frontmatterField || "",
			unit: initialData?.unit || "",
			target: initialData?.target,
			visualization: initialData?.visualization || Visualization.DONUT,
			themeColor: initialData?.themeColor || "",
			graceDays: initialData?.graceDays ?? 0,
			completionRule: initialData?.completionRule || { operator: CompletionOperator.AT_LEAST }
		};
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: this.isEditMode ? "Edit Habit" : "Create New Habit" });

		// Habit Name
		new Setting(contentEl)
			.setName("Habit name")
			.setDesc("Enter the name for your habit")
			.addText((text) =>
				text
					.setPlaceholder("Reading")
					.onChange((value) => {
						this.formData.name = value;
						this.updateFrontmatterField();
					})
					.setValue(this.formData.name)
			);

		// Emoji
		new Setting(contentEl)
			.setName("Emoji")
			.setDesc("Choose an emoji to represent your habit")
			.addText((text) =>
				text
					.setPlaceholder("e.g. 📚")
					.onChange((value) => {
						this.formData.emoji = value;
						this.updateFrontmatterField();
					})
					.setValue(this.formData.emoji)
					.then((inputEl) => {
						const style = document.createElement("style");
						style.textContent = `
							.habit-modal-emoji-input::placeholder {
								opacity: 0.7;
							}
						`;
						contentEl.appendChild(style);
						inputEl.inputEl.addClass("habit-modal-emoji-input");
					})
			);

		// Frontmatter Field
		new Setting(contentEl)
			.setName("Frontmatter field")
			.setDesc("The frontmatter field name for storing habit data")
			.addText((text) =>
				text
					.setPlaceholder("reading")
					.onChange((value) => {
						this.formData.frontmatterField = value;
					})
					.setValue(this.formData.frontmatterField)
			);

		// Type (radio buttons)
		const typeSetting = new Setting(contentEl)
			.setName("Type")
			.setDesc("Choose the habit type");

		const typeRadioContainer = typeSetting.controlEl.createDiv();
		typeRadioContainer.style.cssText = `
			display: flex;
			gap: 24px;
		`;

		const typeOptions = [
			{ value: HabitType.BOOLEAN, label: "Boolean" },
			{ value: HabitType.NUMERIC, label: "Numeric" }
		];

		typeOptions.forEach(option => {
			const radioRow = typeRadioContainer.createDiv();
			radioRow.style.cssText = `
				display: flex;
				align-items: center;
				gap: 8px;
			`;

			const radio = document.createElement("input");
			radio.type = "radio";
			radio.name = "habit-type";
			radio.value = option.value;
			radio.checked = this.formData.type === option.value;
			radio.addEventListener("change", () => {
				this.formData.type = option.value as HabitType;
				this.updateNumericSettingsVisibility();
			});
			radioRow.appendChild(radio);

			const label = radioRow.createEl("label", {
				text: option.label
			});
			label.style.cssText = `
				cursor: pointer;
				color: var(--text-normal);
			`;
		});

		// Collapsible Numeric Settings section
		this.numericSettingsContainer = contentEl.createDiv({
			cls: "numeric-settings-container"
		});
		this.numericSettingsContainer.style.cssText = `
			margin-top: 16px;
			margin-bottom: 16px;
		`;

		const numericSettingsHeader = this.numericSettingsContainer.createDiv();
		numericSettingsHeader.style.cssText = `
			display: flex;
			flex-direction: column;
		`;

		const headerRow = numericSettingsHeader.createDiv();
		headerRow.style.cssText = `
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px;
			background-color: var(--background-secondary);
			border-radius: 4px;
			border: 1px solid var(--background-modifier-border);
		`;

		const chevron = headerRow.createEl("span", {
			text: "▶"
		});
		chevron.style.cssText = `
			transition: transform 0.2s ease;
			font-size: 12px;
		`;

		const numericSettingsTitle = headerRow.createEl("div", {
			text: "Numeric Settings"
		});
		numericSettingsTitle.style.cssText = `
			font-weight: 500;
			color: var(--text-normal);
		`;

		this.numericSettingsContent = numericSettingsHeader.createDiv();
		this.numericSettingsContent.style.cssText = `
			margin-top: 12px;
			padding: 12px;
			background-color: var(--background-secondary);
			border-radius: 4px;
			border: 1px solid var(--background-modifier-border);
			display: none;
		`;

		numericSettingsHeader.addEventListener("click", () => {
			if (this.numericSettingsContent) {
				const isExpanded = this.numericSettingsContent.style.display !== "none";
				this.numericSettingsContent.style.display = isExpanded ? "none" : "block";
				chevron.style.transform = isExpanded ? "rotate(0deg)" : "rotate(90deg)";
			}
		});

		// Unit field
		new Setting(this.numericSettingsContent)
			.setName("Unit")
			.setDesc("The unit for tracking (e.g., minutes, pages, pomodoro)")
			.addText((text) =>
				text
					.setPlaceholder("minutes")
					.onChange((value) => {
						this.formData.unit = value;
					})
					.setValue(this.formData.unit || "")
			);

		// Target field
		new Setting(this.numericSettingsContent)
			.setName("Target")
			.setDesc("The target value to achieve (e.g., 10)")
			.addText((text) =>
				text
					.setPlaceholder("10")
					.onChange((value) => {
						this.formData.target = value ? parseFloat(value) : undefined;
					})
					.setValue(this.formData.target ? this.formData.target.toString() : "")
			);

		// Completion Condition
		new Setting(this.numericSettingsContent)
			.setName("Completion condition")
			.setDesc("Choose when this habit counts as completed")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(CompletionOperator.AT_LEAST, "At least")
					.addOption(CompletionOperator.AT_MOST, "At most")
					.addOption(CompletionOperator.EXACTLY, "Exactly")
					.setValue(this.formData.completionRule?.operator || CompletionOperator.AT_LEAST)
					.onChange((value) => {
						this.formData.completionRule = { operator: value as CompletionOperator };
					})
			);

		// Visualization (only for numeric habits)
		const visualizationSetting = this.numericSettingsContent.createDiv({
			cls: "setting-item-full-width"
		});
		visualizationSetting.style.cssText = `
			padding: 18px 0px;
			border-top: 1px solid var(--background-modifier-border);
			display: flex;
			flex-direction: column;
			gap: 6px;
		`;

		const visualizationName = visualizationSetting.createDiv({
			text: "Visualization"
		});
		visualizationName.style.cssText = `
			font-weight: var(--font-small);
			font-size: var(--font-ui-small);
			color: var(--text-normal);
		`;

		const visualizationDesc = visualizationSetting.createDiv({
			text: "Choose how to display progress for this habit"
		});
		visualizationDesc.style.cssText = `
			font-size: var(--font-ui-smaller);
			color: var(--text-muted);
			line-height: var(--line-height-tight);
		`;

		this.visualizationContainer = visualizationSetting.createDiv({
			cls: "visualization-container"
		});

		const radioContainer = this.visualizationContainer.createDiv();
		radioContainer.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 8px;
		`;

		const visualizationOptions = [
			{ value: Visualization.DONUT, label: "Donut" },
			{ value: Visualization.PROGRESS_BAR, label: "Progress Bar" },
			{ value: Visualization.CIRCLE_CHECK, label: "Circle Check" },
			{ value: Visualization.NONE, label: "None" }
		];

		visualizationOptions.forEach(option => {
			const radioRow = radioContainer.createDiv();
			radioRow.style.cssText = `
				display: flex;
				align-items: center;
				gap: 8px;
			`;

			const radio = document.createElement("input");
			radio.type = "radio";
			radio.name = "visualization";
			radio.value = option.value;
			radio.checked = this.formData.visualization === option.value;
			radio.addEventListener("change", () => {
				this.formData.visualization = option.value as Visualization;
			});
			radioRow.appendChild(radio);

			const label = radioRow.createEl("label", {
				text: option.label
			});
			label.style.cssText = `
				cursor: pointer;
				color: var(--text-normal);
				font-size: var(--font-ui-small);
			`;
		});

		// Color Theme (shown for both habit types)
		new Setting(contentEl)
			.setName("Color theme")
			.setDesc("Choose a custom color for this habit (optional)")
			.addColorPicker((picker) =>
				picker
					.onChange((value) => {
						this.formData.themeColor = value;
					})
					.setValue(this.formData.themeColor || "")
			);

		// Grace Days (moved to bottom)
		new Setting(contentEl)
			.setName("Grace days")
			.setDesc("Number of missed days allowed before streak breaks (default: 0)")
			.addText((text) =>
				text
					.setPlaceholder("0")
					.setValue(this.formData.graceDays?.toString() || "0")
					.onChange((value) => {
						const num = parseInt(value);
						this.formData.graceDays = isNaN(num) || num < 0 ? 0 : num;
					})
			);

		// Validation errors display
		const errorContainer = contentEl.createDiv({
			cls: "habit-modal-errors"
		});
		errorContainer.style.cssText = `
			color: var(--text-error);
			margin-bottom: 16px;
			min-height: 20px;
		`;

		// Buttons
		const buttonContainer = contentEl.createDiv({
			cls: "setting-item-control"
		});
		buttonContainer.style.cssText = `
			display: flex;
			justify-content: flex-end;
			gap: 12px;
			margin-top: 16px;
		`;

		const cancelButton = buttonContainer.createEl("button", {
			text: "Cancel",
			cls: "mod-cancel"
		});
		cancelButton.addEventListener("click", () => {
			this.close();
		});

		const createButton = buttonContainer.createEl("button", {
			text: this.isEditMode ? "Update" : "Create",
			cls: "mod-cta"
		});
		createButton.addEventListener("click", () => {
			if (this.validate()) {
				this.close();
				this.onSubmit(this.formData);
			} else {
				errorContainer.innerHTML = this.validationErrors.join("<br>");
			}
		});

		// Initial visibility update
		this.updateNumericSettingsVisibility();
	}

	private updateNumericSettingsVisibility(): void {
		if (this.numericSettingsContainer) {
			if (this.formData.type === HabitType.NUMERIC) {
				this.numericSettingsContainer.style.display = "block";
			} else {
				this.numericSettingsContainer.style.display = "none";
			}
		}
	}

	private updateFrontmatterField(): void {
		// Auto-generate frontmatter field based on emoji and name
		if (this.formData.emoji && this.formData.name) {
			const cleanName = this.formData.name
				.toLowerCase()
				.replace(/[^a-z0-9]/g, "");
			this.formData.frontmatterField = `${this.formData.emoji}${cleanName}`;
		}
	}

	private validate(): boolean {
		this.validationErrors = [];
		const validation = HabitDataManager.validateHabit(this.formData);
		
		if (!validation.valid) {
			this.validationErrors = validation.errors;
		}

		return validation.valid;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}