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
			cls: "habit-tracker-refresh-btn clickable-icon",
			type: "button"
		});
		
		const iconContainer = createSpan({ cls: "habit-tracker-refresh-btn-icon" });
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
			
			// Show success state
			setIcon(iconContainer, "check");
			textSpan.setText("Refreshed");
			iconContainer.style.color = "var(--text-success)";
			textSpan.style.color = "var(--text-success)";
			
			// Call the original refresh functionality
			this.onClick();
			
			// Revert to normal state after 2 seconds
			setTimeout(() => {
				setIcon(iconContainer, "refresh-cw");
				textSpan.setText("Refresh");
				iconContainer.style.color = "";
				textSpan.style.color = "";
			}, 2000);
		});

		return button;
	}

	}
