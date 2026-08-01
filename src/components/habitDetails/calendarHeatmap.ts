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

	private getThemeColor(): string {
		return this.props.theme?.primary || "var(--interactive-accent)";
	}

	private adjustColorOpacity(color: string, opacity: number): string {
		// Simple opacity adjustment for hex colors
		if (color.startsWith('#')) {
			const r = parseInt(color.slice(1, 3), 16);
			const g = parseInt(color.slice(3, 5), 16);
			const b = parseInt(color.slice(5, 7), 16);
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}
		// For CSS variables, return as-is (they handle opacity differently)
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

		const title = document.createElement("h3");
		title.textContent = "Activity Heatmap";
		title.style.cssText = `
			margin: 0 0 16px 0;
			font-size: 16px;
			font-weight: 600;
			color: var(--text-normal);
		`;
		container.appendChild(title);

		// Heatmap container
		const heatmapContainer = document.createElement("div");
		heatmapContainer.className = "heatmap-container";
		heatmapContainer.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 4px;
		`;

		// Create grid with real data
		const grid = this.createHeatmapGrid();
		heatmapContainer.appendChild(grid);

		// Legend
		const legend = this.createLegend();
		heatmapContainer.appendChild(legend);

		container.appendChild(heatmapContainer);

		return container;
	}

	private createHeatmapGrid(): HTMLElement {
		const grid = document.createElement("div");
		grid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(53, 12px);
			gap: 3px;
			overflow-x: auto;
			padding-bottom: 8px;
		`;

		// Create value map from props
		const valueMap = new Map<string, number>();
		this.props.values.forEach(entry => {
			const dateKey = entry.date.toISOString().split('T')[0];
			if (this.props.habitType === "boolean") {
				valueMap.set(dateKey, entry.value === true ? 1 : 0);
			} else {
				const numValue = entry.value as number;
				if (this.props.target !== undefined && this.props.target > 0) {
					valueMap.set(dateKey, Math.min(numValue / this.props.target, 1));
				} else {
					// Normalize numeric values for display
					const maxVal = Math.max(...this.props.values.map(v => typeof v.value === 'number' ? v.value : 0), 1);
					valueMap.set(dateKey, numValue / maxVal);
				}
			}
		});

		// Generate 53 weeks of data
		const today = new Date();
		const themeColor = this.getThemeColor();
		
		for (let week = 0; week < 53; week++) {
			for (let day = 0; day < 7; day++) {
				const date = new Date(today);
				date.setDate(date.getDate() - ((53 - week - 1) * 7 + (6 - day)));
				const dateKey = date.toISOString().split('T')[0];
				
				const cell = document.createElement("div");
				const value = valueMap.get(dateKey) || 0;
				
				let bgColor = "var(--background-modifier-border)";
				if (value > 0) {
					if (value <= 0.25) {
						bgColor = this.adjustColorOpacity(themeColor, 0.3);
					} else if (value <= 0.5) {
						bgColor = this.adjustColorOpacity(themeColor, 0.5);
					} else if (value <= 0.75) {
						bgColor = this.adjustColorOpacity(themeColor, 0.7);
					} else {
						bgColor = themeColor;
					}
				}
				
				cell.style.cssText = `
					width: 12px;
					height: 12px;
					border-radius: 2px;
					background-color: ${bgColor};
					transition: background-color 0.2s;
				`;
				
				const displayValue = this.props.habitType === "boolean" 
					? (value > 0 ? "Completed" : "Not completed")
					: `${this.props.values.find(v => v.date.toISOString().split('T')[0] === dateKey)?.value || 0}`;
				
				cell.title = `${dateKey}: ${displayValue}`;
				grid.appendChild(cell);
			}
		}

		return grid;
	}

	private createLegend(): HTMLElement {
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
			{ color: "var(--background-modifier-border)", label: "0" },
			{ color: "var(--interactive-accent-hover)", label: "1-25%" },
			{ color: "var(--interactive-accent)", label: "26-50%" },
			{ color: "var(--text-accent)", label: "51-75%" },
			{ color: "var(--text-success)", label: "76-100%" }
		];

		legendColors.forEach(item => {
			const legendItem = document.createElement("div");
			legendItem.style.cssText = `
				width: 12px;
				height: 12px;
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
