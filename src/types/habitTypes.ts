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
	unit?: string; // For numeric habits (e.g., "minutes", "pages")
	target?: number; // For numeric habits (e.g., 10)
}

/**
 * Interface representing the tracker file data structure
 */
export interface TrackerData {
	habits: Habit[];
	settings?: {
		dateRangeFilter?: DateRangeFilter;
		viewMode?: ViewMode;
		customStartDate?: string;
		customEndDate?: string;
	};
}