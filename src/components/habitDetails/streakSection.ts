import { HTMLElementComponent } from "../htmlElementComponent";
import { StreakSectionProps, HabitStreaks } from "../../types/habitDetailsTypes";

/**
 * StreakSection component for displaying habit streak information
 */
export class StreakSection extends HTMLElementComponent {
	private props: StreakSectionProps;

	constructor(props: StreakSectionProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const container = document.createElement("div");
		container.className = "streak-section";
		container.style.cssText = `
			background-color: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 20px;
			margin-bottom: 20px;
		`;

		const title = document.createElement("h3");
		title.textContent = "Streaks";
		title.style.cssText = `
			margin: 0 0 16px 0;
			font-size: 16px;
			font-weight: 600;
			color: var(--text-normal);
		`;
		container.appendChild(title);

		// Streak cards grid
		const grid = document.createElement("div");
		grid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 16px;
		`;

		// Current streak card
		const currentStreakCard = this.createStreakCard(
			"🔥",
			"Current Streak",
			this.props.streaks.currentStreak.toString(),
			"days"
		);
		grid.appendChild(currentStreakCard);

		// Longest streak card
		const longestStreakCard = this.createStreakCard(
			"🏆",
			"Longest Streak",
			this.props.streaks.longestStreak.toString(),
			"days"
		);
		grid.appendChild(longestStreakCard);

		container.appendChild(grid);

		// Streak history section
		if (this.props.streaks.streakHistory.length > 0) {
			const historySection = document.createElement("div");
			historySection.style.cssText = `
				margin-top: 20px;
				padding-top: 16px;
				border-top: 1px solid var(--background-modifier-border);
			`;

			const historyTitle = document.createElement("h4");
			historyTitle.textContent = "Streak History";
			historyTitle.style.cssText = `
				margin: 0 0 12px 0;
				font-size: 14px;
				font-weight: 500;
				color: var(--text-normal);
			`;
			historySection.appendChild(historyTitle);

			const historyList = document.createElement("div");
			historyList.style.cssText = `
				display: flex;
				flex-direction: column;
				gap: 8px;
				max-height: 200px;
				overflow-y: auto;
			`;

			this.props.streaks.streakHistory.forEach(streak => {
				const historyItem = this.createHistoryItem(streak);
				historyList.appendChild(historyItem);
			});

			historySection.appendChild(historyList);
			container.appendChild(historySection);
		}

		return container;
	}

	private createStreakCard(icon: string, label: string, value: string, unit: string): HTMLElement {
		const card = document.createElement("div");
		card.style.cssText = `
			background-color: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 6px;
			padding: 16px;
			text-align: center;
		`;

		const iconEl = document.createElement("div");
		iconEl.textContent = icon;
		iconEl.style.cssText = `
			font-size: 32px;
			margin-bottom: 8px;
		`;
		card.appendChild(iconEl);

		const valueEl = document.createElement("div");
		valueEl.textContent = `${value} ${unit}`;
		valueEl.style.cssText = `
			font-size: 24px;
			font-weight: 700;
			color: var(--text-normal);
			margin-bottom: 4px;
		`;
		card.appendChild(valueEl);

		const labelEl = document.createElement("div");
		labelEl.textContent = label;
		labelEl.style.cssText = `
			font-size: 12px;
			color: var(--text-muted);
		`;
		card.appendChild(labelEl);

		return card;
	}

	private createHistoryItem(streak: { startDate: Date; endDate: Date; length: number }): HTMLElement {
		const item = document.createElement("div");
		item.style.cssText = `
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 12px;
			background-color: var(--background-primary);
			border-radius: 4px;
			font-size: 13px;
		`;

		const dateRange = document.createElement("span");
		const startDate = streak.startDate.toLocaleDateString();
		const endDate = streak.endDate.toLocaleDateString();
		dateRange.textContent = `${startDate} - ${endDate}`;
		dateRange.style.cssText = `
			color: var(--text-normal);
		`;
		item.appendChild(dateRange);

		const length = document.createElement("span");
		length.textContent = `${streak.length} days`;
		length.style.cssText = `
			color: var(--text-muted);
			font-weight: 500;
		`;
		item.appendChild(length);

		return item;
	}
}
