import { HTMLElementComponent } from "./htmlElementComponent";
import { ViewMode } from "../types/habitTypes";

export interface ViewModeSwitcherProps {
	currentMode: ViewMode;
	onModeChange: (mode: ViewMode) => void;
}

/**
 * Component for switching between Grid and List view modes
 */
export class ViewModeSwitcher extends HTMLElementComponent {
	private props: ViewModeSwitcherProps;
	private gridButton?: HTMLButtonElement;
	private listButton?: HTMLButtonElement;

	constructor(props: ViewModeSwitcherProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const container = createDiv({ cls: "view-mode-switcher" });

		// Grid button
		this.gridButton = createEl("button", {
			cls: this.props.currentMode === ViewMode.GRID ? "view-mode-button view-mode-button-active" : "view-mode-button",
			attr: { title: "Grid View" }
		});
		this.gridButton.appendChild(this.createGridIcon());
		this.gridButton.addEventListener("click", () => {
			this.props.onModeChange(ViewMode.GRID);
			this.updateButtonStates();
		});

		// List button
		this.listButton = createEl("button", {
			cls: this.props.currentMode === ViewMode.LIST ? "view-mode-button view-mode-button-active" : "view-mode-button",
			attr: { title: "List View" }
		});
		this.listButton.appendChild(this.createListIcon());
		this.listButton.addEventListener("click", () => {
			this.props.onModeChange(ViewMode.LIST);
			this.updateButtonStates();
		});

		container.appendChild(this.gridButton);
		container.appendChild(this.listButton);

		return container;
	}


	private updateButtonStates(): void {
		if (this.props.currentMode === ViewMode.GRID) {
			this.gridButton?.classList.add("view-mode-button-active");
			this.listButton?.classList.remove("view-mode-button-active");
		} else {
			this.listButton?.classList.add("view-mode-button-active");
			this.gridButton?.classList.remove("view-mode-button-active");
		}
	}

	public updateCurrentMode(mode: ViewMode): void {
		this.props.currentMode = mode;
		this.updateButtonStates();
	}

	private createGridIcon(): SVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "16");
		svg.setAttribute("height", "16");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");

		const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		rect1.setAttribute("x", "3");
		rect1.setAttribute("y", "3");
		rect1.setAttribute("width", "7");
		rect1.setAttribute("height", "7");

		const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		rect2.setAttribute("x", "14");
		rect2.setAttribute("y", "3");
		rect2.setAttribute("width", "7");
		rect2.setAttribute("height", "7");

		const rect3 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		rect3.setAttribute("x", "14");
		rect3.setAttribute("y", "14");
		rect3.setAttribute("width", "7");
		rect3.setAttribute("height", "7");

		const rect4 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		rect4.setAttribute("x", "3");
		rect4.setAttribute("y", "14");
		rect4.setAttribute("width", "7");
		rect4.setAttribute("height", "7");

		svg.appendChild(rect1);
		svg.appendChild(rect2);
		svg.appendChild(rect3);
		svg.appendChild(rect4);

		return svg;
	}

	private createListIcon(): SVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "16");
		svg.setAttribute("height", "16");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");

		const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line1.setAttribute("x1", "8");
		line1.setAttribute("y1", "6");
		line1.setAttribute("x2", "21");
		line1.setAttribute("y2", "6");

		const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line2.setAttribute("x1", "8");
		line2.setAttribute("y1", "12");
		line2.setAttribute("x2", "21");
		line2.setAttribute("y2", "12");

		const line3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line3.setAttribute("x1", "8");
		line3.setAttribute("y1", "18");
		line3.setAttribute("x2", "21");
		line3.setAttribute("y2", "18");

		const line4 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line4.setAttribute("x1", "3");
		line4.setAttribute("y1", "6");
		line4.setAttribute("x2", "3.01");
		line4.setAttribute("y2", "6");

		const line5 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line5.setAttribute("x1", "3");
		line5.setAttribute("y1", "12");
		line5.setAttribute("x2", "3.01");
		line5.setAttribute("y2", "12");

		const line6 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line6.setAttribute("x1", "3");
		line6.setAttribute("y1", "18");
		line6.setAttribute("x2", "3.01");
		line6.setAttribute("y2", "18");

		svg.appendChild(line1);
		svg.appendChild(line2);
		svg.appendChild(line3);
		svg.appendChild(line4);
		svg.appendChild(line5);
		svg.appendChild(line6);

		return svg;
	}
}