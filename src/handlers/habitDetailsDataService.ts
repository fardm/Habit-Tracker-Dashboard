import { App } from "obsidian";
import { Habit, HabitType, TrackerSettings } from "../types/habitTypes";
import { FrontmatterDataReader, HabitValue } from "./frontmatterDataReader";
import { 
	TimeRange, 
	HabitStatistics, 
	HabitStreaks, 
	StreakEntry, 
	HabitValueEntry 
} from "../types/habitDetailsTypes";

/**
 * Service for calculating habit statistics and aggregating data for details view
 */
export class HabitDetailsDataService {
	private app: App;
	private frontmatterReader: FrontmatterDataReader;

	constructor(app: App, settings: TrackerSettings = {}) {
		this.app = app;
		this.frontmatterReader = new FrontmatterDataReader(app, settings);
	}

	/**
	 * Update the settings for data extraction
	 */
	updateSettings(settings: TrackerSettings): void {
		this.frontmatterReader.updateSettings(settings);
	}

	/**
	 * Get date range based on selected time range
	 */
	getDateRange(timeRange: TimeRange): { startDate: Date; endDate: Date } {
		const endDate = new Date();
		endDate.setHours(23, 59, 59, 999);
		
		const startDate = new Date();
		startDate.setHours(0, 0, 0, 0);

		switch (timeRange) {
			case TimeRange.LAST_7_DAYS:
				startDate.setDate(startDate.getDate() - 6);
				break;
			case TimeRange.LAST_30_DAYS:
				startDate.setDate(startDate.getDate() - 29);
				break;
			case TimeRange.LAST_90_DAYS:
				startDate.setDate(startDate.getDate() - 89);
				break;
			case TimeRange.LAST_YEAR:
				startDate.setFullYear(startDate.getFullYear() - 1);
				break;
			case TimeRange.ALL_TIME:
				startDate.setFullYear(2000); // Arbitrary old date
				break;
			case TimeRange.CUSTOM:
				// Custom ranges should be handled separately
				break;
		}

		return { startDate, endDate };
	}

	/**
	 * Load habit values for a given time range
	 */
	async loadHabitValues(
		habit: Habit,
		timeRange: TimeRange,
		customStart?: Date,
		customEnd?: Date
	): Promise<HabitValueEntry[]> {
		let startDate: Date | undefined;
		let endDate: Date | undefined;

		if (timeRange === TimeRange.CUSTOM && customStart && customEnd) {
			startDate = customStart;
			endDate = customEnd;
		} else if (timeRange !== TimeRange.CUSTOM) {
			const range = this.getDateRange(timeRange);
			startDate = range.startDate;
			endDate = range.endDate;
		}

		const values = await this.frontmatterReader.getHabitValues(habit, startDate, endDate);
		
		// Convert to HabitValueEntry format
		return values.map(v => ({
			date: new Date(v.date),
			value: v.value
		})).sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort oldest first
	}

	/**
	 * Calculate statistics for habit values
	 */
	calculateStatistics(
		values: HabitValueEntry[],
		habitType: "boolean" | "numeric"
	): HabitStatistics {
		if (values.length === 0) {
			return {
				total: 0,
				average: 0,
				highest: 0,
				lowest: 0,
				completionRate: 0
			};
		}

		if (habitType === "boolean") {
			const completedCount = values.filter(v => v.value === true).length;
			const completionRate = (completedCount / values.length) * 100;
			
			return {
				total: completedCount,
				average: completionRate,
				highest: completionRate,
				lowest: completionRate,
				completionRate
			};
		} else {
			const numericValues = values.map(v => v.value as number);
			const total = numericValues.reduce((sum, val) => sum + val, 0);
			const average = total / numericValues.length;
			const highest = Math.max(...numericValues);
			const lowest = Math.min(...numericValues);
			
			// For numeric habits, completion rate is based on target if available
			// Otherwise just use the average as a percentage of some baseline
			const completionRate = average; // Will be adjusted by target in UI if needed
			
			return {
				total,
				average,
				highest,
				lowest,
				completionRate
			};
		}
	}

