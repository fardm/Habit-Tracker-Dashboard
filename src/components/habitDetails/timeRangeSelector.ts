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
		const container = createDiv({ cls: "time-range-selector" });
		// Container styling is handled by CSS

		const label = createSpan({
			cls: "time-range-label",
			text: "Time Range:"
		});
		container.appendChild(label);

		const ranges: { value: TimeRange; label: string }[] = [
			{ value: TimeRange.LAST_7_DAYS, label: "7 Days" },
			{ value: TimeRange.LAST_30_DAYS, label: "30 Days" },
			{ value: TimeRange.LAST_90_DAYS, label: "90 Days" },
			{ value: TimeRange.LAST_YEAR, label: "Year" },
			{ value: TimeRange.ALL_TIME, label: "All Time" }
		];

		ranges.forEach(range => {
			const button = createEl("button", {
				cls: this.props.currentRange === range.value ? "time-range-button time-range-button-active" : "time-range-button",
				text: range.label
			});

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
				button.className = "time-range-button time-range-button-active";
			} else {
				button.className = "time-range-button";
			}
		});
	}
}
