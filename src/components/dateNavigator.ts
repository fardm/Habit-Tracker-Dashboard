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
		navigator.style.cssText = `
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 0;
		`;

		// Left arrow button
		const leftButton = document.createElement("button");
		leftButton.innerHTML = "<";
		leftButton.style.cssText = `
			background: none;
			border: none;
			color: var(--text-muted);
			font-size: 16px;
			cursor: pointer;
			padding: 4px 6px;
			transition: color 0.2s;
			line-height: 1;
		`;
		leftButton.addEventListener("mouseenter", () => {
			leftButton.style.color = "var(--text-normal)";
		});
		leftButton.addEventListener("mouseleave", () => {
			leftButton.style.color = "var(--text-muted)";
		});
		leftButton.addEventListener("click", () => {
			this.previousDay();
		});

		// Date display
		const dateDisplay = document.createElement("button");
		dateDisplay.textContent = this.formatDate(this.currentDate);
		dateDisplay.style.cssText = `
			background: none;
			border: none;
			color: var(--text-normal);
			font-size: 13px;
			font-weight: 500;
			cursor: pointer;
			padding: 4px 8px;
			transition: color 0.2s;
			min-width: 80px;
			text-align: center;
			line-height: 1;
		`;
		dateDisplay.addEventListener("mouseenter", () => {
			dateDisplay.style.color = "var(--interactive-accent)";
		});
		dateDisplay.addEventListener("mouseleave", () => {
			dateDisplay.style.color = "var(--text-normal)";
		});
		dateDisplay.addEventListener("click", (e) => {
			this.openDatePicker(e, dateDisplay);
		});

		// Right arrow button
		const rightButton = document.createElement("button");
		rightButton.innerHTML = ">";
		rightButton.style.cssText = `
			background: none;
			border: none;
			color: var(--text-muted);
			font-size: 16px;
			cursor: pointer;
			padding: 4px 6px;
			transition: color 0.2s;
			line-height: 1;
		`;
		rightButton.addEventListener("mouseenter", () => {
			rightButton.style.color = "var(--text-normal)";
		});
		rightButton.addEventListener("mouseleave", () => {
			rightButton.style.color = "var(--text-muted)";
		});
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
		// Create a visible date input positioned below the button
		const dateInput = document.createElement("input");
		dateInput.type = "date";
		dateInput.style.cssText = `
			position: absolute;
			opacity: 0.01;
			pointer-events: auto;
			width: 200px;
			height: 32px;
			z-index: 1000;
		`;
		
		// Position the input directly below the button
		const rect = button.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
		
		dateInput.style.left = `${rect.left + scrollLeft}px`;
		dateInput.style.top = `${rect.bottom + scrollTop + 2}px`;
		
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