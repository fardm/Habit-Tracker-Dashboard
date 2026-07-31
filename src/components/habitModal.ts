import { App, Modal, Setting } from "obsidian";
import { HabitType } from "../types/habitTypes";
import { HabitDataManager } from "../handlers/habitDataManager";

export interface HabitFormData {
	name: string;
	emoji: string;
	type: HabitType;
	frontmatterField: string;
}

/**
 * Modal for creating a new habit
 */
export class HabitModal extends Modal {
	private formData: HabitFormData;
	private onSubmit: (data: HabitFormData) => void;
	private validationErrors: string[] = [];

	constructor(
		app: App,
		onSubmit: (data: HabitFormData) => void,
		initialData?: Partial<HabitFormData>
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.formData = {
			name: initialData?.name || "",
			emoji: initialData?.emoji || "",
			type: initialData?.type || HabitType.BOOLEAN,
			frontmatterField: initialData?.frontmatterField || ""
		};
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Create New Habit" });

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
					.setPlaceholder("📚")
					.onChange((value) => {
						this.formData.emoji = value;
						this.updateFrontmatterField();
					})
					.setValue(this.formData.emoji)
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
					})
			);

		// Frontmatter Field
		new Setting(contentEl)
			.setName("Frontmatter field")
			.setDesc("The frontmatter field name for storing habit data")
			.addText((text) =>
				text
					.setPlaceholder("📚reading")
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
					.setCta()
					.onClick(() => {
						this.close();
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Create")
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