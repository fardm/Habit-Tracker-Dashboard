import { App, TFile, Notice } from "obsidian";
import { TRACKER_VIEW_TYPE } from "../views/trackerView";

/**
 * Creates a new .tracker file and opens it in the custom Tracker view
 * @param app - The Obsidian app instance
 * @param fileName - The name for the tracker file (without .tracker extension)
 */
export async function createTrackerFile(app: App, fileName: string): Promise<void> {
	// Validate file name
	if (!fileName || fileName.trim() === "") {
		new Notice("File name cannot be empty.");
		return;
	}

	// Clean the file name and ensure it has the .tracker extension
	const cleanFileName = fileName.trim();
	const trackerFileName = cleanFileName.endsWith(".tracker") 
		? cleanFileName 
		: `${cleanFileName}.tracker`;

	// Check if file already exists
	const existingFile = app.vault.getAbstractFileByPath(trackerFileName);
	if (existingFile) {
		new Notice("A tracker with this name already exists. Please choose another name.");
		return;
	}

	// Create the file in the vault root with empty content
	let newFile: TFile;
	try {
		newFile = await app.vault.create(trackerFileName, "");
	} catch (error) {
		new Notice("Failed to create tracker file. Please try again.");
		console.error("Error creating tracker file:", error);
		return;
	}

	// Open the newly created file in the custom Tracker view
	await openTrackerView(app, newFile);
}

/**
 * Opens a .tracker file in the custom Tracker view
 * @param app - The Obsidian app instance
 * @param file - The tracker file to open
 */
export async function openTrackerView(app: App, file: TFile): Promise<void> {
	try {
		// Check if the file is already open in a tracker view
		const existingLeaves = app.workspace.getLeavesOfType(TRACKER_VIEW_TYPE);
		const existingLeaf = existingLeaves.find(leaf => {
			const leafFile = (leaf.view as any).file;
			return leafFile && leafFile.path === file.path;
		});

		if (existingLeaf) {
			// Focus the existing tab
			app.workspace.setActiveLeaf(existingLeaf, { focus: true });
			return;
		}

		// Open in the main editor area (center)
		const leaf = app.workspace.getLeaf();
		if (!leaf) {
			new Notice("Failed to open tracker file. Please try again.");
			return;
		}

		await leaf.openFile(file, { active: true });
	} catch (error) {
		new Notice("Failed to open tracker file. Please try again.");
		console.error("Error opening tracker view:", error);
	}
}
