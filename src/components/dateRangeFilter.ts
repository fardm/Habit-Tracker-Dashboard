import { HTMLElementComponent } from "./htmlElementComponent";
import { DateRangeFilter as DateRangeFilterEnum } from "../types/habitTypes";
import { formatDateRange } from "../utils/dateUtils";

export interface DateRangeFilterProps {
	currentFilter: DateRangeFilterEnum;
	onFilterChange: (filter: DateRangeFilterEnum) => void;
}

/**
 * Component for date range filter dropdown
 */
export class DateRangeFilter extends HTMLElementComponent {
	private props: DateRangeFilterProps;

	constructor(props: DateRangeFilterProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const container = createDiv({ cls: "date-range-filter" });
		container.style.cssText = `
			display: inline-block;
			margin-right: 12px;
		`;

		const label = createEl("label", {
			text: "Date Range:"
		});
		label.style.cssText = `
			font-size: 12px;
			color: var(--text-muted);
			margin-right: 8px;
		`;

		const select = createEl("select", {
			cls: "date-range-select"
		});
		select.style.cssText = `
			padding: 6px 12px;
			border-radius: 4px;
			border: 1px solid var(--background-modifier-border);
			background-color: var(--background-secondary);
			color: var(--text-normal);
			font-size: 13px;
			cursor: pointer;
		`;

		const options = [
			{ value: DateRangeFilterEnum.YESTERDAY, label: "Yesterday" },
			{ value: DateRangeFilterEnum.TODAY, label: "Today" },
			{ value: DateRangeFilterEnum.THIS_WEEK, label: "This Week" },
			{ value: DateRangeFilterEnum.THIS_MONTH, label: "This Month" },
			{ value: DateRangeFilterEnum.LAST_30_DAYS, label: "Last 30 Days" },
			{ value: DateRangeFilterEnum.LAST_90_DAYS, label: "Last 90 Days" },
			{ value: DateRangeFilterEnum.THIS_YEAR, label: "This Year" },
			{ value: DateRangeFilterEnum.CUSTOM, label: "Custom Range" }
		];

		options.forEach(option => {
			const optionElement = createEl("option", {
				value: option.value,
				text: option.label
			});
			if (option.value === this.props.currentFilter) {
				optionElement.selected = true;
			}
			select.appendChild(optionElement);
		});

		select.addEventListener("change", (e) => {
			const target = e.target as HTMLSelectElement;
			this.props.onFilterChange(target.value as DateRangeFilterEnum);
		});

		container.appendChild(label);
		container.appendChild(select);

		return container;
	}
}