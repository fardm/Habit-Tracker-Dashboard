import { HTMLElementComponent } from "../htmlElementComponent";
import { ChartType, ChartSectionProps, HabitValueEntry } from "../../types/habitDetailsTypes";
import { ReportCalendar } from "../../types/habitTypes";
import { getCalendarAdapter } from "../../utils/calendarAdapter";

/**
 * ChartSection component for displaying progress charts with toggle between line and bar
 */
export class ChartSection extends HTMLElementComponent {
	private props: ChartSectionProps;
	private chartContainer?: HTMLElement;
	private toggleButtons?: { line: HTMLElement; bar: HTMLElement };
	private resizeObserver?: ResizeObserver;

	constructor(props: ChartSectionProps) {
		super();
		this.props = props;
	}

	private getThemeColor(): string {
		return this.props.theme?.primary || "var(--interactive-accent)";
	}

	render(): HTMLElement {
		const container = document.createElement("div");
		container.className = "chart-section";
		container.style.cssText = `
			background-color: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 20px;
			margin-bottom: 20px;
		`;

		// Header with title and chart type toggle
		const header = document.createElement("div");
		header.style.cssText = `
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16px;
		`;

		const title = document.createElement("h3");
		title.textContent = "Progress";
		title.style.cssText = `
			margin: 0;
			font-size: 16px;
			font-weight: 600;
			color: var(--text-normal);
		`;
		header.appendChild(title);

		// Chart type toggle
		const toggleContainer = document.createElement("div");
		toggleContainer.style.cssText = `
			display: flex;
			background-color: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 6px;
			padding: 2px;
			gap: 2px;
		`;

		const lineButton = document.createElement("button");
		lineButton.innerHTML = "📈";
		lineButton.title = "Line Chart";
		const themeColor = this.getThemeColor();
		lineButton.style.cssText = `
			padding: 6px 12px;
			border: none;
			background-color: ${this.props.chartType === ChartType.LINE ? themeColor : 'transparent'};
			color: ${this.props.chartType === ChartType.LINE ? 'var(--text-on-accent)' : 'var(--text-muted)'};
			border-radius: 4px;
			cursor: pointer;
			font-size: 14px;
			transition: all 0.2s;
		`;

		const barButton = document.createElement("button");
		barButton.innerHTML = "📊";
		barButton.title = "Bar Chart";
		barButton.style.cssText = `
			padding: 6px 12px;
			border: none;
			background-color: ${this.props.chartType === ChartType.BAR ? themeColor : 'transparent'};
			color: ${this.props.chartType === ChartType.BAR ? 'var(--text-on-accent)' : 'var(--text-muted)'};
			border-radius: 4px;
			cursor: pointer;
			font-size: 14px;
			transition: all 0.2s;
		`;

		lineButton.addEventListener("click", () => {
			this.props.onChartTypeChange(ChartType.LINE);
			this.updateToggleButtons();
			this.renderChart();
		});

		barButton.addEventListener("click", () => {
			this.props.onChartTypeChange(ChartType.BAR);
			this.updateToggleButtons();
			this.renderChart();
		});

		this.toggleButtons = { line: lineButton, bar: barButton };
		toggleContainer.appendChild(lineButton);
		toggleContainer.appendChild(barButton);
		header.appendChild(toggleContainer);
		container.appendChild(header);

		// Chart container
		this.chartContainer = document.createElement("div");
		this.chartContainer.className = "chart-container";
		this.chartContainer.style.cssText = `
			width: 100%;
			height: 300px;
			display: block;
			background-color: var(--background-primary);
			border-radius: 6px;
			position: relative;
			box-sizing: border-box;
			overflow: hidden;
		`;

		if (typeof ResizeObserver !== "undefined") {
			this.resizeObserver?.disconnect();
			this.resizeObserver = new ResizeObserver(() => {
				this.renderChart();
			});
			this.resizeObserver.observe(this.chartContainer);
		}

		this.renderChart();
		container.appendChild(this.chartContainer);

		return container;
	}

