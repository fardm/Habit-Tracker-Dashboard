import { HTMLElementComponent } from "./htmlElementComponent";

/**
 * Component for the "Add Habit" button
 * Displays a button that opens the habit creation modal
 */
export class AddHabitButton extends HTMLElementComponent {
	private onClick: () => void;

	constructor(onClick: () => void) {
		super();
		this.onClick = onClick;
	}

	render(): HTMLElement {
		const button = document.createElement("button");
		button.className = "habit-tracker-add-habit-btn";
		button.innerHTML = "+ Add Habit";
		button.type = "button";

		// Minimal modern styling
		button.style.cssText = `
			background-color: var(--interactive-accent);
			color: var(--text-on-accent);
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
			button.style.backgroundColor = "var(--interactive-accent-hover)";
		});

		button.addEventListener("mouseleave", () => {
			button.style.backgroundColor = "var(--interactive-accent)";
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