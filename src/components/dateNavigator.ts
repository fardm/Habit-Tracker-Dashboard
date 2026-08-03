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
		const navigator = document.createElement("div");
		navigator.className = "date-navigator";

		// Left arrow button
		const leftButton = document.createElement("button");
		leftButton.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		`;
		leftButton.className = "date-navigator-button";
		// Hover states are handled by CSS
		leftButton.addEventListener("click", () => {
			this.previousDay();
		});

		// Date display
		const dateDisplay = document.createElement("button");
		dateDisplay.textContent = this.formatDate(this.currentDate);
		dateDisplay.className = "date-navigator-display";
		// Hover states are handled by CSS
		dateDisplay.addEventListener("click", (e) => {
			this.openDatePicker(e, dateDisplay);
		});

		// Right arrow button
		const rightButton = document.createElement("button");
		rightButton.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		`;
		rightButton.className = "date-navigator-button";
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
		const dateInput = document.createElement("input");
		dateInput.type = "date";
		dateInput.className = "date-picker-hidden-input";
		
		const rect = button.getBoundingClientRect();
		dateInput.style.setProperty("--date-picker-left", `${rect.left}px`);
		dateInput.style.setProperty("--date-picker-top", `${rect.bottom}px`);
		dateInput.style.left = "var(--date-picker-left)";
		dateInput.style.top = "var(--date-picker-top)";
		
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