	private renderChart(): void {
		if (!this.chartContainer) return;
		this.chartContainer.innerHTML = '';

		if (this.props.data.length === 0) {
			const noData = document.createElement("div");
			noData.textContent = "No data available";
			noData.style.cssText = `
				color: var(--text-muted);
				font-size: 14px;
				padding: 16px;
			`;
			this.chartContainer.appendChild(noData);
			return;
		}

		if (this.props.chartType === ChartType.LINE) {
			this.renderLineChart();
		} else {
			this.renderBarChart();
		}
	}

	private getSortedPoints(): Array<{ date: Date; value: number }> {
		return this.props.data
			.map((entry) => ({
				date: new Date(entry.date),
				value: typeof entry.value === "boolean" ? (entry.value ? 1 : 0) : Number(entry.value)
			}))
			.sort((a, b) => a.date.getTime() - b.date.getTime());
	}

	private getDateRange(points: Array<{ date: Date; value: number }>): { start: Date; end: Date } {
		if (points.length === 0) {
			const now = new Date();
			return { start: now, end: now };
		}

		const start = new Date(points[0].date);
		start.setHours(0, 0, 0, 0);
		const end = new Date(points[points.length - 1].date);
		end.setHours(23, 59, 59, 999);
		return { start, end };
	}

	private getAggregatedPoints(): Array<{ date: Date; value: number }> {
		const points = this.getSortedPoints();
		if (points.length === 0) {
			return [];
		}

		const { start, end } = this.getDateRange(points);
		const aggregated: Array<{ date: Date; value: number }> = [];
		const valuesByDate = new Map<string, number>();
		points.forEach((point) => {
			const key = point.date.toDateString();
			valuesByDate.set(key, point.value);
		});

		const cursor = new Date(start);
		while (cursor <= end) {
			const key = cursor.toDateString();
			aggregated.push({
				date: new Date(cursor),
				value: valuesByDate.get(key) ?? 0
			});
			cursor.setDate(cursor.getDate() + 1);
		}

		return aggregated;
	}

	private getMonthLabels(
		rangeStart: Date,
		rangeEnd: Date,
		plotWidth: number,
		paddingLeft: number,
		rangeDurationMs: number,
		xScale: (date: Date) => number
	): Array<{ x: number; label: string }> {
		const adapter = getCalendarAdapter(this.props.reportCalendar || ReportCalendar.GREGORIAN);
		const labels: Array<{ x: number; label: string }> = [];
		const minLabelSpacing = Math.max(42, plotWidth / 10);
		const cursor = new Date(rangeStart);
		cursor.setHours(0, 0, 0, 0);
		let lastLabelX = -Infinity;
		let previousMonth: number | null = null;

		while (cursor <= rangeEnd) {
			const month = adapter.getMonthOfDate(cursor);
			if (previousMonth === null || month !== previousMonth) {
				const x = xScale(cursor);
				const label = adapter.getMonthName(month);
				if (label && x >= paddingLeft && x <= paddingLeft + plotWidth && x - lastLabelX >= minLabelSpacing) {
					labels.push({ x, label });
					lastLabelX = x;
				}
				previousMonth = month;
			}
			cursor.setDate(cursor.getDate() + 1);
		}

		return labels;
	}

