import { App, Modal, Setting } from "obsidian";

export class CreateTrackerModal extends Modal {
	private fileName = "";
	private onSubmit: (fileName: string) => void;

	constructor(app: App, onSubmit: (fileName: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Create New Habit Tracker" });

		new Setting(contentEl)
			.setName("Tracker file name")
			.setDesc("Enter the name for your new tracker file (without .tracker extension)")
			.addText((text) =>
				text
					.setPlaceholder("my-habit")
					.onChange((value) => {
						this.fileName = value;
					})
					.setValue(this.fileName)
			);

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Cancel")
					.setClass("mod-muted")
					.onClick(() => {
						this.close();
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Create")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.fileName);
					})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
