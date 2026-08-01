import { DefaultPeriod, CalendarSystem, TrackerSettings } from "../types/habitTypes";

/**
 * Result of date range calculation
 */
export interface DateRangeResult {
	startDate: Date;
	endDate: Date;
	periodLabel: string;
}

/**
 * Centralized service for calculating date ranges based on tracker settings
 */
export class DateRangeCalculator {
	/**
	 * Calculate the date range based on tracker settings
	 */
	static calculateDateRange(settings: TrackerSettings): DateRangeResult {
		const defaultPeriod = settings.defaultPeriod || DefaultPeriod.CURRENT_YEAR;
		const calendarSystem = settings.calendarSystem || CalendarSystem.GREGORIAN;
		
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		
		let startDate: Date;
		let periodLabel: string;
		
		switch (defaultPeriod) {
			case DefaultPeriod.LAST_365_DAYS:
				startDate = new Date(today);
				startDate.setDate(startDate.getDate() - 365);
				startDate.setHours(0, 0, 0, 0);
				periodLabel = "Last 365 Days";
				break;
				
			case DefaultPeriod.CURRENT_YEAR:
				if (calendarSystem === CalendarSystem.PERSIAN) {
					startDate = this.getPersianYearStart(today);
					periodLabel = "Persian Year";
				} else {
					// Gregorian year
					startDate = new Date(today.getFullYear(), 0, 1);
					startDate.setHours(0, 0, 0, 0);
					periodLabel = "Current Year";
				}
				break;
				
			default:
				// Fallback to current Gregorian year
				startDate = new Date(today.getFullYear(), 0, 1);
				startDate.setHours(0, 0, 0, 0);
				periodLabel = "Current Year";
		}
		
		return {
			startDate,
			endDate: today,
			periodLabel
		};
	}
	
	/**
	 * Calculate the Persian year start (Farvardin 1st) for a given date
	 * This is an approximation that works for most practical purposes
	 */
	private static getPersianYearStart(date: Date): Date {
		// Persian New Year (Nowruz) typically falls on March 20th or 21st
		// We'll use a simplified calculation: find the most recent March 21st
		const year = date.getFullYear();
		const persianNewYear = new Date(year, 2, 21); // March 21st (month index 2)
		persianNewYear.setHours(0, 0, 0, 0);
		
		// If the current date is before March 21st, the Persian year started last year
		if (date < persianNewYear) {
			persianNewYear.setFullYear(year - 1);
		}
		
		return persianNewYear;
	}
	
	/**
	 * Get a formatted string describing the current date range
	 */
	static getDateRangeDescription(settings: TrackerSettings): string {
		const range = this.calculateDateRange(settings);
		return `${range.periodLabel} (${range.startDate.toLocaleDateString()} - ${range.endDate.toLocaleDateString()})`;
	}
}
