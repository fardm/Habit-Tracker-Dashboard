import { HTMLElementComponent } from "../htmlElementComponent";
import { StatisticsDashboardProps, HabitStatistics } from "../../types/habitDetailsTypes";

/**
 * StatisticsDashboard component for displaying habit statistics
 */
export class StatisticsDashboard extends HTMLElementComponent {
	private props: StatisticsDashboardProps;

	constructor(props: StatisticsDashboardProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const container = document.createElement("div");
		container.className = "statistics-dashboard";
		container.style.cssText = `
			background-color: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 20px;
			margin-bottom: 20px;
		`;

		const title = document.createElement("h3");
		title.textContent = "Statistics";
		title.style.cssText = `
			margin: 0 0 16px 0;
			font-size: 16px;
			font-weight: 600;
			color: var(--text-normal);
		`;
		container.appendChild(title);

		// Statistics grid
		const grid = document.createElement("div");
		grid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
			gap: 16px;
		`;

		// Stat items
		const stats = this.getStatItems();
		stats.forEach(stat => {
			const statItem = this.createStatItem(stat);
			grid.appendChild(statItem);
		});

		container.appendChild(grid);
		return container;
	}

	private getStatItems(): Array<{ label: string; value: string; icon: string }> {
		const unit = this.props.unit ? ` ${this.props.unit}` : "";
		const stats = this.props.statistics;
		
		if (this.props.habitType === "boolean") {
			return [
				{ label: "Total", value: stats.total.toString(), icon: "📊" },
				{ label: "Completion Rate", value: `${Math.round(stats.completionRate)}%`, icon: "✅" },
				{ label: "Best Day", value: `${Math.round(stats.highest)}%`, icon: "🏆" }
			];
		} else {
			return [
				{ label: "Total", value: `${Math.round(stats.total)}${unit}`, icon: "📊" },
				{ label: "Average", value: `${Math.round(stats.average)}${unit}`, icon: "📈" },
				{ label: "Highest", value: `${Math.round(stats.highest)}${unit}`, icon: "🔝" },
				{ label: "Lowest", value: `${Math.round(stats.lowest)}${unit}`, icon: "📉" }
			];
		}
	}

	private createStatItem(stat: { label: string; value: string; icon: string }): HTMLElement {
		const item = document.createElement("div");
		item.style.cssText = `
			background-color: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 6px;
			padding: 12px;
			text-align: center;
		`;

		const icon = document.createElement("div");
		icon.textContent = stat.icon;
		icon.style.cssText = `
			font-size: 24px;
			margin-bottom: 8px;
		`;
		item.appendChild(icon);

		const value = document.createElement("div");
		value.textContent = stat.value;
		value.style.cssText = `
			font-size: 20px;
			font-weight: 600;
			color: var(--text-normal);
			margin-bottom: 4px;
		`;
		item.appendChild(value);

		const label = document.createElement("div");
		label.textContent = stat.label;
		label.style.cssText = `
			font-size: 12px;
			color: var(--text-muted);
		`;
		item.appendChild(label);

		return item;
	}
}