	private renderLineChart(): void {
		if (!this.chartContainer) return;

		const width = this.chartContainer.clientWidth || 640;
		const height = 300;
		const paddingLeft = 36;
		const paddingRight = 16;
		const paddingTop = 20;
		const paddingBottom = 40;
		const themeColor = this.getThemeColor();

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", width.toString());
		svg.setAttribute("height", height.toString());
		svg.style.cssText = "width: 100%; height: 100%;";

		const points = this.getAggregatedPoints();
		const { start, end } = this.getDateRange(points);
		const values = points.map((point) => point.value);
		const maxValue = Math.max(...values, 1);
		const minValue = Math.min(...values, 0);
		const range = maxValue - minValue || 1;
		const plotWidth = Math.max(width - paddingLeft - paddingRight, 1);
		const plotHeight = Math.max(height - paddingTop - paddingBottom, 1);
		const rangeDurationMs = end.getTime() - start.getTime() || 1;

		const xScale = (date: Date) => paddingLeft + ((date.getTime() - start.getTime()) / rangeDurationMs) * plotWidth;
		const yScale = (value: number) => height - paddingBottom - ((value - minValue) / range) * plotHeight;

		for (let i = 0; i <= 4; i++) {
			const y = height - paddingBottom - (i / 4) * plotHeight;
			const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
			line.setAttribute("x1", paddingLeft.toString());
			line.setAttribute("y1", y.toString());
			line.setAttribute("x2", (width - paddingRight).toString());
			line.setAttribute("y2", y.toString());
			line.setAttribute("stroke", "var(--background-modifier-border)");
			line.setAttribute("stroke-width", "1");
			svg.appendChild(line);
		}

		let pathD = "";
		points.forEach((point, index) => {
			const x = xScale(point.date);
			const y = yScale(point.value);
			pathD += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
		});

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", pathD);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke", themeColor);
		path.setAttribute("stroke-width", "2");
		svg.appendChild(path);

		const monthLabels = this.getMonthLabels(start, end, plotWidth, paddingLeft, rangeDurationMs, xScale);
		monthLabels.forEach((monthLabel) => {
			const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttribute("x", monthLabel.x.toString());
			text.setAttribute("y", (height - 12).toString());
			text.setAttribute("text-anchor", "middle");
			text.setAttribute("fill", "var(--text-muted)");
			text.setAttribute("font-size", "10");
			text.textContent = monthLabel.label;
			svg.appendChild(text);
		});

		const yLabels = [0, 0.25, 0.5, 0.75, 1].map((p) => minValue + p * range);
		yLabels.forEach((labelValue, i) => {
			const y = height - paddingBottom - (i / 4) * plotHeight;
			const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttribute("x", (paddingLeft - 8).toString());
			text.setAttribute("y", (y + 4).toString());
			text.setAttribute("text-anchor", "end");
			text.setAttribute("fill", "var(--text-muted)");
			text.setAttribute("font-size", "10");
			text.textContent = (Math.round(labelValue * 10) / 10).toString();
			svg.appendChild(text);
		});

