import { toJalaali, toGregorian } from "jalaali-js";
import { ReportCalendar, TrackerSettings } from "../types/habitTypes";
import { ReportPeriod } from "../types/habitDetailsTypes";
import { getCalendarAdapter } from "../utils/calendarAdapter";

/**
 * Result of date range calculation
 */
export interface DateRangeResult {
	startDate: Date;
	endDate: Date;
	periodLabel: string;
	period: ReportPeriod;
	year: number;
	month?: number;
	weekNumber?: number;
}

/**
 * Centralized service for calculating date ranges based on tracker settings.
 * Year/month/week numbers are interpreted in the selected calendar system
 * (Gregorian or Jalali). Returned bounds are Gregorian Dates
 * suitable for loading habit data keyed by ISO dates.
 */
export class DateRangeCalculator {
	/**
	 * Calculate the date range based on tracker settings, period, and optional values
	 * @param settings - Tracker settings containing reportCalendar
	 * @param period - The report period (year, month, or week)
	 * @param year - Year in the selected calendar system (defaults to current)
	 * @param month - Month in the selected calendar system (1-12, defaults to current for month period)
	 * @param weekNumber - Week number in the selected calendar system (defaults to current for week period)
	 */
	static calculateDateRange(
		settings: TrackerSettings,
		period: ReportPeriod = ReportPeriod.YEAR,
		year?: number,
		month?: number,
		weekNumber?: number
	): DateRangeResult {
		const adapter = getCalendarAdapter(
			settings.reportCalendar || ReportCalendar.GREGORIAN
		);
		
		switch (period) {
			case ReportPeriod.YEAR: {
				const targetYear = year ?? adapter.getCurrentYear();
				return {
					startDate: adapter.getYearStart(targetYear),
					endDate: adapter.getYearEnd(targetYear),
					periodLabel: adapter.getPeriodLabel(targetYear),
					period: ReportPeriod.YEAR,
					year: targetYear
				};
			}
			case ReportPeriod.MONTH: {
				const targetYear = year ?? adapter.getCurrentYear();
				const targetMonth = month ?? adapter.getCurrentMonth();
				return {
					startDate: adapter.getMonthStart(targetYear, targetMonth),
					endDate: adapter.getMonthEnd(targetYear, targetMonth),
					periodLabel: adapter.getPeriodLabelForMonth(targetYear, targetMonth),
					period: ReportPeriod.MONTH,
					year: targetYear,
					month: targetMonth
				};
			}
			case ReportPeriod.WEEK: {
				const targetYear = year ?? adapter.getCurrentWeek().year;
				const targetWeek = weekNumber ?? adapter.getCurrentWeek().weekNumber;
				return {
					startDate: adapter.getWeekStart(targetYear, targetWeek),
					endDate: adapter.getWeekEnd(targetYear, targetWeek),
					periodLabel: adapter.getPeriodLabelForWeek(targetYear, targetWeek),
					period: ReportPeriod.WEEK,
					year: targetYear,
					weekNumber: targetWeek
				};
			}
		}
	}

	/**
	 * Calculate the date range for year period (legacy method for backward compatibility)
	 * @param settings - Tracker settings containing reportCalendar
	 * @param year - Year in the selected calendar system (defaults to current)
	 */
	static calculateDateRangeForYear(settings: TrackerSettings, year?: number): DateRangeResult {
		return this.calculateDateRange(settings, ReportPeriod.YEAR, year);
	}

	/**
	 * Get a formatted string describing the current date range
	 */
	static getDateRangeDescription(settings: TrackerSettings, year?: number): string {
		const range = this.calculateDateRange(settings, ReportPeriod.YEAR, year);
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
