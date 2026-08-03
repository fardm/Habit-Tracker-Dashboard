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
		this.gridButton.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="7" height="7"></rect>
				<rect x="14" y="3" width="7" height="7"></rect>
				<rect x="14" y="14" width="7" height="7"></rect>
				<rect x="3" y="14" width="7" height="7"></rect>
			</svg>
		`;
		this.gridButton.addEventListener("click", () => {
			this.props.onModeChange(ViewMode.GRID);
			this.updateButtonStates();
		});

		// List button
		this.listButton = createEl("button", {
			cls: this.props.currentMode === ViewMode.LIST ? "view-mode-button view-mode-button-active" : "view-mode-button",
			attr: { title: "List View" }
		});
		this.listButton.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="8" y1="6" x2="21" y2="6"></line>
				<line x1="8" y1="12" x2="21" y2="12"></line>
				<line x1="8" y1="18" x2="21" y2="18"></line>
				<line x1="3" y1="6" x2="3.01" y2="6"></line>
				<line x1="3" y1="12" x2="3.01" y2="12"></line>
				<line x1="3" y1="18" x2="3.01" y2="18"></line>
			</svg>
		`;
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