/**
 * Supported habit types
 */
export enum HabitType {
	BOOLEAN = "boolean",
	NUMERIC = "numeric"
}

/**
 * Date range filter options
 */
export enum DateRangeFilter {
	YESTERDAY = "yesterday",
	TODAY = "today",
	THIS_WEEK = "this_week",
	THIS_MONTH = "this_month",
	LAST_30_DAYS = "last_30_days",
	LAST_90_DAYS = "last_90_days",
	THIS_YEAR = "this_year",
	CUSTOM = "custom"
}

/**
 * Visualization options for numeric habits
 */
export enum Visualization {
	DONUT = "donut",
	CIRCLE_CHECK = "circle_check",
	NONE = "none"
}

/**
 * Data source type for filtering notes
 */
export enum DataSourceType {
	TAG = "tag",
	FOLDER = "folder"
}

/**
 * Date extraction method
 */
export enum DateExtractionMethod {
	FILENAME = "filename",
	FRONTMATTER = "frontmatter"
}

/**
 * Report calendar system options for habit reports
 */
export enum ReportCalendar {
	GREGORIAN = "gregorian",
	JALALI = "jalali"
}

/**
 * First day of the week for heatmap columns (matches Date.getDay() values)
 */
export enum WeekStartDay {
	SUNDAY = 0,
	MONDAY = 1,
	SATURDAY = 6
}

/**
 * Completion condition operators for numeric habits
 */
export enum CompletionOperator {
	AT_LEAST = "at_least",
	AT_MOST = "at_most",
	EXACTLY = "exactly"
}

/**
 * Completion rule for numeric habits
 */
export interface CompletionRule {
	operator: CompletionOperator;
}

/**
 * User settings stored in tracker file
 */
export interface TrackerSettings {
	viewMode?: ViewMode;
	selectedDate?: string; // ISO date string (YYYY-MM-DD)
	dataSourceType?: DataSourceType;
	dataSourceValue?: string; // Tag or folder path based on type
	dateExtractionMethod?: DateExtractionMethod;
	dateFrontmatterProperty?: string; // Property key if using frontmatter
	reportCalendar?: ReportCalendar; // Calendar system for habit reports (Gregorian or Jalali)
	habitSectionVisibility?: Record<string, {
		showHeatmap: boolean;
		showChart: boolean;
		showStatistics: boolean;
		showStreaks: boolean;
	}>;
	habitHeatmapSettings?: Record<string, {
		weekStartDay?: number;
		showMonthLabels?: boolean;
		colorScaleMode?: string;
		colorScaleMin?: number;
		colorScaleMax?: number;
	}>;
}

/**
 * View mode options
 */
export enum ViewMode {
	GRID = "grid",
	LIST = "list"
}

/**
 * Interface representing a single habit
 */
export interface Habit {
	id: string;
	name: string;
	emoji: string;
	type: HabitType;
	frontmatterField: string;
	createdAt: string;
	order?: number; // For drag-Drop reordering
	unit?: string; // For numeric habits (e.g., "minutes", "pages")
	target?: number; // For numeric habits (e.g., 10)
	visualization?: Visualization; // For numeric habits visualization
	themeColor?: string; // Custom theme color for the habit
	graceDays?: number; // Number of missed days allowed in streak calculations
	completionRule?: CompletionRule; // Completion condition for numeric habits
}

/**
 * Interface representing the tracker file data structure
 */
export interface TrackerData {
	habits: Habit[];
	settings?: TrackerSettings;
}