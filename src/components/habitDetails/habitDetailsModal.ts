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
import { HabitDataManager } from "../../handlers/habitDataManager";
import { Habit, ReportCalendar } from "../../types/habitTypes";
import { getCalendarAdapter, parseLocalISODate } from "../../utils/calendarAdapter";

/**
 * HabitDetailsModal - Main modal for displaying detailed habit information
 */
export class HabitDetailsModal extends Modal {
	private props: HabitDetailsModalProps;
	private habit: Habit;
	private chartType: ChartType = ChartType.LINE;
	private settings: HabitDetailsSettings;
	private contentContainer?: HTMLElement;
	private readonly storageMapKey: string;
	private dataService: HabitDetailsDataService;
	private trackerDataManager: HabitDataManager | null;
	private dataCache: HabitDataCache;
	private habitValues: HabitValueEntry[] = [];
	private selectedYear: number;
	private yearNavigationContainer?: HTMLElement;

	constructor(app: App, props: HabitDetailsModalProps, habit: Habit, dataCache: HabitDataCache) {
		super(app);
		this.props = props;
		this.habit = habit;
		this.storageMapKey = props.habitId;
		this.settings = this.getDefaultSettings();
		this.trackerDataManager = this.createTrackerDataManager();
		this.dataService = new HabitDetailsDataService(app, props.trackerSettings || {});
		this.dataCache = dataCache;
		
		// Initialize selected year in the active calendar system
		const adapter = getCalendarAdapter(props.trackerSettings?.reportCalendar);
		this.selectedYear = adapter.getCurrentYear();
	}

