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
		const container = createDiv({ cls: "settings-panel" });
		// Container styling is handled by CSS

		// Settings button
		const settingsButton = createEl("button", {
			cls: "settings-panel-button",
			type: "button",
			attr: { title: "View Settings" }
		});
		
		// Eye icon SVG
		settingsButton.appendChild(this.createEyeIcon());
		// Hover states are handled by CSS

		settingsButton.addEventListener("click", (e) => {
			e.stopPropagation();
			this.isOpen = !this.isOpen;
			this.togglePanel();
		});

		container.appendChild(settingsButton);

		// Settings dropdown panel
		const panel = createDiv({
			cls: "settings-dropdown",
			attr: { id: "settings-dropdown" }
		});
		// Panel styling is handled by CSS

		// Section visibility settings
		const sectionTitle = createEl("h4", {
			cls: "settings-panel-section-title",
			text: "Section Visibility"
		});
		panel.appendChild(sectionTitle);

		const sectionToggles = this.createSectionToggles();
		panel.appendChild(sectionToggles);

		container.appendChild(panel);

		// Close dropdown when clicking outside
		document.addEventListener("click", (e) => {
			if (this.isOpen && !container.contains(e.target as Node)) {
				this.isOpen = false;
				this.togglePanel();
			}
		});

		return container;
	}

	private createSectionToggles(): HTMLElement {
		const container = createDiv({ cls: "settings-panel-toggles" });

		const sections: { key: keyof SectionVisibility; label: string }[] = [
			{ key: "showHeatmap", label: "Activity Heatmap" },
			{ key: "showChart", label: "Progress Chart" },
			{ key: "showStatistics", label: "Statistics" },
			{ key: "showStreaks", label: "Streaks" }
		];

		sections.forEach(section => {
			const toggleRow = createDiv({ cls: "settings-panel-toggle-row" });

			const label = createEl("label", {
				cls: "settings-panel-toggle-label",
				text: section.label
			});
			toggleRow.appendChild(label);

			const toggle = createEl("input", {
				cls: "settings-panel-toggle-checkbox",
				type: "checkbox"
			});
			toggle.checked = this.props.settings.sectionVisibility[section.key];

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

	private togglePanel(): void {
		const panel = document.getElementById("settings-dropdown");
		if (panel) {
			panel.style.display = this.isOpen ? "block" : "none";
		}
	}

	private createEyeIcon(): SVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "16");
		svg.setAttribute("height", "16");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z");

		const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("cx", "12");
		circle.setAttribute("cy", "12");
		circle.setAttribute("r", "3");

		svg.appendChild(path);
		svg.appendChild(circle);

		return svg;
	}
}
