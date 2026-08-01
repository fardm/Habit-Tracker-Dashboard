import { App, Modal, Setting } from "obsidian";
import { HabitType, Visualization } from "../types/habitTypes";
import { HabitDataManager } from "../handlers/habitDataManager";

export interface HabitFormData {
	name: string;
	emoji: string;
	type: HabitType;
	frontmatterField: string;
	unit?: string;
	target?: number;
	visualization?: Visualization;
}

/**
 * Modal for creating a new habit
 */
export class HabitModal extends Modal {
	private formData: HabitFormData;
	private onSubmit: (data: HabitFormData) => void;
	private validationErrors: string[] = [];
	private numericFieldsContainer?: HTMLElement;
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
			visualization: initialData?.visualization || Visualization.DONUT
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
						// Reduce placeholder opacity for subtle hint
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

		// Type
		new Setting(contentEl)
			.setName("Type")
			.setDesc("Choose the habit type")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(HabitType.BOOLEAN, "Boolean (Completed/Not completed)")
					.addOption(HabitType.NUMERIC, "Numeric (Track numbers)")
					.setValue(this.formData.type)
					.onChange((value) => {
						this.formData.type = value as HabitType;
						this.updateNumericFieldsVisibility();
					})
			);

		// Numeric fields container (shown only for numeric habits)
		this.numericFieldsContainer = contentEl.createDiv({
			cls: "numeric-fields-container"
		});
		this.numericFieldsContainer.style.cssText = `
			margin-top: 16px;
			padding: 12px;
			background-color: var(--background-secondary);
			border-radius: 4px;
			border: 1px solid var(--background-modifier-border);
		`;

		// Unit field
		new Setting(this.numericFieldsContainer)
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
		new Setting(this.numericFieldsContainer)
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

		// Visualization radio buttons
		this.visualizationContainer = this.numericFieldsContainer.createDiv({
			cls: "visualization-container"
		});
		this.visualizationContainer.style.cssText = `
			margin-top: 16px;
			padding-top: 12px;
			border-top: 1px solid var(--background-modifier-border);
		`;

		const visualizationLabel = this.visualizationContainer.createEl("div", {
			text: "Visualization"
		});
		visualizationLabel.style.cssText = `
			font-weight: 500;
			margin-bottom: 8px;
			color: var(--text-normal);
		`;

		const visualizationDesc = this.visualizationContainer.createEl("div", {
			text: "Choose how to display progress for this habit"
		});
		visualizationDesc.style.cssText = `
			font-size: 12px;
			color: var(--text-muted);
			margin-bottom: 12px;
		`;

		const radioContainer = this.visualizationContainer.createDiv();
		radioContainer.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 8px;
		`;

		const visualizationOptions = [
			{ value: Visualization.DONUT, label: "Donut" },
			{ value: Visualization.PROGRESS_BAR, label: "Progress Bar" },
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
			`;
		});

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
					.setButtonText(this.isEditMode ? "Update" : "Create")
					.setCta()
					.onClick(() => {
						if (this.validate()) {
							this.close();
							this.onSubmit(this.formData);
						} else {
							errorContainer.innerHTML = this.validationErrors.join("<br>");
						}
					})
			);

		// Initial visibility update
		this.updateNumericFieldsVisibility();
	}

	private updateNumericFieldsVisibility(): void {
		if (this.numericFieldsContainer) {
			if (this.formData.type === HabitType.NUMERIC) {
				this.numericFieldsContainer.style.display = "block";
			} else {
				this.numericFieldsContainer.style.display = "none";
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