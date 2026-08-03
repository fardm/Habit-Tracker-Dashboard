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