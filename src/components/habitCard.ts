import { HTMLElementComponent } from "./htmlElementComponent";
import { Habit } from "../types/habitTypes";

/**
 * Component for displaying a single habit as a card
 */
export class HabitCard extends HTMLElementComponent {
	private habit: Habit;
	private onDelete?: (habitId: string) => void;

	constructor(habit: Habit, onDelete?: (habitId: string) => void) {
		super();
		this.habit = habit;
		this.onDelete = onDelete;
	}

	render(): HTMLElement {
		const card = document.createElement("div");
		card.className = "habit-card";
		card.setAttribute("data-habit-id", this.habit.id);

		// Card styling
		card.style.cssText = `
			background-color: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 12px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			transition: border-color 0.2s, box-shadow 0.2s;
		`;

		card.addEventListener("mouseenter", () => {
			card.style.borderColor = "var(--interactive-accent)";
			card.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
		});

		card.addEventListener("mouseleave", () => {
			card.style.borderColor = "var(--background-modifier-border)";
			card.style.boxShadow = "none";
		});

		// Left side: Emoji and name
		const leftSide = document.createElement("div");
		leftSide.style.cssText = `
			display: flex;
			align-items: center;
			gap: 12px;
		`;

		const emoji = document.createElement("span");
		emoji.className = "habit-emoji";
		emoji.textContent = this.habit.emoji;
		emoji.style.cssText = `
			font-size: 24px;
		`;

		const habitInfo = document.createElement("div");
		habitInfo.style.cssText = `
			display: flex;
			flex-direction: column;
		`;

		const habitName = document.createElement("div");
		habitName.className = "habit-name";
		habitName.textContent = this.habit.name;
		habitName.style.cssText = `
			font-weight: 500;
			font-size: 14px;
			color: var(--text-normal);
		`;

		const habitType = document.createElement("div");
		habitType.className = "habit-type";
		habitType.textContent = this.habit.type === "boolean" ? "Boolean" : "Numeric";
		habitType.style.cssText = `
			font-size: 11px;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		`;

		habitInfo.appendChild(habitName);
		habitInfo.appendChild(habitType);
		leftSide.appendChild(emoji);
		leftSide.appendChild(habitInfo);

		// Right side: Status placeholder and delete button
		const rightSide = document.createElement("div");
		rightSide.style.cssText = `
			display: flex;
			align-items: center;
			gap: 12px;
		`;

		// Status placeholder
		const statusPlaceholder = document.createElement("div");
		statusPlaceholder.className = "habit-status-placeholder";
		statusPlaceholder.textContent = "No data";
		statusPlaceholder.style.cssText = `
			font-size: 12px;
			color: var(--text-muted);
			font-style: italic;
		`;

		// Delete button
		if (this.onDelete) {
			const deleteButton = document.createElement("button");
			deleteButton.className = "habit-delete-btn";
			deleteButton.innerHTML = "×";
			deleteButton.style.cssText = `
				background: none;
				border: none;
				color: var(--text-muted);
				font-size: 20px;
				cursor: pointer;
				padding: 4px 8px;
				border-radius: 4px;
				transition: color 0.2s, background-color 0.2s;
			`;

			deleteButton.addEventListener("mouseenter", () => {
				deleteButton.style.color = "var(--text-error)";
				deleteButton.style.backgroundColor = "var(--background-modifier-error)";
			});

			deleteButton.addEventListener("mouseleave", () => {
				deleteButton.style.color = "var(--text-muted)";
				deleteButton.style.backgroundColor = "transparent";
			});

			const onDelete = this.onDelete;
			deleteButton.addEventListener("click", (e) => {
				e.stopPropagation();
				onDelete(this.habit.id);
			});

			rightSide.appendChild(deleteButton);
		}

		rightSide.appendChild(statusPlaceholder);
		card.appendChild(leftSide);
		card.appendChild(rightSide);

		return card;
	}
}