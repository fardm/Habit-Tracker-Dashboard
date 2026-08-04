import { App, Modal, setIcon } from "obsidian";
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
	private monthYearDropdown?: HTMLElement;
	private yearSelectStart: number;

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
		this.yearSelectStart = this.viewYear - 6;
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

		// Close dropdown when clicking outside
		document.addEventListener("click", (e) => this.handleDocumentClick(e));
	}

	private renderHeader(container: HTMLElement): void {
		const navContainer = container.createDiv({ cls: "calendar-nav" });

		// Previous month button
		const prevButton = navContainer.createEl("button", {
			cls: "calendar-nav-button clickable-icon"
		});
		setIcon(prevButton, "chevron-left");
		prevButton.addEventListener("click", () => {
			this.navigateMonth(-1);
		});

		// Month/year label (clickable)
		const label = navContainer.createEl("button", {
			cls: "calendar-nav-label clickable-icon",
			text: this.getMonthYearLabel()
		});
		label.addEventListener("click", (e) => {
			e.stopPropagation();
			this.toggleMonthYearDropdown(label);
		});

		// Next month button
		const nextButton = navContainer.createEl("button", {
			cls: "calendar-nav-button clickable-icon"
		});
		setIcon(nextButton, "chevron-right");
		nextButton.addEventListener("click", () => {
			this.navigateMonth(1);
		});
	}

	private renderWeekdays(container: HTMLElement): void {
		// Jalali calendar weeks start on Saturday, Gregorian on Sunday
		const weekdayNames = this.calendarAdapter.system === ReportCalendar.JALALI
			? ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
			: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

		// Get the weekday of the first day (0 = Sunday in Gregorian)
		const firstDayWeekday = firstDayOfMonth.getDay();

		// Calculate padding days based on calendar system
		// Gregorian: week starts on Sunday (0), Jalali: week starts on Saturday
		let paddingDays: number;
		if (this.calendarAdapter.system === ReportCalendar.JALALI) {
			// Convert Gregorian weekday to Jalali weekday (Saturday = 0)
			paddingDays = (firstDayWeekday + 1) % 7;
		} else {
			// Gregorian: Sunday = 0
			paddingDays = firstDayWeekday;
		}

		// Get the previous month's info for padding
		const prevMonthYear = this.viewMonth === 1 ? this.viewYear - 1 : this.viewYear;
		const prevMonth = this.viewMonth === 1 ? 12 : this.viewMonth - 1;
		const daysInPrevMonth = this.getDaysInMonth(prevMonthYear, prevMonth);

		// Render padding days from previous month
		for (let i = paddingDays - 1; i >= 0; i--) {
			const dayNum = daysInPrevMonth - i;
			const dayCell = container.createEl("button", {
				cls: "calendar-day calendar-day-padding clickable-icon",
				text: dayNum.toString()
			});
			dayCell.addEventListener("click", () => {
				this.selectDateFromDay(prevMonthYear, prevMonth, dayNum);
			});
		}

		// Render days of current month
		for (let day = 1; day <= daysInMonth; day++) {
			const dayCell = container.createEl("button", {
				cls: "calendar-day clickable-icon",
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
				cls: "calendar-day calendar-day-padding clickable-icon",
				text: i.toString()
			});
			dayCell.addEventListener("click", () => {
				this.selectDateFromDay(nextMonthYear, nextMonth, i);
			});
		}
	}

	private renderFooter(container: HTMLElement): void {
		const todayButton = container.createEl("button", {
			cls: "calendar-today-button clickable-icon",
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
		// Close dropdown if open
		this.closeMonthYearDropdown();
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

	private toggleMonthYearDropdown(triggerElement: HTMLElement): void {
		if (this.monthYearDropdown) {
			this.closeMonthYearDropdown();
			return;
		}

		const dropdown = document.createElement("div");
		dropdown.addClass("calendar-month-year-dropdown");

		// Year selector section
		const yearSection = dropdown.createDiv({ cls: "calendar-dropdown-section" });
		yearSection.createEl("div", {
			cls: "calendar-dropdown-section-label",
			text: "Year"
		});

		const yearNav = yearSection.createDiv({ cls: "calendar-dropdown-year-nav" });

		const yearPrevBtn = yearNav.createEl("button", {
			cls: "calendar-dropdown-nav-button clickable-icon"
		});
		setIcon(yearPrevBtn, "chevron-left");
		yearPrevBtn.addEventListener("click", () => {
			this.yearSelectStart -= 12;
			this.renderYearGrid(yearGrid);
		});

		const yearGrid = yearSection.createDiv({ cls: "calendar-dropdown-year-grid" });
		this.renderYearGrid(yearGrid);

		const yearNextBtn = yearNav.createEl("button", {
			cls: "calendar-dropdown-nav-button clickable-icon"
		});
		setIcon(yearNextBtn, "chevron-right");
		yearNextBtn.addEventListener("click", () => {
			this.yearSelectStart += 12;
			this.renderYearGrid(yearGrid);
		});

		// Month selector section
		const monthSection = dropdown.createDiv({ cls: "calendar-dropdown-section" });
		monthSection.createEl("div", {
			cls: "calendar-dropdown-section-label",
			text: "Month"
		});

		const monthGrid = monthSection.createDiv({ cls: "calendar-dropdown-month-grid" });
		for (let m = 1; m <= 12; m++) {
			const monthBtn = monthGrid.createEl("button", {
				cls: "calendar-dropdown-month-button clickable-icon",
				text: this.calendarAdapter.getMonthName(m)
			});
			if (m === this.viewMonth) {
				monthBtn.addClass("calendar-dropdown-month-selected");
			}
			monthBtn.addEventListener("click", () => {
				this.viewMonth = m;
				this.refreshCalendar();
			});
		}

		// Position dropdown
		const rect = triggerElement.getBoundingClientRect();
		dropdown.style.position = "fixed";
		dropdown.style.top = `${rect.bottom + 4}px`;
		dropdown.style.left = `${rect.left}px`;
		dropdown.style.zIndex = "10000";

		document.body.appendChild(dropdown);
		this.monthYearDropdown = dropdown;

		// Prevent dropdown from closing when clicking inside
		dropdown.addEventListener("click", (e) => e.stopPropagation());
	}

	private renderYearGrid(container: HTMLElement): void {
		container.empty();
		for (let i = 0; i < 12; i++) {
			const year = this.yearSelectStart + i;
			const yearBtn = container.createEl("button", {
				cls: "calendar-dropdown-year-button clickable-icon",
				text: year.toString()
			});
			if (year === this.viewYear) {
				yearBtn.addClass("calendar-dropdown-year-selected");
			}
			yearBtn.addEventListener("click", () => {
				this.viewYear = year;
				this.refreshCalendar();
			});
		}
	}

	private closeMonthYearDropdown(): void {
		if (this.monthYearDropdown) {
			this.monthYearDropdown.remove();
			this.monthYearDropdown = undefined;
		}
	}

	private handleDocumentClick(e: MouseEvent): void {
		if (this.monthYearDropdown) {
			const target = e.target as HTMLElement;
			if (!target.closest(".calendar-month-year-dropdown") &&
				!target.closest(".calendar-nav-label")) {
				this.closeMonthYearDropdown();
			}
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.closeMonthYearDropdown();
		document.removeEventListener("click", (e) => this.handleDocumentClick(e));
	}
}
