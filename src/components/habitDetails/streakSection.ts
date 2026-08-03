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
		// Container styling is handled by CSS

		const title = document.createElement("h3");
		title.textContent = "Streaks";
		title.className = "streak-title";
		container.appendChild(title);

		// Streak cards grid
		const grid = document.createElement("div");
		grid.className = "streak-grid";

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
			historySection.className = "streak-history-section";

			// Collapsible header
			const historyHeader = document.createElement("div");
			historyHeader.className = "streak-history-header";

			const historyTitle = document.createElement("h4");
			historyTitle.textContent = "Streak History";
			historyTitle.className = "streak-history-title";
			historyHeader.appendChild(historyTitle);

			// Chevron icon
			const chevron = document.createElement("div");
			chevron.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;">
					<polyline points="6 9 12 15 18 9"></polyline>
				</svg>
			`;
			chevron.className = "streak-history-chevron";
			chevron.style.setProperty("--chevron-rotation", this.isExpanded ? '0deg' : '-90deg');
			chevron.style.transform = "var(--chevron-rotation)";
			historyHeader.appendChild(chevron);

			historySection.appendChild(historyHeader);

			// Collapsible content
			const historyContent = document.createElement("div");
			historyContent.className = "streak-history-content";
			if (!this.isExpanded) {
				historyContent.classList.add("hidden");
			}

			const historyList = document.createElement("div");
			historyList.className = "streak-history-list";

			filteredHistory.forEach(streak => {
				const historyItem = this.createHistoryItem(streak);
				historyList.appendChild(historyItem);
			});

			historyContent.appendChild(historyList);
			historySection.appendChild(historyContent);

			// Toggle functionality
			historyHeader.addEventListener("click", () => {
				this.isExpanded = !this.isExpanded;
				chevron.style.setProperty("--chevron-rotation", this.isExpanded ? '0deg' : '-90deg');
				chevron.style.transform = "var(--chevron-rotation)";
				if (this.isExpanded) {
					historyContent.classList.remove("hidden");
					historyContent.classList.add("visible");
				} else {
					historyContent.classList.remove("visible");
					historyContent.classList.add("hidden");
				}
			});

			container.appendChild(historySection);
		}

		return container;
	}

	private createStreakCard(icon: string, label: string, valueText: string): HTMLElement {
		const card = document.createElement("div");
		card.className = "streak-card";

		const iconEl = document.createElement("div");
		iconEl.textContent = icon;
		iconEl.className = "streak-card-icon";
		card.appendChild(iconEl);

		const valueEl = document.createElement("div");
		valueEl.textContent = valueText;
		valueEl.className = "streak-card-value";
		card.appendChild(valueEl);

		const labelEl = document.createElement("div");
		labelEl.textContent = label;
		labelEl.className = "streak-card-label";
		card.appendChild(labelEl);

		return card;
	}

	private createHistoryItem(streak: { startDate: Date; endDate: Date; length: number }): HTMLElement {
		const item = document.createElement("div");
		item.className = "streak-history-item";

		const dateRange = document.createElement("span");
		const adapter = getCalendarAdapter(this.props.reportCalendar);
		const startDate = adapter.formatDisplayDate(streak.startDate);
		const endDate = adapter.formatDisplayDate(streak.endDate);
		dateRange.textContent = `${startDate} - ${endDate}`;
		dateRange.className = "streak-history-date";
		item.appendChild(dateRange);

		const length = document.createElement("span");
		length.textContent = this.formatStreakText(streak.length);
		length.className = "streak-history-length";
		item.appendChild(length);

		return item;
	}
}