	async onOpen() {
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

		await this.loadSettingsFromStorage();

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
				void this.saveSettingsToStorage();
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
			display: inline-flex;
			align-items: center;
			gap: 12px;
		`;

		// Previous year button
		const prevButton = navContainer.createEl("button", {
			text: "‹"
		});
		prevButton.style.cssText = `
			color: var(--text-muted);
			cursor: pointer;
			font-size: 16px;
			line-height: 1;
			background: var(--background-secondary);
			padding: 6px 8px;
			border-radius: 6px;
			border: 1px solid var(--background-modifier-border);
			transition: all 0.15s ease;
		`;
		prevButton.onclick = () => this.handleYearChange(-1);
		prevButton.onmouseover = () => {
			prevButton.style.color = "var(--text-normal)";
			prevButton.style.background = "var(--background-modifier-hover)";
		};
		prevButton.onmouseout = () => {
			prevButton.style.color = "var(--text-muted)";
			prevButton.style.background = "transparent";
		};
		prevButton.onmousedown = () => prevButton.style.transform = "scale(0.95)";
		prevButton.onmouseup = () => prevButton.style.transform = "scale(1)";

		// Year display
		const yearDisplay = navContainer.createEl("span", {
			text: this.selectedYear.toString()
		});
		yearDisplay.style.cssText = `
			font-size: 16px;
			font-weight: 600;
			color: var(--text-normal);
			min-width: 50px;
			text-align: center;
			user-select: none;
			background: var(--background-secondary);
			padding: 6px 12px;
			border-radius: 6px;
			border: 1px solid var(--background-modifier-border);
		`;

		// Next year button
		const nextButton = navContainer.createEl("button", {
			text: "›"
		});
		nextButton.style.cssText = `
			color: var(--text-muted);
			cursor: pointer;
			font-size: 16px;
			line-height: 1;

			background: var(--background-secondary);
			padding: 6px 8px;
			border-radius: 6px;
			border: 1px solid var(--background-modifier-border);

			transition: all 0.15s ease;
		`;
		nextButton.onclick = () => this.handleYearChange(1);
		nextButton.onmouseover = () => {
			nextButton.style.color = "var(--text-normal)";
			nextButton.style.background = "var(--background-modifier-hover)";
		};
		nextButton.onmouseout = () => {
			nextButton.style.color = "var(--text-muted)";
			nextButton.style.background = "transparent";
		};
		nextButton.onmousedown = () => nextButton.style.transform = "scale(0.95)";
		nextButton.onmouseup = () => nextButton.style.transform = "scale(1)";
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

		// Year navigation (centered above content)
		this.yearNavigationContainer = this.contentContainer.createDiv({
			cls: "content-section"
		});
		this.yearNavigationContainer.style.cssText = `
			display: flex;
			justify-content: center;
			margin-bottom: 24px;
		`;
		this.renderYearNavigation();

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
				year: this.selectedYear,
				reportCalendar:
					this.props.trackerSettings?.reportCalendar || ReportCalendar.GREGORIAN,
				weekStartDay: this.props.trackerSettings?.weekStartDay,
				showMonthLabels: this.props.trackerSettings?.showMonthLabels ?? false
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
				theme: this.settings.theme,
				reportCalendar:
					this.props.trackerSettings?.reportCalendar || ReportCalendar.GREGORIAN
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
			// selectedYear is already in the active calendar system (Gregorian or Jalali)
			const reportCalendar =
				this.props.trackerSettings?.reportCalendar || ReportCalendar.GREGORIAN;
			const dateRange = DateRangeCalculator.calculateDateRange(
				this.props.trackerSettings || {},
				this.selectedYear
			);

			console.log(
				`[HabitDetailsModal] Loading data for year ${this.selectedYear} (${reportCalendar}), date range: ${dateRange.startDate.toISOString()} to ${dateRange.endDate.toISOString()}`
			);

			const cachedValues = this.dataCache.getHabitValues(
				this.habit,
				dateRange.startDate,
				dateRange.endDate
			);

			console.log(
				`[HabitDetailsModal] Loaded ${cachedValues.length} values from cache for ${this.habit.name}`
			);

			// Parse ISO habit dates as local midnight so heatmap keys stay Gregorian YYYY-MM-DD
			this.habitValues = cachedValues
				.map((v) => ({
					date: parseLocalISODate(v.date.split("T")[0]),
					value: v.value
				}))
				.sort((a, b) => a.date.getTime() - b.date.getTime());

			if (this.contentContainer) {
				this.renderContentSections();
			}
		} catch (error) {
			console.error("Error loading habit data:", error);
		}
	}

	private getDefaultSettings(): HabitDetailsSettings {
		const isBooleanHabit = this.props.habitType === "boolean";

		return {
			theme: {
				primary: this.habit.themeColor || "var(--interactive-accent)",
				secondary: "var(--interactive-accent-hover)",
				accent: "var(--text-accent)",
				background: "var(--background-secondary)"
			},
			sectionVisibility: {
				showHeatmap: true,
				showChart: !isBooleanHabit,
				showStatistics: true,
				showStreaks: true
			},
			defaultChartType: ChartType.LINE
		};
	}

	private createTrackerDataManager(): HabitDataManager | null {
		if (!this.props.trackerFilePath) {
			return null;
		}

		const trackerFile = this.app.vault.getFileByPath(this.props.trackerFilePath);
		return trackerFile ? new HabitDataManager(this.app.vault, trackerFile) : null;
	}

	private async loadSettingsFromStorage(): Promise<void> {
		try {
			const savedVisibility = await this.loadVisibilityFromTrackerFile();
			this.settings = this.mergeSettings(savedVisibility ? { sectionVisibility: savedVisibility } : null);
		} catch (error) {
			console.warn("Failed to load habit details settings from tracker file:", error);
			this.settings = this.getDefaultSettings();
		}
	}

	private async saveSettingsToStorage(): Promise<void> {
		if (!this.trackerDataManager) {
			return;
		}

		try {
			const trackerData = await this.trackerDataManager.readTrackerData();
			const habitSectionVisibility = trackerData.settings?.habitSectionVisibility ?? {};
			habitSectionVisibility[this.storageMapKey] = this.settings.sectionVisibility;
			trackerData.settings = {
				...(trackerData.settings ?? {}),
				habitSectionVisibility
			};
			await this.trackerDataManager.writeTrackerData(trackerData);
		} catch (error) {
			console.warn("Failed to save habit details settings to tracker file:", error);
		}
	}

	private async loadVisibilityFromTrackerFile(): Promise<Record<string, boolean> | null> {
		if (!this.trackerDataManager) {
			return null;
		}

		const trackerData = await this.trackerDataManager.readTrackerData();
		return trackerData.settings?.habitSectionVisibility?.[this.storageMapKey] ?? null;
	}

	private mergeSettings(savedSettings: unknown): HabitDetailsSettings {
		const defaults = this.getDefaultSettings();
		if (!savedSettings || typeof savedSettings !== "object") {
			return defaults;
		}

		const settings = savedSettings as Partial<HabitDetailsSettings>;
		return {
			theme: {
				...defaults.theme,
				...(settings.theme || {})
			},
			sectionVisibility: {
				...defaults.sectionVisibility,
				...(settings.sectionVisibility || {})
			},
			defaultChartType: settings.defaultChartType || defaults.defaultChartType
		};
	}

	private getThemeColor(): string {
		return this.habit.themeColor || "var(--interactive-accent)";
	}

	onClose() {
		void this.saveSettingsToStorage();
		const { contentEl } = this;
		contentEl.empty();
	}
}
