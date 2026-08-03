import { HTMLElementComponent } from "./htmlElementComponent";
import { ViewMode } from "../types/habitTypes";
import { setIcon } from "obsidian";

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
		setIcon(this.gridButton, "layout-grid");
		this.gridButton.addEventListener("click", () => {
			this.props.onModeChange(ViewMode.GRID);
			this.updateButtonStates();
		});

		// List button
		this.listButton = createEl("button", {
			cls: this.props.currentMode === ViewMode.LIST ? "view-mode-button view-mode-button-active" : "view-mode-button",
			attr: { title: "List View" }
		});
		setIcon(this.listButton, "list");
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