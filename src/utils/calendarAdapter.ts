import {
	toJalaali,
	toGregorian,
	isLeapJalaaliYear,
	jalaaliMonthLength
} from "jalaali-js";
import { ReportCalendar, WeekStartDay } from "../types/habitTypes";

/**
 * Heatmap cell for GitHub-style year grids.
 * isoDate is always a Gregorian YYYY-MM-DD key for data lookup.
 */
export interface YearDayCell {
	isoDate: string | null;
	isEmpty: boolean;
	/** 1–12 in the active calendar system; unset for padding cells. */
	month?: number;
	/** Day of month in the active calendar system; unset for padding cells. */
	dayOfMonth?: number;
}

/** Month label positioned above a week column. */
export interface MonthLabel {
	weekIndex: number;
	label: string;
}

export interface YearHeatmapLayout {
	cells: YearDayCell[];
	monthLabels: MonthLabel[];
	weeksCount: number;
}

/**
 * Date adapter layer for calendar rendering.
 * Habit data remains stored/keyed as Gregorian ISO dates;
 * adapters only control year bounds and display formatting.
 */
export interface CalendarDateAdapter {
	readonly system: ReportCalendar;
	getCurrentYear(): number;
	getCurrentMonth(): number;
	getCurrentWeek(): { year: number; weekNumber: number };
	getYearStart(year: number): Date;
	getYearEnd(year: number): Date;
	getDaysInYear(year: number): number;
	getMonthStart(year: number, month: number): Date;
	getMonthEnd(year: number, month: number): Date;
	getWeekStart(year: number, weekNumber: number): Date;
	getWeekEnd(year: number, weekNumber: number): Date;
	formatDisplayDate(date: Date): string;
	formatDisplayDateWithoutYear(date: Date): string;
	getPeriodLabel(year: number): string;
	getPeriodLabelForMonth(year: number, month: number): string;
	getPeriodLabelForWeek(year: number, weekNumber: number): string;
	getMonthName(month: number): string;
	/** Month (1–12) in this calendar for a Gregorian local Date. */
	getMonthOfDate(date: Date): number;
	/** Day of month in this calendar for a Gregorian local Date. */
	getDayOfMonth(date: Date): number;
	buildYearHeatmapLayout(year: number, weekStartDay?: WeekStartDay): YearHeatmapLayout;
}

const GREGORIAN_MONTHS = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const JALALI_MONTHS = [
	"Far", "Ord", "Kho", "Tir", "Mor", "Sha",
	"Meh", "Aba", "Aza", "Dey", "Bah", "Esf"
];

/** Helper function to pad a number with leading zeros */
function padZero(num: number): string {
	return num < 10 ? "0" + num.toString() : num.toString();
}

/** Format a local Date as Gregorian YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalISODate(date: Date): string {
	const y = date.getFullYear();
	const m = padZero(date.getMonth() + 1);
	const d = padZero(date.getDate());
	return y + "-" + m + "-" + d;
}

/** Parse Gregorian YYYY-MM-DD as local midnight. */
export function parseLocalISODate(iso: string): Date {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, m - 1, d);
}

/**
 * Offset of a JS weekday (0=Sun…6=Sat) within a week that starts on weekStartDay.
 * Example: weekStart=Monday(1), Sunday(0) → 6 (last row).
 */
export function dayOffsetInWeek(jsWeekday: number, weekStartDay: WeekStartDay): number {
	return (jsWeekday - weekStartDay + 7) % 7;
}

/**
 * Build chronological week-column cells for a year range.
 * Leading/trailing empty cells pad to full weeks based on weekStartDay.
 * Iteration stays on consecutive Gregorian civil days — no calendar mixing.
 */
function buildHeatmapLayout(
	yearStart: Date,
	daysInYear: number,
	weekStartDay: WeekStartDay,
	getMonth: (date: Date) => number,
	getDayOfMonth: (date: Date) => number,
	getMonthName: (month: number) => string
): YearHeatmapLayout {
	const cells: YearDayCell[] = [];
	const leadingEmpty = dayOffsetInWeek(yearStart.getDay(), weekStartDay);

	for (let i = 0; i < leadingEmpty; i++) {
		cells.push({ isoDate: null, isEmpty: true });
	}

	const cursor = new Date(
		yearStart.getFullYear(),
		yearStart.getMonth(),
		yearStart.getDate()
	);
	for (let i = 0; i < daysInYear; i++) {
		cells.push({
			isoDate: toLocalISODate(cursor),
			isEmpty: false,
			month: getMonth(cursor),
			dayOfMonth: getDayOfMonth(cursor)
		});
		cursor.setDate(cursor.getDate() + 1);
	}

	const remainder = cells.length % 7;
	if (remainder !== 0) {
		for (let i = 0; i < 7 - remainder; i++) {
			cells.push({ isoDate: null, isEmpty: true });
		}
	}

	const weeksCount = cells.length / 7;
	const monthLabels: MonthLabel[] = [];

	for (let weekIndex = 0; weekIndex < weeksCount; weekIndex++) {
		for (let row = 0; row < 7; row++) {
			const cell = cells[weekIndex * 7 + row];
			if (!cell.isEmpty && cell.dayOfMonth === 1 && cell.month !== undefined) {
				monthLabels.push({
					weekIndex,
					label: getMonthName(cell.month)
				});
				break;
			}
		}
	}

	return { cells, monthLabels, weeksCount };
}

