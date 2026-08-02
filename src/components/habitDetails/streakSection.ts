import { HTMLElementComponent } from "../htmlElementComponent";
import { StreakSectionProps, HabitStreaks } from "../../types/habitDetailsTypes";
import { getCalendarAdapter } from "../../utils/calendarAdapter";

/**
 * StreakSection component for displaying habit streak information
 */
export class StreakSection extends HTMLElementComponent {
	private props: StreakSectionProps;
	private isExpanded: boolean = false;

	constructor(props: StreakSectionProps) {
		super();
		this.props = props;
	}

	private getThemeColor(): string {
		return this.props.theme?.primary || "var(--interactive-accent)";
	}

	private formatStreakText(value: number): string {
		if (value === 0) {
			return "-";
		}
		return `${value} day${value === 1 ? '' : 's'}`;
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
			this.formatStreakText(this.props.streaks.currentStreak)
		);
		grid.appendChild(currentStreakCard);

		// Longest streak card
		const longestStreakCard = this.createStreakCard(
			"🏆",
			"Longest Streak",
			this.formatStreakText(this.props.streaks.longestStreak)
		);
		grid.appendChild(longestStreakCard);

		container.appendChild(grid);

		// Streak history section
		const minimumLength = this.props.minimumStreakLength || 7;
		const filteredHistory = this.props.streaks.streakHistory.filter(streak => streak.length >= minimumLength);
		
		if (filteredHistory.length > 0) {
			const historySection = document.createElement("div");
			historySection.style.cssText = `
				margin-top: 20px;
				padding-top: 16px;
				border-top: 1px solid var(--background-modifier-border);
			`;

			// Collapsible header
			const historyHeader = document.createElement("div");
			historyHeader.style.cssText = `
				display: flex;
				align-items: center;
				justify-content: space-between;
				cursor: pointer;
				padding: 8px 0;
				user-select: none;
			`;

			const historyTitle = document.createElement("h4");
			historyTitle.textContent = "Streak History";
			historyTitle.style.cssText = `
				margin: 0;
				font-size: 14px;
				font-weight: 500;
				color: var(--text-normal);
			`;
			historyHeader.appendChild(historyTitle);

			// Chevron icon
			const chevron = document.createElement("div");
			chevron.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;">
					<polyline points="6 9 12 15 18 9"></polyline>
				</svg>
			`;
			chevron.style.cssText = `
				color: var(--text-muted);
				transform: ${this.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'};
			`;
			historyHeader.appendChild(chevron);

			historySection.appendChild(historyHeader);

			// Collapsible content
			const historyContent = document.createElement("div");
			historyContent.style.cssText = `
				display: ${this.isExpanded ? 'block' : 'none'};
				margin-top: 12px;
			`;

			const historyList = document.createElement("div");
			historyList.style.cssText = `
				display: flex;
				flex-direction: column;
				gap: 8px;
			`;

			filteredHistory.forEach(streak => {
				const historyItem = this.createHistoryItem(streak);
				historyList.appendChild(historyItem);
			});

			historyContent.appendChild(historyList);
			historySection.appendChild(historyContent);

			// Toggle functionality
			historyHeader.addEventListener("click", () => {
				this.isExpanded = !this.isExpanded;
				chevron.style.transform = this.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
				historyContent.style.display = this.isExpanded ? 'block' : 'none';
			});

			container.appendChild(historySection);
		}

		return container;
	}

	private createStreakCard(icon: string, label: string, valueText: string): HTMLElement {
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
		valueEl.textContent = valueText;
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
		const adapter = getCalendarAdapter(this.props.reportCalendar);
		const startDate = adapter.formatDisplayDate(streak.startDate);
		const endDate = adapter.formatDisplayDate(streak.endDate);
		dateRange.textContent = `${startDate} - ${endDate}`;
		dateRange.style.cssText = `
			color: var(--text-normal);
		`;
		item.appendChild(dateRange);

		const length = document.createElement("span");
		length.textContent = this.formatStreakText(streak.length);
		length.style.cssText = `
			color: var(--text-muted);
			font-weight: 500;
		`;
		item.appendChild(length);

		return item;
	}
}
