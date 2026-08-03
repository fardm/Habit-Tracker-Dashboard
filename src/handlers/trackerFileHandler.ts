import { Plugin, TFile } from "obsidian";
import { TRACKER_VIEW_TYPE, TrackerView } from "../views/trackerView";

/**
 * Registers the tracker file extension and custom view
 * This handler is responsible for:
 * - Registering the .tracker file extension
 * - Registering the custom view for tracker files
 * - Setting up the view factory
 * - Intercepting file opening to prevent duplicate tabs
 */
export function registerTrackerFileType(plugin: Plugin): void {
	// Register the custom view type
	plugin.registerView(
		TRACKER_VIEW_TYPE,
		(leaf) => new TrackerView(leaf)
	);

	// Register the .tracker file extension to use the custom view
	plugin.registerExtensions(["tracker"], TRACKER_VIEW_TYPE);

	// Intercept file opening to prevent duplicate tabs
	// This event fires before Obsidian creates a new leaf
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", (file) => {
			if (file && file.extension === "tracker") {
				handleTrackerFileOpen(plugin, file);
			}
		})
	);
}

/**
 * Handles opening of .tracker files to prevent duplicate tabs
 * This is called when Obsidian attempts to open a .tracker file
 */
function handleTrackerFileOpen(plugin: Plugin, file: TFile): void {
	// Use setTimeout to run after Obsidian has created the new leaf
	// This allows us to detect if a duplicate was created and close it
	window.setTimeout(() => {
		const leaves = plugin.app.workspace.getLeavesOfType(TRACKER_VIEW_TYPE);
		const matchingLeaves = leaves.filter(leaf => {
			const leafFile = (leaf.view as { file?: TFile }).file;
			return leafFile && leafFile.path === file.path;
		});

		// If there are multiple leaves for the same file, close the duplicates
		if (matchingLeaves.length > 1) {
			// Keep the first one (most recently focused), close the rest
			for (let i = 1; i < matchingLeaves.length; i++) {
				matchingLeaves[i].detach();
			}
			// Focus the remaining leaf
			plugin.app.workspace.setActiveLeaf(matchingLeaves[0], { focus: true });
		}
	}, 0);
}

/**
 * Cleans up tracker-related resources when plugin is unloaded
 */
export function cleanupTrackerFileType(plugin: Plugin): void {
	// Detach all leaves using the tracker view
	plugin.app.workspace.detachLeavesOfType(TRACKER_VIEW_TYPE);
}
