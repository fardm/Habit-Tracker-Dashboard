/**
 * Supported habit types
 */
export enum HabitType {
	BOOLEAN = "boolean",
	NUMERIC = "numeric"
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
}

/**
 * Interface representing the tracker file data structure
 */
export interface TrackerData {
	habits: Habit[];
	settings?: {
		// Future settings can be added here
	};
}