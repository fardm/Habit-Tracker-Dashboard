import { HTMLElementComponent } from "./htmlElementComponent";
import { setIcon } from "obsidian";

/**
 * Component for the "Refresh" button
 * Displays a button that refreshes the dashboard data
 */
export class RefreshButton extends HTMLElementComponent {
	private onClick: () => void;

	constructor(onClick: () => void) {
		super();
		this.onClick = onClick;
	}

	render(): HTMLElement {
		const button = createEl("button", {
			cls: "habit-tracker-refresh-btn",
			type: "button"
		});
		
		const iconContainer = createSpan();
		iconContainer.style.cssText = "vertical-align: middle; margin-right: 4px;";
		setIcon(iconContainer, "refresh-cw");
		button.appendChild(iconContainer);
		
		const textSpan = createSpan({
			text: "Refresh"
		});
		button.appendChild(textSpan);
		// Hover states are handled by CSS

		// Add click handler
		button.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.onClick();
		});

		return button;
	}

	}
