import { App, Modal } from "obsidian";
import { HTMLElementComponent } from "../htmlElementComponent";
import { HabitDetailsModalProps, TimeRange, ChartType, HabitDetailsSettings, HabitValueEntry, HabitStatistics, HabitStreaks } from "../../types/habitDetailsTypes";
import { TimeRangeSelector } from "./timeRangeSelector";
import { ChartSection } from "./chartSection";
import { StatisticsDashboard } from "./statisticsDashboard";
import { StreakSection } from "./streakSection";
import { CalendarHeatmap } from "./calendarHeatmap";
import { SettingsPanel } from "./settingsPanel";

/**
 * HabitDetailsModal - Main modal for displaying detailed habit information
 */
export class HabitDetailsModal extends Modal {
	private props: HabitDetailsModalProps;
	private timeRange: TimeRange = TimeRange.LAST_30_DAYS;
	private chartType: ChartType = ChartType.LINE;
	private settings: HabitDetailsSettings;
	private contentContainer?: HTMLElement;

	constructor(app: App, props: HabitDetailsModalProps) {
		super(app);
		this.props = props;
		this.settings = this.getDefaultSettings();
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Modal container
		this.contentContainer = contentEl.createDiv({
			cls: "habit-details-modal"
		});
		this.contentContainer.style.cssText = `
			padding: 24px;
			max-width: 900px;
			max-height: 85vh;
			overflow-y: auto;
		`;

		// Header section
		this.renderHeader();

		// Time range selector
		this.renderTimeRangeSelector();

		// Main content sections
		this.renderContentSections();

		// Initial data load (placeholder)
		this.loadHabitData();
	}

	private renderHeader(): void {
		if (!this.contentContainer) return;

		const header = this.contentContainer.createDiv({
			cls: "habit-details-header"
		});
		header.style.cssText = `
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 24px;
			padding-bottom: 16px;
			border-bottom: 1px solid var(--background-modifier-border);
		`;

		// Habit info
		const habitInfo = header.createDiv();
		habitInfo.style.cssText = `
			display: flex;
			align-items: center;
			gap: 12px;
		`;

		const emoji = habitInfo.createSpan({
			text: this.props.habitEmoji
		});
		emoji.style.cssText = `
			font-size: 32px;
		`;

		const habitName = habitInfo.createEl("h2", {
			text: this.props.habitName
		});
		habitName.style.cssText = `
			margin: 0;
			font-size: 24px;
			font-weight: 600;
			color: var(--text-normal);
		`;

		// Settings panel
		const settingsPanel = new SettingsPanel({
			settings: this.settings,
			onSettingsChange: (newSettings) => {
				this.settings = newSettings;
				this.renderContentSections();
			}
		});
		header.appendChild(settingsPanel.render());
	}

	private renderTimeRangeSelector(): void {
		if (!this.contentContainer) return;

		const selectorContainer = this.contentContainer.createDiv({
			cls: "time-range-container"
		});
		selectorContainer.style.cssText = `
			margin-bottom: 20px;
		`;

		const selector = new TimeRangeSelector({
			currentRange: this.timeRange,
			onRangeChange: (newRange) => {
				this.timeRange = newRange;
				this.loadHabitData();
			}
		});
		selectorContainer.appendChild(selector.render());
	}

	private renderContentSections(): void {
		if (!this.contentContainer) return;

		// Remove existing content sections
		const existingSections = this.contentContainer.querySelectorAll('.content-section');
		existingSections.forEach(section => section.remove());

		// Calendar Heatmap
		if (this.settings.sectionVisibility.showHeatmap) {
			const heatmapSection = this.contentContainer.createDiv({
				cls: "content-section"
			});
			const heatmap = new CalendarHeatmap({
				values: [],
				habitType: this.props.habitType,
				target: this.props.target
			});
			heatmapSection.appendChild(heatmap.render());
		}

		// Chart Section
		if (this.settings.sectionVisibility.showChart) {
			const chartSection = this.contentContainer.createDiv({
				cls: "content-section"
			});
			const chart = new ChartSection({
				chartType: this.chartType,
				onChartTypeChange: (newType) => {
					this.chartType = newType;
					this.renderContentSections();
				},
				data: [],
				habitType: this.props.habitType,
				unit: this.props.unit,
				target: this.props.target
			});
			chartSection.appendChild(chart.render());
		}

		// Statistics Dashboard
		if (this.settings.sectionVisibility.showStatistics) {
			const statsSection = this.contentContainer.createDiv({
				cls: "content-section"
			});
			const stats = new StatisticsDashboard({
				statistics: this.getPlaceholderStatistics(),
				habitType: this.props.habitType,
				unit: this.props.unit
			});
			statsSection.appendChild(stats.render());
		}

		// Streak Section
		if (this.settings.sectionVisibility.showStreaks) {
			const streakSection = this.contentContainer.createDiv({
				cls: "content-section"
			});
			const streaks = new StreakSection({
				streaks: this.getPlaceholderStreaks()
			});
			streakSection.appendChild(streaks.render());
		}
	}

	private getDefaultSettings(): HabitDetailsSettings {
		return {
			theme: {
				primary: "var(--interactive-accent)",
				secondary: "var(--interactive-accent-hover)",
				accent: "var(--text-accent)",
				background: "var(--background-secondary)"
			},
			sectionVisibility: {
				showHeatmap: true,
				showChart: true,
				showStatistics: true,
				showStreaks: true
			},
			defaultTimeRange: TimeRange.LAST_30_DAYS,
			defaultChartType: ChartType.LINE
		};
	}

	private getPlaceholderStatistics(): HabitStatistics {
		return {
			total: 0,
			average: 0,
			highest: 0,
			lowest: 0,
			completionRate: 0
		};
	}

	private getPlaceholderStreaks(): HabitStreaks {
		return {
			currentStreak: 0,
			longestStreak: 0,
			streakHistory: []
		};
	}

	private async loadHabitData(): Promise<void> {
		// Placeholder for data loading logic
		// This will be implemented in a later phase
		// For now, we just re-render with placeholder data
		if (this.contentContainer) {
			this.renderContentSections();
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
