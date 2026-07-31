import { Plugin } from "obsidian";
import { TRACKER_VIEW_TYPE, TrackerView } from "../views/trackerView";

/**
 * Registers the tracker file extension and custom view
 * This handler is responsible for:
 * - Registering the .tracker file extension
 * - Registering the custom view for tracker files
 * - Setting up the view factory
 */
export function registerTrackerFileType(plugin: Plugin): void {
	// Register the custom view type
	plugin.registerView(
		TRACKER_VIEW_TYPE,
		(leaf) => new TrackerView(leaf)
	);

	// Register the .tracker file extension to use the custom view
	plugin.registerExtensions(["tracker"], TRACKER_VIEW_TYPE);
}

/**
 * Cleans up tracker-related resources when plugin is unloaded
 */
export function cleanupTrackerFileType(plugin: Plugin): void {
	// Detach all leaves using the tracker view
	plugin.app.workspace.detachLeavesOfType(TRACKER_VIEW_TYPE);
}
