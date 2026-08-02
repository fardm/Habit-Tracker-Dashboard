import { HTMLElementComponent } from "../htmlElementComponent";
import { CalendarHeatmapProps } from "../../types/habitDetailsTypes";
import {
	CalendarDateAdapter,
	getCalendarAdapter,
	parseLocalISODate,
	toLocalISODate,
	YearHeatmapLayout
} from "../../utils/calendarAdapter";
import { ReportCalendar, WeekStartDay } from "../../types/habitTypes";

/**
 * CalendarHeatmap — GitHub-style yearly activity grid.
 * Columns = weeks, rows = days of week (order depends on weekStartDay).
 * Year bounds come from the calendar adapter (Jan–Dec or Farvardin–Esfand).
 */
export class CalendarHeatmap extends HTMLElementComponent {
	private props: CalendarHeatmapProps;

	constructor(props: CalendarHeatmapProps) {
		super();
		this.props = props;
	}

	private getThemeColor(): string {
		return this.props.theme?.primary || "var(--interactive-accent)";
	}

	private getWeekStartDay(): WeekStartDay {
		return this.props.weekStartDay ?? WeekStartDay.SUNDAY;
	}

	private adjustColorOpacity(color: string, opacity: number): string {
		if (color.startsWith("#")) {
			const r = parseInt(color.slice(1, 3), 16);
			const g = parseInt(color.slice(3, 5), 16);
			const b = parseInt(color.slice(5, 7), 16);
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}
		return color;
	}

	render(): HTMLElement {
		const container = document.createElement("div");
		container.className = "calendar-heatmap";
		container.style.cssText = `
			background-color: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 20px;
			margin-bottom: 20px;
		`;

		const adapter = getCalendarAdapter(
			this.props.reportCalendar || ReportCalendar.GREGORIAN
		);
		const year = this.props.year ?? adapter.getCurrentYear();
		const weekStartDay = this.getWeekStartDay();
		const layout = adapter.buildYearHeatmapLayout(year, weekStartDay);

		const title = document.createElement("h3");
		title.textContent = `Activity Heatmap — ${adapter.getPeriodLabel(year)}`;
		title.style.cssText = `
			margin: 0 0 16px 0;
			font-size: 16px;
			font-weight: 600;
			color: var(--text-normal);
		`;
		container.appendChild(title);

		const heatmapContainer = document.createElement("div");
		heatmapContainer.className = "heatmap-container";
		heatmapContainer.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 4px;
			align-items: center;
		`;

		const gridBlock = document.createElement("div");
		gridBlock.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 2px;
			width: fit-content;
			max-width: 100%;
			overflow-x: auto;
		`;

		if (this.props.showMonthLabels) {
			gridBlock.appendChild(
				this.createMonthLabelsRow(layout.monthLabels, layout.weeksCount)
			);
		}

		gridBlock.appendChild(this.createHeatmapGrid(adapter, layout));
		heatmapContainer.appendChild(gridBlock);
		heatmapContainer.appendChild(this.createLegend());
		container.appendChild(heatmapContainer);

		return container;
	}

	private createMonthLabelsRow(
		monthLabels: { weekIndex: number; label: string }[],
		weeksCount: number
	): HTMLElement {
		const cellSize = 10;
		const gap = 2;
		const row = document.createElement("div");
		row.className = "heatmap-month-labels";
		row.style.cssText = `
			position: relative;
			height: 14px;
			width: ${weeksCount * cellSize + Math.max(0, weeksCount - 1) * gap}px;
			margin-bottom: 2px;
			font-size: 10px;
			color: var(--text-muted);
			line-height: 14px;
		`;

		for (const label of monthLabels) {
			const el = document.createElement("span");
			el.textContent = label.label;
			el.style.cssText = `
				position: absolute;
				left: ${label.weekIndex * (cellSize + gap)}px;
				top: 0;
				white-space: nowrap;
				pointer-events: none;
			`;
			row.appendChild(el);
		}

		return row;
	}

	private buildValueMap(): Map<string, number> {
		const valueMap = new Map<string, number>();
		const maxNumeric = Math.max(
			...this.props.values.map((v) =>
				typeof v.value === "number" ? v.value : 0
			),
			1
		);

		this.props.values.forEach((entry) => {
			const dateKey = toLocalISODate(entry.date);
			if (this.props.habitType === "boolean") {
				valueMap.set(dateKey, entry.value === true ? 1 : 0);
			} else {
				const numValue = entry.value as number;
				if (this.props.target !== undefined && this.props.target > 0) {
					valueMap.set(dateKey, Math.min(numValue / this.props.target, 1));
				} else {
					valueMap.set(dateKey, numValue / maxNumeric);
				}
			}
		});

		return valueMap;
	}

