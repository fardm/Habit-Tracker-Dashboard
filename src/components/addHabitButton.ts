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

		// Add basic styling
		button.style.cssText = `
			background-color: var(--interactive-accent);
			color: var(--interactive-accent-text);
			border: none;
			padding: 8px 16px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 14px;
			font-weight: 500;
			margin-bottom: 20px;
			transition: background-color 0.2s;
			position: relative;
			z-index: 1;
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