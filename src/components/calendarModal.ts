import { App, Modal } from "obsidian";
import { ReportCalendar } from "../types/habitTypes";
import { getCalendarAdapter, CalendarDateAdapter } from "../utils/calendarAdapter";
import {
	toJalaali,
	toGregorian,
	jalaaliMonthLength
} from "jalaali-js";

/**
 * Callback for when a date is selected in the calendar modal
 */
export type DateSelectionCallback = (date: Date) => void;

/**
 * Calendar modal for date selection with support for Gregorian and Jalali calendars
 */
export class CalendarModal extends Modal {
	private currentDate: Date;
	private selectedDate: Date;
	private onDateSelect: DateSelectionCallback;
	private calendarAdapter: CalendarDateAdapter;
	private viewYear: number;
	private viewMonth: number;

	constructor(
		app: App,
		initialDate: Date,
		onDateSelect: DateSelectionCallback,
		calendarSystem: ReportCalendar = ReportCalendar.GREGORIAN
	) {
		super(app);
		this.currentDate = new Date(initialDate);
		this.selectedDate = new Date(initialDate);
		this.onDateSelect = onDateSelect;
		this.calendarAdapter = getCalendarAdapter(calendarSystem);
		
		// Initialize view to the selected date's year/month in the active calendar
		this.viewYear = this.getViewYear(this.selectedDate);
		this.viewMonth = this.calendarAdapter.getMonthOfDate(this.selectedDate);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("calendar-modal");

		// Header with month/year navigation
		const header = contentEl.createDiv({ cls: "calendar-header" });
		this.renderHeader(header);

		// Weekday headers
		const weekdays = contentEl.createDiv({ cls: "calendar-weekdays" });
		this.renderWeekdays(weekdays);

		// Calendar grid
		const grid = contentEl.createDiv({ cls: "calendar-grid" });
		this.renderCalendarGrid(grid);

		// Footer with today button
		const footer = contentEl.createDiv({ cls: "calendar-footer" });
		this.renderFooter(footer);
	}

	private renderHeader(container: HTMLElement): void {
		const navContainer = container.createDiv({ cls: "calendar-nav" });

		// Previous month button
		const prevButton = navContainer.createEl("button", {
			cls: "calendar-nav-button",
			text: "◀"
		});
		prevButton.addEventListener("click", () => {
			this.navigateMonth(-1);
		});

		// Month/year label
		const label = navContainer.createEl("span", {
			cls: "calendar-nav-label",
			text: this.getMonthYearLabel()
		});

		// Next month button
		const nextButton = navContainer.createEl("button", {
			cls: "calendar-nav-button",
			text: "▶"
		});
		nextButton.addEventListener("click", () => {
			this.navigateMonth(1);
		});
	}

	private renderWeekdays(container: HTMLElement): void {
		const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		weekdayNames.forEach(day => {
			container.createEl("span", {
				cls: "calendar-weekday",
				text: day
			});
		});
	}

	private renderCalendarGrid(container: HTMLElement): void {
		container.empty();

		// Get the first day of the view month
		const firstDayOfMonth = this.getFirstDayOfMonth(this.viewYear, this.viewMonth);
		const daysInMonth = this.getDaysInMonth(this.viewYear, this.viewMonth);

		// Get the weekday of the first day (0 = Sunday)
		const firstDayWeekday = firstDayOfMonth.getDay();

		// Get the previous month's info for padding
		const prevMonthYear = this.viewMonth === 1 ? this.viewYear - 1 : this.viewYear;
		const prevMonth = this.viewMonth === 1 ? 12 : this.viewMonth - 1;
		const daysInPrevMonth = this.getDaysInMonth(prevMonthYear, prevMonth);

		// Calculate padding days
		const paddingDays = firstDayWeekday;

		// Render padding days from previous month
		for (let i = paddingDays - 1; i >= 0; i--) {
			const dayNum = daysInPrevMonth - i;
			const dayCell = container.createEl("button", {
				cls: "calendar-day calendar-day-padding",
				text: dayNum.toString()
			});
			dayCell.addEventListener("click", () => {
				this.selectDateFromDay(prevMonthYear, prevMonth, dayNum);
			});
		}

		// Render days of current month
		for (let day = 1; day <= daysInMonth; day++) {
			const dayCell = container.createEl("button", {
				cls: "calendar-day",
				text: day.toString()
			});

			// Check if this day is the selected date
			if (this.isSameDay(this.viewYear, this.viewMonth, day, this.selectedDate)) {
				dayCell.addClass("calendar-day-selected");
			}

			// Check if this day is today
			if (this.isSameDay(this.viewYear, this.viewMonth, day, new Date())) {
				dayCell.addClass("calendar-day-today");
			}

			dayCell.addEventListener("click", () => {
				this.selectDateFromDay(this.viewYear, this.viewMonth, day);
			});
		}

		// Calculate remaining cells to complete the grid (6 rows x 7 cols = 42)
		const totalCells = paddingDays + daysInMonth;
		const remainingCells = 42 - totalCells;

		// Render padding days from next month
		const nextMonthYear = this.viewMonth === 12 ? this.viewYear + 1 : this.viewYear;
		const nextMonth = this.viewMonth === 12 ? 1 : this.viewMonth + 1;

		for (let i = 1; i <= remainingCells; i++) {
			const dayCell = container.createEl("button", {
				cls: "calendar-day calendar-day-padding",
				text: i.toString()
			});
			dayCell.addEventListener("click", () => {
				this.selectDateFromDay(nextMonthYear, nextMonth, i);
			});
		}
	}