class GregorianCalendarAdapter implements CalendarDateAdapter {
	readonly system = ReportCalendar.GREGORIAN;

	getCurrentYear(): number {
		return new Date().getFullYear();
	}

	getCurrentMonth(): number {
		return new Date().getMonth() + 1;
	}

	getCurrentWeek(): { year: number; weekNumber: number } {
		const now = new Date();
		const year = now.getFullYear();
		const yearStart = this.getYearStart(year);
		const weekStart = WeekStartDay.SATURDAY;
		
		// Calculate week number starting from Saturday
		const dayOffset = dayOffsetInWeek(yearStart.getDay(), weekStart);
		const daysSinceStart = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
		const weekNumber = Math.floor((daysSinceStart + dayOffset) / 7) + 1;
		
		return { year, weekNumber };
	}

	getYearStart(year: number): Date {
		const d = new Date(year, 0, 1);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	getYearEnd(year: number): Date {
		const d = new Date(year, 11, 31);
		d.setHours(23, 59, 59, 999);
		return d;
	}

	getDaysInYear(year: number): number {
		const isLeap =
			(year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
		return isLeap ? 366 : 365;
	}

	getMonthStart(year: number, month: number): Date {
		const d = new Date(year, month - 1, 1);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	getMonthEnd(year: number, month: number): Date {
		const d = new Date(year, month, 0);
		d.setHours(23, 59, 59, 999);
		return d;
	}

	getWeekStart(year: number, weekNumber: number): Date {
		const yearStart = this.getYearStart(year);
		const weekStart = WeekStartDay.SATURDAY;
		const dayOffset = dayOffsetInWeek(yearStart.getDay(), weekStart);
		const daysToAdd = (weekNumber - 1) * 7 - dayOffset;
		const d = new Date(yearStart);
		d.setDate(d.getDate() + daysToAdd);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	getWeekEnd(year: number, weekNumber: number): Date {
		const weekStart = this.getWeekStart(year, weekNumber);
		const d = new Date(weekStart);
		d.setDate(d.getDate() + 6);
		d.setHours(23, 59, 59, 999);
		return d;
	}

	formatDisplayDate(date: Date): string {
		return toLocalISODate(date);
	}

	formatDisplayDateWithoutYear(date: Date): string {
		const m = padZero(date.getMonth() + 1);
		const d = padZero(date.getDate());
		return `${m}/${d}`;
	}

	getPeriodLabel(year: number): string {
		return `Year ${year}`;
	}

	getPeriodLabelForMonth(year: number, month: number): string {
		return `${this.getMonthName(month)} ${year}`;
	}

	getPeriodLabelForWeek(year: number, weekNumber: number): string {
		return `Week ${weekNumber}, ${year}`;
	}

	getMonthName(month: number): string {
		return GREGORIAN_MONTHS[month - 1] ?? "";
	}

	getMonthOfDate(date: Date): number {
		return date.getMonth() + 1;
	}

	getDayOfMonth(date: Date): number {
		return date.getDate();
	}

	buildYearHeatmapLayout(year: number, weekStartDay: WeekStartDay = WeekStartDay.SUNDAY): YearHeatmapLayout {
		return buildHeatmapLayout(
			this.getYearStart(year),
			this.getDaysInYear(year),
			weekStartDay,
			(d) => this.getMonthOfDate(d),
			(d) => this.getDayOfMonth(d),
			(m) => this.getMonthName(m)
		);
	}
}

class JalaliCalendarAdapter implements CalendarDateAdapter {
	readonly system = ReportCalendar.JALALI;

	getCurrentYear(): number {
		const now = new Date();
		return toJalaali(
			now.getFullYear(),
			now.getMonth() + 1,
			now.getDate()
		).jy;
	}

	getCurrentMonth(): number {
		const now = new Date();
		return toJalaali(
			now.getFullYear(),
			now.getMonth() + 1,
			now.getDate()
		).jm;
	}

	getCurrentWeek(): { year: number; weekNumber: number } {
		const now = new Date();
		const j = toJalaali(
			now.getFullYear(),
			now.getMonth() + 1,
			now.getDate()
		);
		const year = j.jy;
		const yearStart = this.getYearStart(year);
		const weekStart = WeekStartDay.SATURDAY;
		
		// Calculate week number starting from Saturday
		const dayOffset = dayOffsetInWeek(yearStart.getDay(), weekStart);
		const daysSinceStart = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
		const weekNumber = Math.floor((daysSinceStart + dayOffset) / 7) + 1;
		
		return { year, weekNumber };
	}

	/** Farvardin 1 of the given Jalali year, as a local Gregorian Date. */
	getYearStart(year: number): Date {
		const g = toGregorian(year, 1, 1);
		const d = new Date(g.gy, g.gm - 1, g.gd);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	/** Last day of Esfand (29 or 30), as a local Gregorian Date. */
	getYearEnd(year: number): Date {
		const esfandLength = jalaaliMonthLength(year, 12);
		const g = toGregorian(year, 12, esfandLength);
		const d = new Date(g.gy, g.gm - 1, g.gd);
		d.setHours(23, 59, 59, 999);
		return d;
	}

	getDaysInYear(year: number): number {
		return isLeapJalaaliYear(year) ? 366 : 365;
	}

	getMonthStart(year: number, month: number): Date {
		const g = toGregorian(year, month, 1);
		const d = new Date(g.gy, g.gm - 1, g.gd);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	getMonthEnd(year: number, month: number): Date {
		const monthLength = jalaaliMonthLength(year, month);
		const g = toGregorian(year, month, monthLength);
		const d = new Date(g.gy, g.gm - 1, g.gd);
		d.setHours(23, 59, 59, 999);
		return d;
	}

	getWeekStart(year: number, weekNumber: number): Date {
		const yearStart = this.getYearStart(year);
		const weekStart = WeekStartDay.SATURDAY;
		const dayOffset = dayOffsetInWeek(yearStart.getDay(), weekStart);
		const daysToAdd = (weekNumber - 1) * 7 - dayOffset;
		const d = new Date(yearStart);
		d.setDate(d.getDate() + daysToAdd);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	getWeekEnd(year: number, weekNumber: number): Date {
		const weekStart = this.getWeekStart(year, weekNumber);
		const d = new Date(weekStart);
		d.setDate(d.getDate() + 6);
		d.setHours(23, 59, 59, 999);
		return d;
	}

	formatDisplayDate(date: Date): string {
		const j = toJalaali(
			date.getFullYear(),
			date.getMonth() + 1,
			date.getDate()
		);
		return j.jy + "/" + padZero(j.jm) + "/" + padZero(j.jd);
	}

	formatDisplayDateWithoutYear(date: Date): string {
		const j = toJalaali(
			date.getFullYear(),
			date.getMonth() + 1,
			date.getDate()
		);
		return padZero(j.jm) + "/" + padZero(j.jd);
	}

	getPeriodLabel(year: number): string {
		return `Year ${year}`;
	}

	getPeriodLabelForMonth(year: number, month: number): string {
		return `${this.getMonthName(month)} ${year}`;
	}

	getPeriodLabelForWeek(year: number, weekNumber: number): string {
		return `Week ${weekNumber}, ${year}`;
	}

	getMonthName(month: number): string {
		return JALALI_MONTHS[month - 1] ?? "";
	}

	getMonthOfDate(date: Date): number {
		return toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate()).jm;
	}

	getDayOfMonth(date: Date): number {
		return toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate()).jd;
	}

	buildYearHeatmapLayout(year: number, weekStartDay: WeekStartDay = WeekStartDay.SUNDAY): YearHeatmapLayout {
		return buildHeatmapLayout(
			this.getYearStart(year),
			this.getDaysInYear(year),
			weekStartDay,
			(d) => this.getMonthOfDate(d),
			(d) => this.getDayOfMonth(d),
			(m) => this.getMonthName(m)
		);
	}
}

export function getCalendarAdapter(
	system: ReportCalendar | string | undefined
): CalendarDateAdapter {
	if (system === ReportCalendar.JALALI || system === "jalali") {
		return new JalaliCalendarAdapter();
	}
	return new GregorianCalendarAdapter();
}
