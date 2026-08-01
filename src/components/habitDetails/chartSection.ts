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
		});

		barButton.addEventListener("click", () => {
			this.props.onChartTypeChange(ChartType.BAR);
			this.updateToggleButtons();
		});

		this.toggleButtons = { line: lineButton, bar: barButton };
		toggleContainer.appendChild(lineButton);
		toggleContainer.appendChild(barButton);
		header.appendChild(toggleContainer);
		container.appendChild(header);

		// Chart container (placeholder for actual chart implementation)
		this.chartContainer = document.createElement("div");
		this.chartContainer.className = "chart-container";
		this.chartContainer.style.cssText = `
			height: 300px;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: var(--background-primary);
			border-radius: 6px;
			border: 1px dashed var(--background-modifier-border);
		`;

		const placeholder = document.createElement("div");
		placeholder.textContent = `${this.props.chartType === ChartType.LINE ? 'Line' : 'Bar'} Chart`;
		placeholder.style.cssText = `
			color: var(--text-muted);
			font-size: 14px;
		`;
		this.chartContainer.appendChild(placeholder);
		container.appendChild(this.chartContainer);

		return container;
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
