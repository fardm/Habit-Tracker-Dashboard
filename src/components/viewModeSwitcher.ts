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
		container.style.cssText = `
			display: flex;
			align-items: center;
			gap: 4px;
		`;

		// Grid button
		this.gridButton = document.createElement("button");
		this.gridButton.innerHTML = "⊞";
		this.updateGridButtonStyle();
		this.gridButton.addEventListener("mouseenter", () => {
			this.gridButton!.style.color = "var(--text-normal)";
		});
		this.gridButton.addEventListener("mouseleave", () => {
			this.updateGridButtonStyle();
		});
		this.gridButton.addEventListener("click", () => {
			this.props.onModeChange(ViewMode.GRID);
			this.updateButtonStates();
		});

		// List button
		this.listButton = document.createElement("button");
		this.listButton.innerHTML = "≣";
		this.updateListButtonStyle();
		this.listButton.addEventListener("mouseenter", () => {
			this.listButton!.style.color = "var(--text-normal)";
		});
		this.listButton.addEventListener("mouseleave", () => {
			this.updateListButtonStyle();
		});
		this.listButton.addEventListener("click", () => {
			this.props.onModeChange(ViewMode.LIST);
			this.updateButtonStates();
		});

		container.appendChild(this.gridButton);
		container.appendChild(this.listButton);

		return container;
	}

	private updateGridButtonStyle(): void {
		if (!this.gridButton) return;
		this.gridButton.style.cssText = `
			background: none;
			border: none;
			color: ${this.props.currentMode === ViewMode.GRID ? 'var(--interactive-accent)' : 'var(--text-muted)'};
			font-size: 16px;
			cursor: pointer;
			padding: 4px 8px;
			transition: color 0.2s;
			line-height: 1;
		`;
	}

	private updateListButtonStyle(): void {
		if (!this.listButton) return;
		this.listButton.style.cssText = `
			background: none;
			border: none;
			color: ${this.props.currentMode === ViewMode.LIST ? 'var(--interactive-accent)' : 'var(--text-muted)'};
			font-size: 16px;
			cursor: pointer;
			padding: 4px 8px;
			transition: color 0.2s;
			line-height: 1;
		`;
	}

	private updateButtonStates(): void {
		this.updateGridButtonStyle();
		this.updateListButtonStyle();
	}
}