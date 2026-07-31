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
		const gridButton = document.createElement("button");
		gridButton.innerHTML = "⊞";
		gridButton.style.cssText = `
			background: none;
			border: none;
			color: ${this.props.currentMode === ViewMode.GRID ? 'var(--interactive-accent)' : 'var(--text-muted)'};
			font-size: 16px;
			cursor: pointer;
			padding: 4px 8px;
			transition: color 0.2s;
			line-height: 1;
		`;
		gridButton.addEventListener("mouseenter", () => {
			gridButton.style.color = "var(--text-normal)";
		});
		gridButton.addEventListener("mouseleave", () => {
			gridButton.style.color = this.props.currentMode === ViewMode.GRID ? 'var(--interactive-accent)' : 'var(--text-muted)';
		});
		gridButton.addEventListener("click", () => {
			this.props.onModeChange(ViewMode.GRID);
		});

		// List button
		const listButton = document.createElement("button");
		listButton.innerHTML = "≣";
		listButton.style.cssText = `
			background: none;
			border: none;
			color: ${this.props.currentMode === ViewMode.LIST ? 'var(--interactive-accent)' : 'var(--text-muted)'};
			font-size: 16px;
			cursor: pointer;
			padding: 4px 8px;
			transition: color 0.2s;
			line-height: 1;
		`;
		listButton.addEventListener("mouseenter", () => {
			listButton.style.color = "var(--text-normal)";
		});
		listButton.addEventListener("mouseleave", () => {
			listButton.style.color = this.props.currentMode === ViewMode.LIST ? 'var(--interactive-accent)' : 'var(--text-muted)';
		});
		listButton.addEventListener("click", () => {
			this.props.onModeChange(ViewMode.LIST);
		});

		container.appendChild(gridButton);
		container.appendChild(listButton);

		return container;
	}
}