import { HTMLElementComponent } from "./htmlElementComponent";
import { setIcon } from "obsidian";

/**
 * Component for the Settings button
 * Displays a settings icon button that opens the settings modal
 */
export class SettingsButton extends HTMLElementComponent {
	private onClick: () => void;

	constructor(onClick: () => void) {
		super();
		this.onClick = onClick;
	}

	render(): HTMLElement {
		const button = createEl("button", {
			cls: "habit-tracker-settings-btn settings-button clickable-icon",
			type: "button",
			attr: { title: "Settings" }
		});

		// Settings icon SVG
		setIcon(button, "settings");

		button.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.onClick();
		});

		return button;
	}

	}
