import { TrackerSettings, ReportCalendar, WeekStartDay, CompletionRule } from "./habitTypes";

/**
 * Time range options for habit details view
 */
export enum TimeRange {
	LAST_7_DAYS = "last_7_days",
	LAST_30_DAYS = "last_30_days",
	LAST_90_DAYS = "last_90_days",
	LAST_YEAR = "last_year",
	ALL_TIME = "all_time",
	CUSTOM = "custom"
}

/**
 * Chart type options for progress visualization
 */
export enum ChartType {
	LINE = "line",
	BAR = "bar"
}

/**
 * Section visibility settings for habit details view
 */
export interface SectionVisibility {
	showHeatmap: boolean;
	showChart: boolean;
	showStatistics: boolean;
	showStreaks: boolean;
}

/**
 * Color theme settings for habit details view
 */
export interface ColorTheme {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
}

/**
 * Settings for habit details view
 */
export interface HabitDetailsSettings {
	theme: ColorTheme;
	sectionVisibility: SectionVisibility;
	defaultChartType: ChartType;
}

/**
 * Statistics data for a habit
 */
export interface HabitStatistics {
	total: number;
	average: number;
	highest: number;
	lowest: number;
	completionRate: number;
}

/**
 * Streak data for a habit
 */
export interface HabitStreaks {
	currentStreak: number;
	longestStreak: number;
	streakHistory: StreakEntry[];
}

/**
 * Individual streak entry
 */
export interface StreakEntry {
	startDate: Date;
	endDate: Date;
	length: number;
}

/**
 * Daily habit value entry
 */
export interface HabitValueEntry {
	date: Date;
	value: boolean | number;
}

/**
 * Data required for habit details view
 */
export interface HabitDetailsData {
	habitId: string;
	habitName: string;
	habitEmoji: string;
	habitType: "boolean" | "numeric";
	unit?: string;
	target?: number;
	completionRule?: CompletionRule;
	values: HabitValueEntry[];
	timeRange: TimeRange;
	customDateStart?: Date;
	customDateEnd?: Date;
}

/**
 * Props for HabitDetailsModal
 */
export interface HabitDetailsModalProps {
	habitId: string;
	habitName: string;
	habitEmoji: string;
	habitType: "boolean" | "numeric";
	unit?: string;
	target?: number;
	trackerSettings?: TrackerSettings;
	trackerFilePath?: string;
	onClose: () => void;
}

/**
 * Props for TimeRangeSelector
 */
export interface TimeRangeSelectorProps {
	currentRange: TimeRange;
	onRangeChange: (range: TimeRange) => void;
}

/**
 * Props for ChartSection
 */
export interface ChartSectionProps {
	chartType: ChartType;
	onChartTypeChange: (type: ChartType) => void;
	data: HabitValueEntry[];
	habitType: "boolean" | "numeric";
	unit?: string;
	target?: number;
	theme?: ColorTheme;
	reportCalendar?: ReportCalendar | string;
}

/**
 * Props for StatisticsDashboard
 */
export interface StatisticsDashboardProps {
	statistics: HabitStatistics;
	habitType: "boolean" | "numeric";
	unit?: string;
	theme?: ColorTheme;
}

/**
 * Props for StreakSection
 */
export interface StreakSectionProps {
	streaks: HabitStreaks;
	theme?: ColorTheme;
	minimumStreakLength?: number;
	reportCalendar?: ReportCalendar | string;
}

/**
 * Color scale mode for heatmap
 */
export enum ColorScaleMode {
	AUTOMATIC = "automatic",
	MANUAL = "manual"
}

/**
 * Heatmap-specific settings
 */
export interface HeatmapSettings {
	/** First day of each week column (default Sunday). */
	weekStartDay?: WeekStartDay;
	/** Show month names above the heatmap grid. */
	showMonthLabels?: boolean;
	/** Color scale mode for heatmap intensity. */
	colorScaleMode?: ColorScaleMode;
	/** Minimum value for manual color scaling. */
	colorScaleMin?: number;
	/** Maximum value for manual color scaling. */
	colorScaleMax?: number;
}

/**
 * Props for CalendarHeatmap
 */
export interface CalendarHeatmapProps {
	values: HabitValueEntry[];
	habitType: "boolean" | "numeric";
	target?: number;
	theme?: ColorTheme;
	/** Year in the selected calendar system (Gregorian or Jalali). */
	year?: number;
	/** Calendar system used for year bounds and display labels. */
	reportCalendar?: ReportCalendar | string;
	/** Heatmap-specific settings. */
	heatmapSettings?: HeatmapSettings;
	/** Callback when heatmap settings change. */
	onHeatmapSettingsChange?: (settings: HeatmapSettings) => void;
	/** @deprecated Yearly heatmap ignores rolling time ranges. */
	timeRange?: TimeRange;
}

/**
 * Props for SettingsPanel
 */
export interface SettingsPanelProps {
	settings: HabitDetailsSettings;
	onSettingsChange: (settings: HabitDetailsSettings) => void;
}
