import { ItemView, WorkspaceLeaf, TFile, ViewStateResult } from "obsidian";
import { Dashboard } from "../components/dashboard";

export const TRACKER_VIEW_TYPE = "tracker-view";

export class TrackerView extends ItemView {
	private dashboard?: Dashboard;
	private file?: TFile;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return TRACKER_VIEW_TYPE;
	}

	getDisplayText(): string {
		// Return the file name without extension for the tab title
		if (this.file) {
			return this.file.basename;
		}
		return "Habit Tracker Dashboard";
	}

	async setState(state: any, result: ViewStateResult): Promise<void> {
		await super.setState(state, result);
		
		// Get the file from the state
		if (state.file) {
			const abstractFile = this.app.vault.getAbstractFileByPath(state.file);
			if (abstractFile instanceof TFile) {
				this.file = abstractFile;
				await this.loadDashboard();
			}
		}
	}

	private updateTitle(): void {
		// The tab title is automatically updated by getDisplayText()
		// Obsidian calls this method to get the display text for the tab
		// No manual update needed
	}

	private async loadDashboard(): Promise<void> {
		if (!this.file) return;

		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		// Create and mount the dashboard
		this.dashboard = new Dashboard(this.app, this.file);
		await this.dashboard.mount(container);
	}

	async onOpen() {
		// Dashboard will be loaded via setState
	}

	async onClose() {
		// Clean up dashboard resources
		if (this.dashboard) {
			this.dashboard.destroy();
			this.dashboard = undefined;
		}
	}
}
