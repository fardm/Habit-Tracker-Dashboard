import { Plugin } from "obsidian";
import { registerTrackerFileType, cleanupTrackerFileType } from "./handlers/trackerFileHandler";
import { CreateTrackerModal } from "./views/createTrackerModal";
import { createTrackerFile } from "./handlers/createTrackerHandler";

export default class HabitTrackerPlugin extends Plugin {
	async onload() {
		// Register the .tracker file type and custom view
		registerTrackerFileType(this);

		// Add ribbon icon for creating new tracker
		this.addRibbonIcon("gauge", "Create New Habit Tracker", () => {
			this.showCreateTrackerModal();
		});

		// Add command palette command for creating new tracker
		this.addCommand({
			id: "create-new-tracker",
			name: "Create new habit tracker",
			callback: () => {
				this.showCreateTrackerModal();
			},
		});
	}

	async onunload() {
		// Clean up tracker-related resources
		cleanupTrackerFileType(this);
	}

	/**
	 * Shows the modal for creating a new tracker file
	 */
	showCreateTrackerModal() {
		new CreateTrackerModal(this.app, (fileName) => {
			void createTrackerFile(this.app, fileName).catch(error => {
				console.error("Error creating tracker file:", error);
			});
		}).open();
	}
}
