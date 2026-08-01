import { HTMLElementComponent } from "../htmlElementComponent";
import { SettingsPanelProps, HabitDetailsSettings, SectionVisibility, ColorTheme } from "../../types/habitDetailsTypes";

/**
 * SettingsPanel component for customizing habit details view
 */
export class SettingsPanel extends HTMLElementComponent {
	private props: SettingsPanelProps;
	private isOpen: boolean = false;

	constructor(props: SettingsPanelProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const container = document.createElement("div");
		container.className = "settings-panel";
		container.style.cssText = `
			position: relative;
		`;

		// Settings button
		const settingsButton = document.createElement("button");
		settingsButton.innerHTML = "⚙️";
		settingsButton.title = "Settings";
		settingsButton.style.cssText = `
			padding: 8px 12px;
			background-color: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 6px;
			cursor: pointer;
			font-size: 16px;
			transition: all 0.2s;
		`;

		settingsButton.addEventListener("click", () => {
			this.isOpen = !this.isOpen;
			this.togglePanel();
		});

		container.appendChild(settingsButton);

		// Settings dropdown panel
		const panel = document.createElement("div");
		panel.className = "settings-dropdown";
		panel.id = "settings-dropdown";
		panel.style.cssText = `
			position: absolute;
			top: calc(100% + 8px);
			right: 0;
			width: 300px;
			background-color: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 16px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			z-index: 1000;
			display: none;
		`;

		// Section visibility settings
		const sectionTitle = document.createElement("h4");
		sectionTitle.textContent = "Section Visibility";
		sectionTitle.style.cssText = `
			margin: 0 0 12px 0;
			font-size: 14px;
			font-weight: 600;
			color: var(--text-normal);
		`;
		panel.appendChild(sectionTitle);

		const sectionToggles = this.createSectionToggles();
		panel.appendChild(sectionToggles);

		// Color theme settings
		const themeTitle = document.createElement("h4");
		themeTitle.textContent = "Color Theme";
		themeTitle.style.cssText = `
			margin: 16px 0 12px 0;
			font-size: 14px;
			font-weight: 600;
			color: var(--text-normal);
		`;
		panel.appendChild(themeTitle);

		const themeSelector = this.createThemeSelector();
		panel.appendChild(themeSelector);

		container.appendChild(panel);

		return container;
	}

	private createSectionToggles(): HTMLElement {
		const container = document.createElement("div");
		container.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 8px;
		`;

		const sections: { key: keyof SectionVisibility; label: string }[] = [
			{ key: "showHeatmap", label: "Activity Heatmap" },
			{ key: "showChart", label: "Progress Chart" },
			{ key: "showStatistics", label: "Statistics" },
			{ key: "showStreaks", label: "Streaks" }
		];

		sections.forEach(section => {
			const toggleRow = document.createElement("div");
			toggleRow.style.cssText = `
				display: flex;
				justify-content: space-between;
				align-items: center;
			`;

			const label = document.createElement("label");
			label.textContent = section.label;
			label.style.cssText = `
				font-size: 13px;
				color: var(--text-normal);
			`;
			toggleRow.appendChild(label);

			const toggle = document.createElement("input");
			toggle.type = "checkbox";
			toggle.checked = this.props.settings.sectionVisibility[section.key];
			toggle.style.cssText = `
				width: 16px;
				height: 16px;
				cursor: pointer;
			`;

			toggle.addEventListener("change", () => {
				const newSettings = { ...this.props.settings };
				newSettings.sectionVisibility[section.key] = toggle.checked;
				this.props.onSettingsChange(newSettings);
			});

			toggleRow.appendChild(toggle);
			container.appendChild(toggleRow);
		});

		return container;
	}

	private createThemeSelector(): HTMLElement {
		const container = document.createElement("div");
		container.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 8px;
		`;

		const themes = [
			{ name: "Default", primary: "var(--interactive-accent)" },
			{ name: "Green", primary: "#4ade80" },
			{ name: "Blue", primary: "#60a5fa" },
			{ name: "Purple", primary: "#a78bfa" }
		];

		themes.forEach(theme => {
			const themeOption = document.createElement("div");
			themeOption.style.cssText = `
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 8px;
				border-radius: 4px;
				cursor: pointer;
				transition: background-color 0.2s;
			`;

			themeOption.addEventListener("mouseenter", () => {
				themeOption.style.backgroundColor = "var(--background-modifier-hover)";
			});

			themeOption.addEventListener("mouseleave", () => {
				themeOption.style.backgroundColor = "transparent";
			});

			const colorPreview = document.createElement("div");
			colorPreview.style.cssText = `
				width: 20px;
				height: 20px;
				border-radius: 4px;
				background-color: ${theme.primary};
			`;
			themeOption.appendChild(colorPreview);

			const themeName = document.createElement("span");
			themeName.textContent = theme.name;
			themeName.style.cssText = `
				font-size: 13px;
				color: var(--text-normal);
			`;
			themeOption.appendChild(themeName);

			themeOption.addEventListener("click", () => {
				const newSettings = { ...this.props.settings };
				newSettings.theme.primary = theme.primary;
				this.props.onSettingsChange(newSettings);
			});

			container.appendChild(themeOption);
		});

		return container;
	}

	private togglePanel(): void {
		const panel = document.getElementById("settings-dropdown");
		if (panel) {
			panel.style.display = this.isOpen ? "block" : "none";
		}
	}
}
