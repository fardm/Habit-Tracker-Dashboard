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
		const container = document.createElement("div");
		container.className = "view-mode-switcher";

		// Grid button
		this.gridButton = document.createElement("button");
		this.gridButton.innerHTML = "⊞";
		this.gridButton.title = "Grid View";
		this.gridButton.className = "view-mode-button";
		if (this.props.currentMode === ViewMode.GRID) {
			this.gridButton.classList.add("view-mode-button-active");
		}
		this.gridButton.addEventListener("click", () => {
			this.props.onModeChange(ViewMode.GRID);
			this.updateButtonStates();
		});

		// List button
		this.listButton = document.createElement("button");
		this.listButton.innerHTML = "≣";
		this.listButton.title = "List View";
		this.listButton.className = "view-mode-button";
		if (this.props.currentMode === ViewMode.LIST) {
			this.listButton.classList.add("view-mode-button-active");
		}
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
}