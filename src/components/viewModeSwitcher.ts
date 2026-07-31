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
			display: inline-block;
		`;

		const label = document.createElement("label");
		label.textContent = "View:";
		label.style.cssText = `
			font-size: 12px;
			color: var(--text-muted);
			margin-right: 8px;
		`;

		const select = document.createElement("select");
		select.className = "view-mode-select";
		select.style.cssText = `
			padding: 6px 12px;
			border-radius: 4px;
			border: 1px solid var(--background-modifier-border);
			background-color: var(--background-secondary);
			color: var(--text-normal);
			font-size: 13px;
			cursor: pointer;
		`;

		const options = [
			{ value: ViewMode.GRID, label: "Grid" },
			{ value: ViewMode.LIST, label: "List" }
		];

		options.forEach(option => {
			const optionElement = document.createElement("option");
			optionElement.value = option.value;
			optionElement.textContent = option.label;
			if (option.value === this.props.currentMode) {
				optionElement.selected = true;
			}
			select.appendChild(optionElement);
		});

		select.addEventListener("change", (e) => {
			const target = e.target as HTMLSelectElement;
			this.props.onModeChange(target.value as ViewMode);
		});

		container.appendChild(label);
		container.appendChild(select);

		return container;
	}
}