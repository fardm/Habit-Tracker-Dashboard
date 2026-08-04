import { setIcon, App } from "obsidian";
import { CalendarModal } from "./calendarModal";
import { ReportCalendar } from "../types/habitTypes";
import { getCalendarAdapter } from "../utils/calendarAdapter";

/**
 * Component for single-day date navigation
 */
export class DateNavigator {
	private currentDate: Date;
	private onDateChange: (date: Date) => void;
	private container?: HTMLElement;
	private calendarSystem: ReportCalendar;
	private app: App;

	constructor(
		app: App,
		initialDate: Date,
		onDateChange: (date: Date) => void,
		calendarSystem: ReportCalendar = ReportCalendar.GREGORIAN
	) {
		this.app = app;
		this.currentDate = initialDate;
		this.onDateChange = onDateChange;
		this.calendarSystem = calendarSystem;
	}

	render(): HTMLElement {
		const navigator = createDiv({ cls: "date-navigator" });

		// Left arrow button
		const leftButton = createEl("button", {
			cls: "date-navigator-button clickable-icon"
		});
		setIcon(leftButton, "chevron-left");
		// Hover states are handled by CSS
		leftButton.addEventListener("click", () => {
			this.previousDay();
		});

		// Date display
		const dateDisplay = createEl("button", {
			cls: "date-navigator-display",
			text: this.formatDate(this.currentDate)
		});
		// Hover states are handled by CSS
		dateDisplay.addEventListener("click", (e) => {
			this.openDatePicker(e, dateDisplay);
		});

		// Right arrow button
		const rightButton = createEl("button", {
			cls: "date-navigator-button clickable-icon"
		});
		setIcon(rightButton, "chevron-right");
		// Hover states are handled by CSS
		rightButton.addEventListener("click", () => {
			this.nextDay();
		});

		navigator.appendChild(leftButton);
		navigator.appendChild(dateDisplay);
		navigator.appendChild(rightButton);

		this.container = navigator;
		return navigator;
	}

	private formatDate(date: Date): string {
		const today = new Date();
		const isToday = 
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear();

		if (isToday) {
			return "Today";
		}

		// Use calendar adapter for Jalali format, otherwise use Gregorian
		if (this.calendarSystem === ReportCalendar.JALALI) {
			const adapter = getCalendarAdapter(this.calendarSystem);
			return adapter.formatDisplayDate(date);
		}

		const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		return date.toLocaleDateString('en-US', options);
	}

	private previousDay(): void {
		const newDate = new Date(this.currentDate);
		newDate.setDate(newDate.getDate() - 1);
		this.setDate(newDate);
	}

	private nextDay(): void {
		const newDate = new Date(this.currentDate);
		newDate.setDate(newDate.getDate() + 1);
		this.setDate(newDate);
	}

	private setDate(date: Date): void {
		this.currentDate = date;
		this.onDateChange(date);
		
		// Update the date display
		if (this.container) {
			const dateDisplay = this.container.querySelector('button:nth-child(2)') as HTMLElement;
			if (dateDisplay) {
				dateDisplay.textContent = this.formatDate(date);
			}
		}
	}

	private openDatePicker(event: MouseEvent, button: HTMLElement): void {
		new CalendarModal(
			this.app,
			this.currentDate,
			(date) => {
				this.setDate(date);
			},
			this.calendarSystem
		).open();
	}

	/**
	 * Gets the current selected date
	 */
	getCurrentDate(): Date {
		return this.currentDate;
	}

	/**
	 * Sets the current date programmatically
	 */
	setCurrentDate(date: Date): void {
		this.setDate(date);
	}

	/**
	 * Updates the calendar system (Gregorian/Jalali)
	 */
	setCalendarSystem(calendarSystem: ReportCalendar): void {
		this.calendarSystem = calendarSystem;
	}

	}