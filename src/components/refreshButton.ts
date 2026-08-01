import { HTMLElementComponent } from "./htmlElementComponent";

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
		const button = document.createElement("button");
		button.className = "habit-tracker-refresh-btn";
		button.innerHTML = "↻ Refresh";
		button.type = "button";

		// Minimal modern styling
		button.style.cssText = `
			background-color: var(--background-modifier-border);
			color: var(--text-normal);
			border: none;
			padding: 6px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 13px;
			font-weight: 500;
			transition: background-color 0.2s;
			line-height: 1;
		`;

		button.addEventListener("mouseenter", () => {
			button.style.backgroundColor = "var(--background-modifier-hover)";
		});

		button.addEventListener("mouseleave", () => {
			button.style.backgroundColor = "var(--background-modifier-border)";
		});

		// Add click handler
		button.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.onClick();
		});

		return button;
	}
}
