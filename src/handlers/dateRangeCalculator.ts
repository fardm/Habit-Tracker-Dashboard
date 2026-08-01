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
	 * Nowruz can fall on March 20th, 21st, or 22nd depending on the vernal equinox
	 * For recent years: 1404 = March 20, 2025; 1405 = March 20, 2026
	 */
	private static getPersianYearStart(date: Date): Date {
		const year = date.getFullYear();
		
		// Try March 20th first (most common for recent years)
		let persianNewYear = new Date(year, 2, 20); // March 20th (month index 2)
		persianNewYear.setHours(0, 0, 0, 0);
		
		// If current date is before March 20th, the Persian year started last year
		if (date < persianNewYear) {
			persianNewYear.setFullYear(year - 1);
		} else {
			// Check if we should use March 21st for this specific year
			// For years where Nowruz falls on March 21st, we'd need to adjust
			// This is a simplified approach - for exact calculation, use a Persian calendar library
			const march21 = new Date(year, 2, 21);
			march21.setHours(0, 0, 0, 0);
			
			// If date is after March 21st and the Persian year actually started on March 21st
			// This is a heuristic - in production, use jalaali-js or similar
			if (date >= march21 && year >= 2027) {
				// For future years, we might need to adjust this
				// For now, stick with March 20th as it's correct for 1404-1405
			}
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
