import { setIcon } from "obsidian";

/**
 * Component for single-day date navigation
 */
export class DateNavigator {
	private currentDate: Date;
	private onDateChange: (date: Date) => void;
	private container?: HTMLElement;

	constructor(initialDate: Date, onDateChange: (date: Date) => void) {
		this.currentDate = initialDate;
		this.onDateChange = onDateChange;
	}

	render(): HTMLElement {
		const navigator = createDiv({ cls: "date-navigator" });

		// Left arrow button
		const leftButton = createEl("button", {
			cls: "date-navigator-button"
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
			cls: "date-navigator-button"
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
		// Create a hidden date input positioned directly below the button
		const dateInput = createEl("input", {
			cls: "date-picker-hidden-input",
			type: "date"
		});
		
		const rect = button.getBoundingClientRect();
		dateInput.style.setProperty("--date-picker-left", `${rect.left}px`);
		dateInput.style.setProperty("--date-picker-top", `${rect.bottom}px`);
		
		// Format date for input (YYYY-MM-DD)
		const year = this.currentDate.getFullYear();
		const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
		const day = String(this.currentDate.getDate()).padStart(2, '0');
		dateInput.value = `${year}-${month}-${day}`;
		
		document.body.appendChild(dateInput);
		
		// Focus and show picker immediately
		dateInput.focus();
		dateInput.showPicker();
		
		dateInput.addEventListener("change", (e) => {
			const target = e.target as HTMLInputElement;
			if (target.value) {
				const selectedDate = new Date(target.value);
				this.setDate(selectedDate);
			}
			document.body.removeChild(dateInput);
		});
		
		dateInput.addEventListener("blur", () => {
			// Remove input when focus is lost (after a small delay to allow selection)
			setTimeout(() => {
				if (document.body.contains(dateInput)) {
					document.body.removeChild(dateInput);
				}
			}, 200);
		});
		
		dateInput.addEventListener("cancel", () => {
			document.body.removeChild(dateInput);
		});
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

	}