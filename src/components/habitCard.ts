import { HTMLElementComponent } from "./htmlElementComponent";
import { Habit, ViewMode } from "../types/habitTypes";
import { HabitMenu } from "./habitMenu";

export interface HabitCardProps {
	habit: Habit;
	currentValue: boolean | number | undefined;
	viewMode: ViewMode;
	onEdit: (habitId: string) => void;
	onDuplicate: (habitId: string) => void;
	onDelete: (habitId: string) => void;
}

/**
 * Component for displaying a single habit as a card
 */
export class HabitCard extends HTMLElementComponent {
	private props: HabitCardProps;
	private menu?: HabitMenu;

	constructor(props: HabitCardProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const card = document.createElement("div");
		card.className = "habit-card";
		card.setAttribute("data-habit-id", this.props.habit.id);
		card.style.position = "relative";

		// Apply grid or list styling based on view mode
		if (this.props.viewMode === ViewMode.GRID) {
			card.style.cssText = `
				background-color: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				padding: 16px;
				display: flex;
				flex-direction: column;
				gap: 12px;
				transition: border-color 0.2s, box-shadow 0.2s;
				min-height: 120px;
			`;
		} else {
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
		}

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
		emoji.textContent = this.props.habit.emoji;
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
		habitName.textContent = this.props.habit.name;
		habitName.style.cssText = `
			font-weight: 500;
			font-size: 14px;
			color: var(--text-normal);
		`;

		habitInfo.appendChild(habitName);
		leftSide.appendChild(emoji);
		leftSide.appendChild(habitInfo);

		// Right side: Status display
		const rightSide = document.createElement("div");
		rightSide.style.cssText = `
			display: flex;
			align-items: center;
			gap: 12px;
		`;

		// Status display with real data
		const statusDisplay = this.renderStatusDisplay();
		rightSide.appendChild(statusDisplay);

		// Menu button
		const menuButton = document.createElement("button");
		menuButton.className = "habit-menu-btn";
		menuButton.innerHTML = "⋮";
		menuButton.style.cssText = `
			background: none;
			border: none;
			color: var(--text-muted);
			font-size: 20px;
			cursor: pointer;
			padding: 4px 8px;
			border-radius: 4px;
			transition: color 0.2s, background-color 0.2s;
		`;

		menuButton.addEventListener("mouseenter", () => {
			menuButton.style.color = "var(--text-normal)";
			menuButton.style.backgroundColor = "var(--background-modifier-hover)";
		});

		menuButton.addEventListener("mouseleave", () => {
			menuButton.style.color = "var(--text-muted)";
			menuButton.style.backgroundColor = "transparent";
		});

		menuButton.addEventListener("click", (e) => {
			e.stopPropagation();
			this.showMenu(e, card);
		});

		rightSide.appendChild(menuButton);

		if (this.props.viewMode === ViewMode.GRID) {
			// Grid layout: stack elements vertically
			const contentContainer = document.createElement("div");
			contentContainer.style.cssText = `
				display: flex;
				flex-direction: column;
				gap: 12px;
				flex: 1;
			`;
			
			contentContainer.appendChild(leftSide);
			contentContainer.appendChild(rightSide);
			card.appendChild(contentContainer);
		} else {
			// List layout: horizontal arrangement
			card.appendChild(leftSide);
			card.appendChild(rightSide);
		}

		return card;
	}

	private renderStatusDisplay(): HTMLElement {
		const statusContainer = document.createElement("div");
		statusContainer.className = "habit-status";

		if (this.props.currentValue === undefined || this.props.currentValue === null) {
			statusContainer.textContent = "No data";
			statusContainer.style.cssText = `
				font-size: 12px;
				color: var(--text-muted);
				font-style: italic;
			`;
		} else if (this.props.habit.type === "boolean") {
			const completed = this.props.currentValue as boolean;
			statusContainer.textContent = completed ? "✓ Completed" : "✗ Not completed";
			statusContainer.style.cssText = `
				font-size: 12px;
				color: ${completed ? 'var(--text-success)' : 'var(--text-muted)'};
				font-weight: 500;
			`;
		} else {
			const value = this.props.currentValue as number;
			statusContainer.textContent = `Value: ${value}`;
			statusContainer.style.cssText = `
				font-size: 12px;
				color: var(--text-normal);
				font-weight: 500;
			`;
		}

		return statusContainer;
	}

	private showMenu(event: MouseEvent, card: HTMLElement): void {
		if (this.menu) return;

		const rect = (event.target as HTMLElement).getBoundingClientRect();
		const menu = new HabitMenu({
			onEdit: () => this.props.onEdit(this.props.habit.id),
			onDuplicate: () => this.props.onDuplicate(this.props.habit.id),
			onDelete: () => this.props.onDelete(this.props.habit.id),
			onClose: () => {
				this.menu = undefined;
			}
		});

		this.menu = menu;
		menu.show(rect, card);
	}
}