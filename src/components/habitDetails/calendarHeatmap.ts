import { HTMLElementComponent } from "../htmlElementComponent";
import { CalendarHeatmapProps, HabitValueEntry } from "../../types/habitDetailsTypes";

/**
 * CalendarHeatmap component for GitHub-style activity visualization
 */
export class CalendarHeatmap extends HTMLElementComponent {
	private props: CalendarHeatmapProps;

	constructor(props: CalendarHeatmapProps) {
		super();
		this.props = props;
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

		const title = document.createElement("h3");
		title.textContent = "Activity Heatmap";
		title.style.cssText = `
			margin: 0 0 16px 0;
			font-size: 16px;
			font-weight: 600;
			color: var(--text-normal);
		`;
		container.appendChild(title);

		// Heatmap container (placeholder for actual heatmap implementation)
		const heatmapContainer = document.createElement("div");
		heatmapContainer.className = "heatmap-container";
		heatmapContainer.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 4px;
		`;

		// Create placeholder grid structure
		const grid = document.createElement("div");
		grid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(53, 12px);
			gap: 3px;
			overflow-x: auto;
			padding-bottom: 8px;
		`;

		// Generate placeholder cells (approximate GitHub-style grid)
		for (let week = 0; week < 53; week++) {
			for (let day = 0; day < 7; day++) {
				const cell = document.createElement("div");
				cell.style.cssText = `
					width: 12px;
					height: 12px;
					border-radius: 2px;
					background-color: var(--background-modifier-border);
					transition: background-color 0.2s;
				`;
				cell.title = "No data";
				grid.appendChild(cell);
			}
		}

		heatmapContainer.appendChild(grid);

		// Legend
		const legend = document.createElement("div");
		legend.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 4px;
			margin-top: 8px;
			font-size: 11px;
			color: var(--text-muted);
		`;

		const legendLabel = document.createElement("span");
		legendLabel.textContent = "Less";
		legend.appendChild(legendLabel);

		const legendColors = [
			"var(--background-modifier-border)",
			"var(--interactive-accent-hover)",
			"var(--interactive-accent)",
			"var(--interactive-accent)"
		];

		legendColors.forEach(color => {
			const legendItem = document.createElement("div");
			legendItem.style.cssText = `
				width: 12px;
				height: 12px;
				border-radius: 2px;
				background-color: ${color};
			`;
			legend.appendChild(legendItem);
		});

		const moreLabel = document.createElement("span");
		moreLabel.textContent = "More";
		legend.appendChild(moreLabel);

		heatmapContainer.appendChild(legend);
		container.appendChild(heatmapContainer);

		return container;
	}
}
