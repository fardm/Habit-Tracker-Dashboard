import { HTMLElementComponent } from "../htmlElementComponent";
import { ReportPeriod, PeriodSelectorProps } from "../../types/habitDetailsTypes";

/**
 * PeriodSelector component for selecting report periods (Year/Month/Week) in habit details view
 */
export class PeriodSelector extends HTMLElementComponent {
	private props: PeriodSelectorProps;
	private selectElement?: HTMLSelectElement;

	constructor(props: PeriodSelectorProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const container = createDiv({ cls: "period-selector" });
		// Container styling is handled by CSS

		this.selectElement = createEl("select", {
			cls: "period-selector-select"
		});

		const periods: { value: ReportPeriod; label: string }[] = [
			{ value: ReportPeriod.YEAR, label: "Year" },
			{ value: ReportPeriod.MONTH, label: "Month" },
			{ value: ReportPeriod.WEEK, label: "Week" }
		];

		periods.forEach(period => {
			if (this.selectElement) {
				const option = this.selectElement.createEl("option", {
					value: period.value,
					text: period.label
				});

				if (this.props.currentPeriod === period.value) {
					option.selected = true;
				}
			}
		});

		this.selectElement.addEventListener("change", (e) => {
			const target = e.target as HTMLSelectElement;
			if (target) {
				const selectedValue = target.value as ReportPeriod;
				this.props.onPeriodChange(selectedValue);
			}
		});

		if (this.selectElement) {
			container.appendChild(this.selectElement);
		}

		return container;
	}

	updateCurrentPeriod(period: ReportPeriod): void {
		if (this.selectElement) {
			this.selectElement.value = period;
		}
	}
}
