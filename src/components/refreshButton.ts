import { HTMLElementComponent } from "./htmlElementComponent";

/**
 * Component for the "Refresh" button
 * Displays a button that refreshes the dashboard data
 */
export class RefreshButton extends HTMLElementComponent {
	private onClick: () => void;

	constructor(onClick: () => void) {
		super();
		this.onClick = onClick;
	}

	render(): HTMLElement {
		const button = createEl("button", {
			cls: "habit-tracker-refresh-btn",
			type: "button"
		});
		
		const iconContainer = createSpan();
		iconContainer.style.cssText = "vertical-align: middle; margin-right: 4px;";
		iconContainer.appendChild(this.createRefreshIcon());
		button.appendChild(iconContainer);
		
		const textSpan = createSpan({
			text: "Refresh"
		});
		button.appendChild(textSpan);
		// Hover states are handled by CSS

		// Add click handler
		button.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.onClick();
		});

		return button;
	}

	private createRefreshIcon(): SVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "14");
		svg.setAttribute("height", "14");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");

		const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path1.setAttribute("d", "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8");

		const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path2.setAttribute("d", "M3 3v5h5");

		const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path3.setAttribute("d", "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16");

		const path4 = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path4.setAttribute("d", "M16 21h5v-5");

		svg.appendChild(path1);
		svg.appendChild(path2);
		svg.appendChild(path3);
		svg.appendChild(path4);

		return svg;
	}
}
