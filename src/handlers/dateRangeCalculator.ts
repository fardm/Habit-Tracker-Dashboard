import { toJalaali, toGregorian } from "jalaali-js";
import { ReportCalendar, TrackerSettings } from "../types/habitTypes";
import { getCalendarAdapter } from "../utils/calendarAdapter";

/**
 * Result of date range calculation
 */
export interface DateRangeResult {
	startDate: Date;
	endDate: Date;
	periodLabel: string;
}

/**
 * Centralized service for calculating date ranges based on tracker settings.
 * Year numbers are interpreted in the selected calendar system
 * (Gregorian year or Jalali year). Returned bounds are Gregorian Dates
 * suitable for loading habit data keyed by ISO dates.
 */
export class DateRangeCalculator {
	/**
	 * Calculate the date range based on tracker settings and optional year
	 * @param settings - Tracker settings containing reportCalendar
	 * @param year - Year in the selected calendar system (defaults to current)
	 */
	static calculateDateRange(settings: TrackerSettings, year?: number): DateRangeResult {
		const adapter = getCalendarAdapter(
			settings.reportCalendar || ReportCalendar.GREGORIAN
		);
		const targetYear = year ?? adapter.getCurrentYear();

		return {
			startDate: adapter.getYearStart(targetYear),
			endDate: adapter.getYearEnd(targetYear),
			periodLabel: adapter.getPeriodLabel(targetYear)
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
	 * Convert Gregorian calendar year to Jalali year using Jan 1 of that year.
	 */
	static gregorianToJalali(gregorianYear: number): number {
		return toJalaali(gregorianYear, 1, 1).jy;
	}

	/**
	 * Convert Jalali year to the Gregorian year of Farvardin 1.
	 */
	static jalaliToGregorian(jalaliYear: number): number {
		return toGregorian(jalaliYear, 1, 1).gy;
	}
}
