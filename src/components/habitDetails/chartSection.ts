import { HTMLElementComponent } from "../htmlElementComponent";
import { ChartType, ChartSectionProps, HabitValueEntry } from "../../types/habitDetailsTypes";

/**
 * ChartSection component for displaying progress charts with toggle between line and bar
 */
export class ChartSection extends HTMLElementComponent {
	private props: ChartSectionProps;
	private chartContainer?: HTMLElement;
	private toggleButtons?: { line: HTMLElement; bar: HTMLElement };

	constructor(props: ChartSectionProps) {
		super();
		this.props = props;
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
		lineButton.style.cssText = `
			padding: 6px 12px;
			border: none;
			background-color: ${this.props.chartType === ChartType.LINE ? 'var(--interactive-accent)' : 'transparent'};
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
			background-color: ${this.props.chartType === ChartType.BAR ? 'var(--interactive-accent)' : 'transparent'};
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
			height: 300px;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: var(--background-primary);
			border-radius: 6px;
			position: relative;
		`;

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

	private renderLineChart(): void {
		if (!this.chartContainer) return;

		const width = this.chartContainer.clientWidth || 600;
		const height = 300;
		const padding = 40;

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", width.toString());
		svg.setAttribute("height", height.toString());
		svg.style.cssText = "width: 100%; height: 100%;";

		// Calculate scales
		const values = this.props.data.map(d => typeof d.value === 'boolean' ? (d.value ? 1 : 0) : d.value as number);
		const maxValue = Math.max(...values, 1);
		const minValue = Math.min(...values, 0);
		const range = maxValue - minValue || 1;

		const xScale = (index: number) => padding + (index / (values.length - 1 || 1)) * (width - 2 * padding);
		const yScale = (value: number) => height - padding - ((value - minValue) / range) * (height - 2 * padding);

		// Draw grid lines
		for (let i = 0; i <= 4; i++) {
			const y = padding + (i / 4) * (height - 2 * padding);
			const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
			line.setAttribute("x1", padding.toString());
			line.setAttribute("y1", y.toString());
			line.setAttribute("x2", (width - padding).toString());
			line.setAttribute("y2", y.toString());
			line.setAttribute("stroke", "var(--background-modifier-border)");
			line.setAttribute("stroke-width", "1");
			svg.appendChild(line);
		}

		// Draw line
		let pathD = "";
		values.forEach((value, index) => {
			const x = xScale(index);
			const y = yScale(value);
			pathD += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
		});

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", pathD);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke", "var(--interactive-accent)");
		path.setAttribute("stroke-width", "2");
		svg.appendChild(path);

		// Draw data points
		values.forEach((value, index) => {
			const x = xScale(index);
			const y = yScale(value);
			const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			circle.setAttribute("cx", x.toString());
			circle.setAttribute("cy", y.toString());
			circle.setAttribute("r", "4");
			circle.setAttribute("fill", "var(--interactive-accent)");
			circle.setAttribute("stroke", "var(--background-primary)");
			circle.setAttribute("stroke-width", "2");
			
			const dateStr = this.props.data[index].date.toLocaleDateString();
			const valueStr = this.props.habitType === "boolean" 
				? (value > 0 ? "Completed" : "Not completed")
				: `${value}${this.props.unit ? ' ' + this.props.unit : ''}`;
			circle.setAttribute("title", `${dateStr}: ${valueStr}`);
			
			svg.appendChild(circle);
		});

		// Draw axes labels
		const yLabels = [0, 0.25, 0.5, 0.75, 1].map(p => minValue + p * range);
		yLabels.forEach((labelValue, i) => {
			const y = padding + (i / 4) * (height - 2 * padding);
			const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttribute("x", (padding - 5).toString());
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

		const width = this.chartContainer.clientWidth || 600;
		const height = 300;
		const padding = 40;

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", width.toString());
		svg.setAttribute("height", height.toString());
		svg.style.cssText = "width: 100%; height: 100%;";

		// Calculate scales
		const values = this.props.data.map(d => typeof d.value === 'boolean' ? (d.value ? 1 : 0) : d.value as number);
		const maxValue = Math.max(...values, 1);
		const minValue = Math.min(...values, 0);
		const range = maxValue - minValue || 1;

		const barWidth = (width - 2 * padding) / values.length - 2;
	 const xScale = (index: number) => padding + index * ((width - 2 * padding) / values.length);
		const yScale = (value: number) => height - padding - ((value - minValue) / range) * (height - 2 * padding);

		// Draw grid lines
		for (let i = 0; i <= 4; i++) {
			const y = padding + (i / 4) * (height - 2 * padding);
			const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
			line.setAttribute("x1", padding.toString());
			line.setAttribute("y1", y.toString());
			line.setAttribute("x2", (width - padding).toString());
			line.setAttribute("y2", y.toString());
			line.setAttribute("stroke", "var(--background-modifier-border)");
			line.setAttribute("stroke-width", "1");
			svg.appendChild(line);
		}

		// Draw bars
		values.forEach((value, index) => {
			const x = xScale(index);
			const y = yScale(value);
			const barHeight = height - padding - y;

			const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			rect.setAttribute("x", x.toString());
			rect.setAttribute("y", y.toString());
			rect.setAttribute("width", Math.max(barWidth, 1).toString());
			rect.setAttribute("height", barHeight.toString());
			rect.setAttribute("fill", "var(--interactive-accent)");
			rect.setAttribute("rx", "2");
			
			const dateStr = this.props.data[index].date.toLocaleDateString();
			const valueStr = this.props.habitType === "boolean" 
				? (value > 0 ? "Completed" : "Not completed")
				: `${value}${this.props.unit ? ' ' + this.props.unit : ''}`;
			rect.setAttribute("title", `${dateStr}: ${valueStr}`);
			
			svg.appendChild(rect);
		});

		// Draw axes labels
		const yLabels = [0, 0.25, 0.5, 0.75, 1].map(p => minValue + p * range);
		yLabels.forEach((labelValue, i) => {
			const y = padding + (i / 4) * (height - 2 * padding);
			const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttribute("x", (padding - 5).toString());
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

		if (this.props.chartType === ChartType.LINE) {
			this.toggleButtons.line.style.cssText = `
				padding: 6px 12px;
				border: none;
				background-color: var(--interactive-accent);
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
				background-color: var(--interactive-accent);
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
