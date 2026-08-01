import { App, Modal } from "obsidian";
import { HTMLElementComponent } from "../htmlElementComponent";
import { HabitDetailsModalProps, TimeRange, ChartType, HabitDetailsSettings, HabitValueEntry, HabitStatistics, HabitStreaks } from "../../types/habitDetailsTypes";
import { TimeRangeSelector } from "./timeRangeSelector";
import { ChartSection } from "./chartSection";
import { StatisticsDashboard } from "./statisticsDashboard";
import { StreakSection } from "./streakSection";
import { CalendarHeatmap } from "./calendarHeatmap";
import { SettingsPanel } from "./settingsPanel";
import { HabitDetailsDataService } from "../../handlers/habitDetailsDataService";
import { Habit } from "../../types/habitTypes";

/**
 * HabitDetailsModal - Main modal for displaying detailed habit information
 */
export class HabitDetailsModal extends Modal {
	private props: HabitDetailsModalProps;
	private habit: Habit;
	private timeRange: TimeRange = TimeRange.LAST_30_DAYS;
	private chartType: ChartType = ChartType.LINE;
	private settings: HabitDetailsSettings;
	private contentContainer?: HTMLElement;
	private dataService: HabitDetailsDataService;
	private habitValues: HabitValueEntry[] = [];

	constructor(app: App, props: HabitDetailsModalProps, habit: Habit) {
		super(app);
		this.props = props;
		this.habit = habit;
		this.settings = this.getDefaultSettings();
		this.dataService = new HabitDetailsDataService(app, props.trackerSettings || {});
	}

	onOpen() {
		const { contentEl, modalEl } = this;
		contentEl.empty();

		// Override modal width with higher priority CSS
		modalEl.style.cssText = `
			width: 850px !important;
			max-width: 95vw !important;
		`;

		// Set modal container styles - let parent modal handle scrolling
		contentEl.style.cssText = `
			width: 100%;
		`;

		// Modal container - no overflow, let parent handle scrolling
		this.contentContainer = contentEl.createDiv({
			cls: "habit-details-modal"
		});
		this.contentContainer.style.cssText = `
			padding: 24px;
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

		// Remove existing selector if present
		const existingSelector = this.contentContainer.querySelector('.time-range-container');
		if (existingSelector) {
			existingSelector.remove();
		}

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
				this.renderTimeRangeSelector();
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
				values: this.habitValues,
				habitType: this.props.habitType,
				target: this.props.target,
				theme: this.settings.theme,
				timeRange: this.timeRange
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
				data: this.habitValues,
				habitType: this.props.habitType,
				unit: this.props.unit,
				target: this.props.target,
				theme: this.settings.theme
			});
			chartSection.appendChild(chart.render());
		}

		// Statistics Dashboard
		if (this.settings.sectionVisibility.showStatistics) {
			const statsSection = this.contentContainer.createDiv({
				cls: "content-section"
			});
			const statistics = this.dataService.calculateStatistics(
				this.habitValues,
				this.props.habitType
			);
			const stats = new StatisticsDashboard({
				statistics: statistics,
				habitType: this.props.habitType,
				unit: this.props.unit,
				theme: this.settings.theme
			});
			statsSection.appendChild(stats.render());
		}

		// Streak Section
		if (this.settings.sectionVisibility.showStreaks) {
			const streakSection = this.contentContainer.createDiv({
				cls: "content-section"
			});
			const streaks = this.dataService.calculateStreaks(
				this.habitValues,
				this.props.habitType,
				this.props.target
			);
			const streakComponent = new StreakSection({
				streaks: streaks,
				theme: this.settings.theme
			});
			streakSection.appendChild(streakComponent.render());
		}
	}

	private async loadHabitData(): Promise<void> {
		try {
			this.habitValues = await this.dataService.loadHabitValues(
				this.habit,
				this.timeRange
			);
			if (this.contentContainer) {
				this.renderContentSections();
			}
		} catch (error) {
			console.error("Error loading habit data:", error);
		}
	}

	private getDefaultSettings(): HabitDetailsSettings {
		return {
			theme: {
				primary: this.habit.themeColor || "var(--interactive-accent)",
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

	private getThemeColor(): string {
		return this.habit.themeColor || "var(--interactive-accent)";
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