		this.chartContainer.appendChild(svg);
	}

	private renderBarChart(): void {
		if (!this.chartContainer) return;

		const width = this.chartContainer.clientWidth || 640;
		const height = 300;
		const paddingLeft = 36;
		const paddingRight = 16;
		const paddingTop = 20;
		const paddingBottom = 40;
		const themeColor = this.getThemeColor();

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", width.toString());
		svg.setAttribute("height", height.toString());
		svg.style.cssText = "width: 100%; height: 100%;";

		const points = this.getAggregatedPoints();
		const { start, end } = this.getDateRange(points);
		const values = points.map((point) => point.value);
		const maxValue = Math.max(...values, 1);
		const minValue = Math.min(...values, 0);
		const range = maxValue - minValue || 1;
		const plotWidth = Math.max(width - paddingLeft - paddingRight, 1);
		const plotHeight = Math.max(height - paddingTop - paddingBottom, 1);
		const rangeDurationMs = end.getTime() - start.getTime() || 1;

		const xScale = (date: Date) => paddingLeft + ((date.getTime() - start.getTime()) / rangeDurationMs) * plotWidth;
		const yScale = (value: number) => height - paddingBottom - ((value - minValue) / range) * plotHeight;

		for (let i = 0; i <= 4; i++) {
			const y = height - paddingBottom - (i / 4) * plotHeight;
			const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
			line.setAttribute("x1", paddingLeft.toString());
			line.setAttribute("y1", y.toString());
			line.setAttribute("x2", (width - paddingRight).toString());
			line.setAttribute("y2", y.toString());
			line.setAttribute("stroke", "var(--background-modifier-border)");
			line.setAttribute("stroke-width", "1");
			svg.appendChild(line);
		}

		points.forEach((point, index) => {
			const x = xScale(point.date);
			const y = yScale(point.value);
			const nextX = index < points.length - 1 ? xScale(points[index + 1].date) : x + 10;
			const barWidth = Math.max(6, Math.min(20, (nextX - x) / 2));
			const barHeight = height - paddingBottom - y;

			const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			rect.setAttribute("x", (x - barWidth / 2).toString());
			rect.setAttribute("y", y.toString());
			rect.setAttribute("width", barWidth.toString());
			rect.setAttribute("height", barHeight.toString());
			rect.setAttribute("fill", themeColor);
			rect.setAttribute("rx", "2");
		
			const dateStr = point.date.toLocaleDateString();
			const valueStr = this.props.habitType === "boolean"
				? (point.value > 0 ? "Completed" : "Not completed")
				: `${point.value}${this.props.unit ? ' ' + this.props.unit : ''}`;
			rect.setAttribute("title", `${dateStr}: ${valueStr}`);
			
			svg.appendChild(rect);
		});

		const monthLabels = this.getMonthLabels(start, end, plotWidth, paddingLeft, rangeDurationMs, xScale);
		monthLabels.forEach((monthLabel) => {
			const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttribute("x", monthLabel.x.toString());
			text.setAttribute("y", (height - 12).toString());
			text.setAttribute("text-anchor", "middle");
			text.setAttribute("fill", "var(--text-muted)");
			text.setAttribute("font-size", "10");
			text.textContent = monthLabel.label;
			svg.appendChild(text);
		});

		const yLabels = [0, 0.25, 0.5, 0.75, 1].map((p) => minValue + p * range);
		yLabels.forEach((labelValue, i) => {
			const y = height - paddingBottom - (i / 4) * plotHeight;
			const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttribute("x", (paddingLeft - 8).toString());
			text.setAttribute("y", (y + 4).toString());
			text.setAttribute("text-anchor", "end");
			text.setAttribute("fill", "var(--text-muted)");
			text.setAttribute("font-size", "10");
			text.textContent = (Math.round(labelValue * 10) / 10).toString();
			svg.appendChild(text);
		});

		this.chartContainer.appendChild(svg);
	}

	private updateToggleButtons(): void {
		if (!this.toggleButtons) return;

		const themeColor = this.getThemeColor();

		if (this.props.chartType === ChartType.LINE) {
			this.toggleButtons.line.style.cssText = `
				padding: 6px 12px;
				border: none;
				background-color: ${themeColor};
				color: var(--text-on-accent);
				border-radius: 4px;
				cursor: pointer;
				font-size: 14px;
				transition: all 0.2s;
			`;
			this.toggleButtons.bar.style.cssText = `
				padding: 6px 12px;
				border: none;
				background-color: transparent;
				color: var(--text-muted);
				border-radius: 4px;
				cursor: pointer;
				font-size: 14px;
				transition: all 0.2s;
			`;
		} else {
			this.toggleButtons.bar.style.cssText = `
				padding: 6px 12px;
				border: none;
				background-color: ${themeColor};
				color: var(--text-on-accent);
				border-radius: 4px;
				cursor: pointer;
				font-size: 14px;
				transition: all 0.2s;
			`;
			this.toggleButtons.line.style.cssText = `
				padding: 6px 12px;
				border: none;
				background-color: transparent;
				color: var(--text-muted);
				border-radius: 4px;
				cursor: pointer;
				font-size: 14px;
				transition: all 0.2s;
			`;
		}
	}
}
