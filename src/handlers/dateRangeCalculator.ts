import { ReportCalendar, TrackerSettings } from "../types/habitTypes";

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
	 * Calculate the date range based on tracker settings and optional year
	 * @param settings - Tracker settings containing reportCalendar
	 * @param year - Optional year to calculate range for (defaults to current year)
	 */
	static calculateDateRange(settings: TrackerSettings, year?: number): DateRangeResult {
		const reportCalendar = settings.reportCalendar || ReportCalendar.GREGORIAN;
		
		// Determine the year to use
		const targetYear = year || new Date().getFullYear();
		
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		
		let startDate: Date;
		let endDate: Date;
		let periodLabel: string;
		
		if (reportCalendar === ReportCalendar.JALALI) {
			// Jalali calendar: year starts on Nowruz (March 20/21)
			// Convert Jalali year to Gregorian for date range calculation
			// For simplicity, we'll use March 20th as the start
			startDate = new Date(targetYear, 2, 20); // March 20th
			startDate.setHours(0, 0, 0, 0);
			
			// End date is March 19th of next year
			endDate = new Date(targetYear + 1, 2, 19); // March 19th of next year
			endDate.setHours(23, 59, 59, 999);
			
			periodLabel = `Jalali Year ${targetYear}`;
		} else {
			// Gregorian calendar: year starts on January 1st
			startDate = new Date(targetYear, 0, 1); // January 1st
			startDate.setHours(0, 0, 0, 0);
			
			endDate = new Date(targetYear, 11, 31); // December 31st
			endDate.setHours(23, 59, 59, 999);
			
			periodLabel = `Gregorian Year ${targetYear}`;
		}
		
		return {
			startDate,
			endDate,
			periodLabel
		};
	}
	
	/**
	 * Get a formatted string describing the current date range
	 */
	static getDateRangeDescription(settings: TrackerSettings, year?: number): string {
		const range = this.calculateDateRange(settings, year);
		return `${range.periodLabel} (${range.startDate.toLocaleDateString()} - ${range.endDate.toLocaleDateString()})`;
	}
	
	/**
	 * Convert Gregorian year to Jalali year (simplified approximation)
	 * Jalali year = Gregorian year - 621 (approximately)
	 */
	static gregorianToJalali(gregorianYear: number): number {
		return gregorianYear - 621;
	}
	
	/**
	 * Convert Jalali year to Gregorian year (simplified approximation)
	 * Gregorian year = Jalali year + 621 (approximately)
	 */
	static jalaliToGregorian(jalaliYear: number): number {
		return jalaliYear + 621;
	}
}