	private intensityColor(value: number, themeColor: string): string {
		if (value <= 0) {
			return "var(--background-modifier-border)";
		}
		if (value <= 0.25) {
			return this.adjustColorOpacity(themeColor, 0.3);
		}
		if (value <= 0.5) {
			return this.adjustColorOpacity(themeColor, 0.5);
		}
		if (value <= 0.75) {
			return this.adjustColorOpacity(themeColor, 0.7);
		}
		return themeColor;
	}

	private formatTooltip(
		isoDate: string,
		value: number,
		adapter: CalendarDateAdapter
	): string {
		const displayDate = adapter.formatDisplayDate(parseLocalISODate(isoDate));
		if (this.props.habitType === "boolean") {
			return `${displayDate}: ${value > 0 ? "Completed" : "Not completed"}`;
		}
		const raw = this.props.values.find(
			(v) => toLocalISODate(v.date) === isoDate
		)?.value;
		return `${displayDate}: ${raw ?? 0}`;
	}

	private createHeatmapGrid(
		adapter: CalendarDateAdapter,
		layout: YearHeatmapLayout
	): HTMLElement {
		const { cells, weeksCount } = layout;
		const valueMap = this.buildValueMap();
		const themeColor = this.getThemeColor();

		const grid = document.createElement("div");
		grid.style.cssText = `
			display: grid;
			grid-template-rows: repeat(7, 10px);
			grid-auto-flow: column;
			grid-auto-columns: 10px;
			gap: 2px;
			width: fit-content;
		`;
		grid.setAttribute("data-weeks", String(weeksCount));
		grid.setAttribute("data-week-start", String(this.getWeekStartDay()));

		for (const cellData of cells) {
			const cell = document.createElement("div");

			if (cellData.isEmpty || !cellData.isoDate) {
				cell.style.cssText = `
					width: 10px;
					height: 10px;
					border-radius: 2px;
					background-color: transparent;
				`;
				grid.appendChild(cell);
				continue;
			}

			const value = valueMap.get(cellData.isoDate) || 0;
			cell.style.cssText = `
				width: 10px;
				height: 10px;
				border-radius: 2px;
				background-color: ${this.intensityColor(value, themeColor)};
				transition: background-color 0.2s;
			`;
			cell.title = this.formatTooltip(cellData.isoDate, value, adapter);
			grid.appendChild(cell);
		}

		return grid;
	}

	private createLegend(): HTMLElement {
		const legend = document.createElement("div");
		legend.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 8px;
			margin-top: 8px;
			font-size: 11px;
			color: var(--text-muted);
			width: 100%;
			flex-wrap: wrap;
		`;

		if (this.props.habitType === "boolean") {
			const legendItems = [
				{ label: "Done", color: this.getThemeColor(), filled: true },
				{ label: "Not done", color: "transparent", filled: false }
			];

			legendItems.forEach((item) => {
				const legendItem = document.createElement("div");
				legendItem.style.cssText = `
					display: flex;
					align-items: center;
					gap: 4px;
				`;

				const square = document.createElement("div");
				square.style.cssText = `
					width: 10px;
					height: 10px;
					border-radius: 2px;
					background-color: ${item.color};
					border: 1px solid var(--background-modifier-border);
					box-sizing: border-box;
				`;

				const label = document.createElement("span");
				label.textContent = item.label;
				legendItem.appendChild(square);
				legendItem.appendChild(label);
				legend.appendChild(legendItem);
			});

			return legend;
		}

		const themeColor = this.getThemeColor();
		const legendColors = [
			{ color: "var(--background-modifier-border)", label: "0" },
			{ color: this.adjustColorOpacity(themeColor, 0.3), label: "1-25%" },
			{ color: this.adjustColorOpacity(themeColor, 0.5), label: "26-50%" },
			{ color: this.adjustColorOpacity(themeColor, 0.7), label: "51-75%" },
			{ color: themeColor, label: "76-100%" }
		];

		const legendLabel = document.createElement("span");
		legendLabel.textContent = "Less";
		legend.appendChild(legendLabel);

		legendColors.forEach((item) => {
			const legendItem = document.createElement("div");
			legendItem.style.cssText = `
				width: 10px;
				height: 10px;
				border-radius: 2px;
				background-color: ${item.color};
			`;
			legendItem.title = item.label;
			legend.appendChild(legendItem);
		});

		const moreLabel = document.createElement("span");
		moreLabel.textContent = "More";
		legend.appendChild(moreLabel);

		return legend;
	}
}