	private renderFooter(container: HTMLElement): void {
		const todayButton = container.createEl("button", {
			cls: "calendar-today-button",
			text: "Today"
		});
		todayButton.addEventListener("click", () => {
			const today = new Date();
			this.selectedDate = new Date(today);
			this.viewYear = this.getViewYear(today);
			this.viewMonth = this.calendarAdapter.getMonthOfDate(today);
			this.refreshCalendar();
		});
	}

	private navigateMonth(delta: number): void {
		this.viewMonth += delta;
		if (this.viewMonth > 12) {
			this.viewMonth = 1;
			this.viewYear++;
		} else if (this.viewMonth < 1) {
			this.viewMonth = 12;
			this.viewYear--;
		}
		this.refreshCalendar();
	}

	private refreshCalendar(): void {
		const { contentEl } = this;
		const header = contentEl.querySelector(".calendar-header") as HTMLElement;
		const grid = contentEl.querySelector(".calendar-grid") as HTMLElement;
		
		if (header) {
			header.empty();
			this.renderHeader(header);
		}
		if (grid) {
			this.renderCalendarGrid(grid);
		}
	}

	private selectDateFromDay(year: number, month: number, day: number): void {
		// Convert calendar-specific date to Gregorian Date
		const gregorianDate = this.toGregorianDate(year, month, day);
		this.selectedDate = gregorianDate;
		this.onDateSelect(gregorianDate);
		this.close();
	}

	private getMonthYearLabel(): string {
		return `${this.calendarAdapter.getMonthName(this.viewMonth)} ${this.viewYear}`;
	}

	private getFirstDayOfMonth(year: number, month: number): Date {
		// For Gregorian: month is 1-12, Date uses 0-11
		if (this.calendarAdapter.system === ReportCalendar.GREGORIAN) {
			return new Date(year, month - 1, 1);
		}
		// For Jalali: convert to Gregorian first
		return this.toGregorianDate(year, month, 1);
	}

	private getDaysInMonth(year: number, month: number): number {
		if (this.calendarAdapter.system === ReportCalendar.GREGORIAN) {
			return new Date(year, month, 0).getDate();
		}
		// For Jalali, use jalaali-js
		return jalaaliMonthLength(year, month);
	}

	private toGregorianDate(year: number, month: number, day: number): Date {
		if (this.calendarAdapter.system === ReportCalendar.GREGORIAN) {
			return new Date(year, month - 1, day);
		}
		// For Jalali: convert to Gregorian
		const g = toGregorian(year, month, day);
		return new Date(g.gy, g.gm - 1, g.gd);
	}

	private isSameDay(year: number, month: number, day: number, date: Date): boolean {
		const adapter = this.calendarAdapter;
		const adapterYear = adapter.system === ReportCalendar.GREGORIAN 
			? date.getFullYear() 
			: this.toJalaaliYear(date);
		const adapterMonth = adapter.getMonthOfDate(date);
		const adapterDay = adapter.getDayOfMonth(date);
		
		return adapterYear === year && adapterMonth === month && adapterDay === day;
	}

	private toJalaaliYear(date: Date): number {
		return toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate()).jy;
	}

	private getViewYear(date: Date): number {
		if (this.calendarAdapter.system === ReportCalendar.GREGORIAN) {
			return date.getFullYear();
		}
		return this.toJalaaliYear(date);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
