import { App, Modal } from "obsidian";
import { HTMLElementComponent } from "../htmlElementComponent";
import { HabitDetailsModalProps, ChartType, HabitDetailsSettings, HabitValueEntry, HabitStatistics, HabitStreaks } from "../../types/habitDetailsTypes";
import { ChartSection } from "./chartSection";
import { StatisticsDashboard } from "./statisticsDashboard";
import { StreakSection } from "./streakSection";
import { CalendarHeatmap } from "./calendarHeatmap";
import { SettingsPanel } from "./settingsPanel";
import { HabitDetailsDataService } from "../../handlers/habitDetailsDataService";
import { DateRangeCalculator } from "../../handlers/dateRangeCalculator";
import { HabitDataCache } from "../../handlers/habitDataCache";
import { Habit } from "../../types/habitTypes";

/**
 * HabitDetailsModal - Main modal for displaying detailed habit information
 */
export class HabitDetailsModal extends Modal {
	private props: HabitDetailsModalProps;
	private habit: Habit;
	private chartType: ChartType = ChartType.LINE;
	private settings: HabitDetailsSettings;
	private contentContainer?: HTMLElement;
	private dataService: HabitDetailsDataService;
	private dataCache: HabitDataCache;
	private habitValues: HabitValueEntry[] = [];
	private selectedYear: number;
	private yearNavigationContainer?: HTMLElement;

	constructor(app: App, props: HabitDetailsModalProps, habit: Habit, dataCache: HabitDataCache) {
		super(app);
		this.props = props;
		this.habit = habit;
		this.settings = this.getDefaultSettings();
		this.dataService = new HabitDetailsDataService(app, props.trackerSettings || {});
		this.dataCache = dataCache;
		
		// Initialize selected year based on report calendar
		const reportCalendar = props.trackerSettings?.reportCalendar || "gregorian";
		if (reportCalendar === "jalali") {
			// Use current Jalali year
			this.selectedYear = DateRangeCalculator.gregorianToJalali(new Date().getFullYear());
		} else {
			// Use current Gregorian year
			this.selectedYear = new Date().getFullYear();
		}
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

		// Left side: Habit info and year navigation
		const leftSection = header.createDiv();
		leftSection.style.cssText = `
			display: flex;
			align-items: center;
			gap: 24px;
		`;

		// Habit info
		const habitInfo = leftSection.createDiv();
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

		// Year navigation
		this.yearNavigationContainer = leftSection.createDiv();
		this.renderYearNavigation();

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

	private renderYearNavigation(): void {
		if (!this.yearNavigationContainer) return;

		this.yearNavigationContainer.empty();

		const navContainer = this.yearNavigationContainer.createDiv();
		navContainer.style.cssText = `
			display: flex;
			align-items: center;
			gap: 8px;
			background: var(--background-secondary);
			padding: 8px 16px;
			border-radius: 8px;
		`;

		// Previous year button
		const prevButton = navContainer.createEl("button", {
			text: "◀"
		});
		prevButton.style.cssText = `
			background: transparent;
			border: none;
			color: var(--text-normal);
			cursor: pointer;
			font-size: 16px;
			padding: 4px 8px;
			border-radius: 4px;
		`;
		prevButton.onclick = () => this.handleYearChange(-1);
		prevButton.onmouseover = () => prevButton.style.background = "var(--background-modifier-hover)";
		prevButton.onmouseout = () => prevButton.style.background = "transparent";

		// Year display
		const yearDisplay = navContainer.createEl("span", {
			text: this.selectedYear.toString()
		});
		yearDisplay.style.cssText = `
			font-size: 18px;
			font-weight: 600;
			color: var(--text-normal);
			min-width: 60px;
			text-align: center;
		`;

		// Next year button
		const nextButton = navContainer.createEl("button", {
			text: "▶"
		});
		nextButton.style.cssText = `
			background: transparent;
			border: none;
			color: var(--text-normal);
			cursor: pointer;
			font-size: 16px;
			padding: 4px 8px;
			border-radius: 4px;
		`;
		nextButton.onclick = () => this.handleYearChange(1);
		nextButton.onmouseover = () => nextButton.style.background = "var(--background-modifier-hover)";
		nextButton.onmouseout = () => nextButton.style.background = "transparent";
	}

	private handleYearChange(delta: number): void {
		this.selectedYear += delta;
		this.renderYearNavigation();
		this.loadHabitData();
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
				theme: this.settings.theme
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
				this.props.target,
				this.habit.graceDays ?? 0
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
			// Calculate date range using selected year and report calendar
			const reportCalendar = this.props.trackerSettings?.reportCalendar || "gregorian";
			let targetYear: number;
			
			if (reportCalendar === "jalali") {
				// Convert Jalali year to Gregorian for date range calculation
				targetYear = DateRangeCalculator.jalaliToGregorian(this.selectedYear);
			} else {
				// Use Gregorian year directly
				targetYear = this.selectedYear;
			}
			
			const dateRange = DateRangeCalculator.calculateDateRange(
				this.props.trackerSettings || {},
				targetYear
			);
			
			console.log(`[HabitDetailsModal] Loading data for year ${this.selectedYear} (${reportCalendar}), date range: ${dateRange.startDate.toISOString()} to ${dateRange.endDate.toISOString()}`);
			
			// Use cache for complete historical data instead of dataService
			const cachedValues = this.dataCache.getHabitValues(
				this.habit,
				dateRange.startDate,
				dateRange.endDate
			);
			
			console.log(`[HabitDetailsModal] Loaded ${cachedValues.length} values from cache for ${this.habit.name}`);
			
			// Convert to HabitValueEntry format
			this.habitValues = cachedValues.map(v => ({
				date: new Date(v.date),
				value: v.value
			})).sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort oldest first
			
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
