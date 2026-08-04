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
		const button = createEl("button", {
			cls: "habit-tracker-add-habit-btn clickable-icon",
			text: "+ Add Habit",
			type: "button"
		});
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