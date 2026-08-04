import { HTMLElementComponent } from "../htmlElementComponent";
import { StreakSectionProps } from "../../types/habitDetailsTypes";
import { getCalendarAdapter } from "../../utils/calendarAdapter";

/**
 * StreakSection component for displaying habit streak information
 */
export class StreakSection extends HTMLElementComponent {
	private props: StreakSectionProps;
	private isExpanded = false;

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
		const container = createDiv({ cls: "streak-section" });
		// Container styling is handled by CSS

		const title = createEl("h3", {
			cls: "streak-title",
			text: "Streaks"
		});
		container.appendChild(title);

		// Streak cards grid
		const grid = createDiv({ cls: "streak-grid" });

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
			const historySection = createDiv({ cls: "streak-history-section" });

			// Collapsible header
			const historyHeader = createDiv({ cls: "streak-history-header" });

			const historyTitle = createEl("h4", {
				cls: "streak-history-title",
				text: "Streak History"
			});
			historyHeader.appendChild(historyTitle);

			// Chevron icon
			const chevron = createDiv({ cls: "streak-history-chevron" });
			chevron.style.setProperty("--chevron-rotation", this.isExpanded ? '0deg' : '-90deg');
			
			
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("width", "16");
			svg.setAttribute("height", "16");
			svg.setAttribute("viewBox", "0 0 24 24");
			svg.setAttribute("fill", "none");
			svg.setAttribute("stroke", "currentColor");
			svg.setAttribute("stroke-width", "2");
			svg.setAttribute("stroke-linecap", "round");
			svg.setAttribute("stroke-linejoin", "round");
			
			
			const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
			polyline.setAttribute("points", "6 9 12 15 18 9");
			svg.appendChild(polyline);
			chevron.appendChild(svg);
			historyHeader.appendChild(chevron);

			historySection.appendChild(historyHeader);

			// Collapsible content
			const historyContent = createDiv({ cls: "streak-history-content" });
			if (!this.isExpanded) {
				historyContent.classList.add("hidden");
			}

			const historyList = createDiv({ cls: "streak-history-list" });

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
		const card = createDiv({ cls: "streak-card" });

		const iconEl = createDiv({
			cls: "streak-card-icon",
			text: icon
		});
		card.appendChild(iconEl);

		const valueEl = createDiv({
			cls: "streak-card-value",
			text: valueText
		});
		card.appendChild(valueEl);

		const labelEl = createDiv({
			cls: "streak-card-label",
			text: label
		});
		card.appendChild(labelEl);

		return card;
	}

	private createHistoryItem(streak: { startDate: Date; endDate: Date; length: number }): HTMLElement {
		const item = createDiv({ cls: "streak-history-item" });

		const dateRange = createSpan({
			cls: "streak-history-date"
		});
		const adapter = getCalendarAdapter(this.props.reportCalendar);
		const startDate = adapter.formatDisplayDate(streak.startDate);
		const endDate = adapter.formatDisplayDate(streak.endDate);
		dateRange.textContent = `${startDate} - ${endDate}`;
		item.appendChild(dateRange);

		const length = createSpan({
			cls: "streak-history-length",
			text: this.formatStreakText(streak.length)
		});
		item.appendChild(length);

		return item;
	}
}
