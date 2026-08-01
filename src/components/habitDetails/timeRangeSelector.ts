import { HTMLElementComponent } from "../htmlElementComponent";
import { TimeRange, TimeRangeSelectorProps } from "../../types/habitDetailsTypes";

/**
 * TimeRangeSelector component for selecting date ranges in habit details view
 */
export class TimeRangeSelector extends HTMLElementComponent {
	private props: TimeRangeSelectorProps;
	private buttons: Map<TimeRange, HTMLElement> = new Map();

	constructor(props: TimeRangeSelectorProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const container = document.createElement("div");
		container.className = "time-range-selector";
		container.style.cssText = `
			display: flex;
			align-items: center;
			gap: 8px;
			flex-wrap: wrap;
		`;

		const label = document.createElement("span");
		label.textContent = "Time Range:";
		label.style.cssText = `
			font-size: 14px;
			color: var(--text-muted);
			font-weight: 500;
		`;
		container.appendChild(label);

		const ranges: { value: TimeRange; label: string }[] = [
			{ value: TimeRange.LAST_7_DAYS, label: "7 Days" },
			{ value: TimeRange.LAST_30_DAYS, label: "30 Days" },
			{ value: TimeRange.LAST_90_DAYS, label: "90 Days" },
			{ value: TimeRange.LAST_YEAR, label: "Year" },
			{ value: TimeRange.ALL_TIME, label: "All Time" }
		];

		ranges.forEach(range => {
			const button = document.createElement("button");
			button.textContent = range.label;
			button.style.cssText = `
				padding: 6px 12px;
				border: 1px solid var(--background-modifier-border);
				background-color: var(--background-secondary);
				color: var(--text-normal);
				border-radius: 6px;
				cursor: pointer;
				font-size: 13px;
				transition: all 0.2s;
			`;

			if (this.props.currentRange === range.value) {
				button.style.cssText = `
					padding: 6px 12px;
					border: 1px solid var(--interactive-accent);
					background-color: var(--interactive-accent);
					color: var(--text-on-accent);
					border-radius: 6px;
					cursor: pointer;
					font-size: 13px;
					transition: all 0.2s;
				`;
			}

			button.addEventListener("click", () => {
				this.props.onRangeChange(range.value);
				this.updateButtonStates();
			});

			this.buttons.set(range.value, button);
			container.appendChild(button);
		});

		return container;
	}

	private updateButtonStates(): void {
		this.buttons.forEach((button, range) => {
			if (this.props.currentRange === range) {
				button.style.cssText = `
					padding: 6px 12px;
					border: 1px solid var(--interactive-accent);
					background-color: var(--interactive-accent);
					color: var(--text-on-accent);
					border-radius: 6px;
					cursor: pointer;
					font-size: 13px;
					transition: all 0.2s;
				`;
			} else {
				button.style.cssText = `
					padding: 6px 12px;
					border: 1px solid var(--background-modifier-border);
					background-color: var(--background-secondary);
					color: var(--text-normal);
					border-radius: 6px;
					cursor: pointer;
					font-size: 13px;
					transition: all 0.2s;
				`;
			}
		});
	}
}
