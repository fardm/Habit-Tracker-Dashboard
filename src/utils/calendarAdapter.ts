import {
	toJalaali,
	toGregorian,
	isLeapJalaaliYear,
	jalaaliMonthLength
} from "jalaali-js";
import { ReportCalendar } from "../types/habitTypes";

/**
 * Heatmap cell for GitHub-style year grids.
 * isoDate is always a Gregorian YYYY-MM-DD key for data lookup.
 */
export interface YearDayCell {
	isoDate: string | null;
	isEmpty: boolean;
}

/**
 * Date adapter layer for calendar rendering.
 * Habit data remains stored/keyed as Gregorian ISO dates;
 * adapters only control year bounds and display formatting.
 */
export interface CalendarDateAdapter {
	readonly system: ReportCalendar;
	getCurrentYear(): number;
	getYearStart(year: number): Date;
	getYearEnd(year: number): Date;
	getDaysInYear(year: number): number;
	formatDisplayDate(date: Date): string;
	getPeriodLabel(year: number): string;
	buildYearHeatmapCells(year: number): YearDayCell[];
}

/** Format a local Date as Gregorian YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalISODate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/** Parse Gregorian YYYY-MM-DD as local midnight. */
export function parseLocalISODate(iso: string): Date {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, m - 1, d);
}

/**
 * Build chronological week-column cells for a year range.
 * Leading/trailing empty cells pad to full weeks (Sun–Sat rows).
 * Iteration stays on consecutive Gregorian civil days — no calendar mixing.
 */
function buildHeatmapCells(yearStart: Date, daysInYear: number): YearDayCell[] {
	const cells: YearDayCell[] = [];
	const startDayOfWeek = yearStart.getDay(); // 0 = Sunday

	for (let i = 0; i < startDayOfWeek; i++) {
		cells.push({ isoDate: null, isEmpty: true });
	}

	const cursor = new Date(
		yearStart.getFullYear(),
		yearStart.getMonth(),
		yearStart.getDate()
	);
	for (let i = 0; i < daysInYear; i++) {
		cells.push({ isoDate: toLocalISODate(cursor), isEmpty: false });
		cursor.setDate(cursor.getDate() + 1);
	}

	const remainder = cells.length % 7;
	if (remainder !== 0) {
		for (let i = 0; i < 7 - remainder; i++) {
			cells.push({ isoDate: null, isEmpty: true });
		}
	}

	return cells;
}

class GregorianCalendarAdapter implements CalendarDateAdapter {
	readonly system = ReportCalendar.GREGORIAN;

	getCurrentYear(): number {
		return new Date().getFullYear();
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

	formatDisplayDate(date: Date): string {
		return toLocalISODate(date);
	}

	getPeriodLabel(year: number): string {
		return `Gregorian Year ${year}`;
	}

	buildYearHeatmapCells(year: number): YearDayCell[] {
		return buildHeatmapCells(this.getYearStart(year), this.getDaysInYear(year));
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

	formatDisplayDate(date: Date): string {
		const j = toJalaali(
			date.getFullYear(),
			date.getMonth() + 1,
			date.getDate()
		);
		return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
	}

	getPeriodLabel(year: number): string {
		return `Jalali Year ${year}`;
	}

	buildYearHeatmapCells(year: number): YearDayCell[] {
		return buildHeatmapCells(this.getYearStart(year), this.getDaysInYear(year));
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