	/**
	 * Calculate streaks for habit values
	 */
	calculateStreaks(
		values: HabitValueEntry[],
		habitType: "boolean" | "numeric",
		target?: number
	): HabitStreaks {
		if (values.length === 0) {
			return {
				currentStreak: 0,
				longestStreak: 0,
				streakHistory: []
			};
		}

		// Sort values by date
		const sortedValues = [...values].sort((a, b) => a.date.getTime() - b.date.getTime());
		
		const streakHistory: StreakEntry[] = [];
		let currentStreak = 0;
		let longestStreak = 0;
		let currentStreakStart: Date | null = null;
		let tempStreakStart: Date | null = null;
		let tempStreakLength = 0;

		const isCompleted = (value: boolean | number): boolean => {
			if (habitType === "boolean") {
				return value === true;
			} else {
				if (target !== undefined) {
					return (value as number) >= target;
				}
				return (value as number) > 0;
			}
		};

		// Check consecutive days
		for (let i = 0; i < sortedValues.length; i++) {
			const currentValue = sortedValues[i];
			const completed = isCompleted(currentValue.value);

			if (completed) {
				if (tempStreakStart === null) {
					tempStreakStart = currentValue.date;
					tempStreakLength = 1;
				} else {
					// Check if consecutive day
					const prevDate = sortedValues[i - 1].date;
					const dayDiff = (currentValue.date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
					
					if (dayDiff <= 1.5) { // Allow for some timezone variation
						tempStreakLength++;
					} else {
						// End of streak
						if (tempStreakLength > 0) {
							streakHistory.push({
								startDate: tempStreakStart!,
								endDate: prevDate,
								length: tempStreakLength
							});
							if (tempStreakLength > longestStreak) {
								longestStreak = tempStreakLength;
							}
						}
						tempStreakStart = currentValue.date;
						tempStreakLength = 1;
					}
				}
			} else {
				// Break streak
				if (tempStreakLength > 0) {
					streakHistory.push({
						startDate: tempStreakStart!,
						endDate: sortedValues[i - 1].date,
						length: tempStreakLength
					});
					if (tempStreakLength > longestStreak) {
						longestStreak = tempStreakLength;
					}
				}
				tempStreakStart = null;
				tempStreakLength = 0;
			}
		}

		// Add final streak if active
		if (tempStreakLength > 0) {
			streakHistory.push({
				startDate: tempStreakStart!,
				endDate: sortedValues[sortedValues.length - 1].date,
				length: tempStreakLength
			});
			if (tempStreakLength > longestStreak) {
				longestStreak = tempStreakLength;
			}
		}

		// Calculate current streak (streak that includes today or recent days)
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		// Find the most recent streak
		if (streakHistory.length > 0) {
			const mostRecentStreak = streakHistory[streakHistory.length - 1];
			const daysSinceEnd = (today.getTime() - mostRecentStreak.endDate.getTime()) / (1000 * 60 * 60 * 24);
			
			if (daysSinceEnd <= 1.5) {
				currentStreak = mostRecentStreak.length;
			}
		}

		return {
			currentStreak,
			longestStreak,
			streakHistory
		};
	}

	/**
	 * Get heatmap data for calendar visualization
	 */
	getHeatmapData(
		values: HabitValueEntry[],
		habitType: "boolean" | "numeric",
		target?: number,
		weeks: number = 53
	): Map<string, number> {
		const heatmapData = new Map<string, number>();
		const today = new Date();
		
		// Initialize all cells with 0
		for (let week = 0; week < weeks; week++) {
			for (let day = 0; day < 7; day++) {
				const date = new Date(today);
				date.setDate(date.getDate() - ((weeks - week - 1) * 7 + (6 - day)));
				const dateKey = date.toISOString().split('T')[0];
				heatmapData.set(dateKey, 0);
			}
		}

		// Fill in actual values
		values.forEach(entry => {
			const dateKey = entry.date.toISOString().split('T')[0];
			if (heatmapData.has(dateKey)) {
				if (habitType === "boolean") {
					heatmapData.set(dateKey, entry.value === true ? 1 : 0);
				} else {
					const numValue = entry.value as number;
					if (target !== undefined && target > 0) {
						// Normalize to 0-1 range based on target
						heatmapData.set(dateKey, Math.min(numValue / target, 1));
					} else {
						// Just use raw value, will be normalized in visualization
						heatmapData.set(dateKey, numValue);
					}
				}
			}
		});

		return heatmapData;
	}

	/**
	 * Get chart data for line/bar charts
	 */
	getChartData(
		values: HabitValueEntry[],
		timeRange: TimeRange
	): { labels: string[]; data: number[] } {
		const { startDate, endDate } = this.getDateRange(timeRange);
		
		// Generate date labels
		const labels: string[] = [];
		const dataMap = new Map<string, number>();
		
		// Initialize all dates with 0
		const currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			const dateKey = currentDate.toISOString().split('T')[0];
			labels.push(dateKey);
			dataMap.set(dateKey, 0);
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Fill in actual values
		values.forEach(entry => {
			const dateKey = entry.date.toISOString().split('T')[0];
			if (dataMap.has(dateKey)) {
				const numValue = typeof entry.value === 'boolean' 
					? (entry.value ? 1 : 0) 
					: entry.value;
				dataMap.set(dateKey, numValue);
			}
		});

		// Convert to arrays
		const data: number[] = labels.map(label => dataMap.get(label) || 0);

		return { labels, data };
	}
}
