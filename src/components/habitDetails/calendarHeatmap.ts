import { HTMLElementComponent } from "../htmlElementComponent";
import { CalendarHeatmapProps, HeatmapSettings, ColorScaleMode } from "../../types/habitDetailsTypes";
import {
	CalendarDateAdapter,
	getCalendarAdapter,
	parseLocalISODate,
	toLocalISODate,
	YearHeatmapLayout
} from "../../utils/calendarAdapter";
import { ReportCalendar, WeekStartDay } from "../../types/habitTypes";

/**
 * CalendarHeatmap — GitHub-style yearly activity grid.
 * Columns = weeks, rows = days of week (order depends on weekStartDay).
 * Year bounds come from the calendar adapter (Jan–Dec or Farvardin–Esfand).
 */
export class CalendarHeatmap extends HTMLElementComponent {
	private props: CalendarHeatmapProps;
	private settings: HeatmapSettings;
	private isMenuOpen: boolean = false;
	private heatmapContainer?: HTMLElement;
	private gridBlock?: HTMLElement;
	private legendElement?: HTMLElement;

	constructor(props: CalendarHeatmapProps) {
		super();
		this.props = props;
		this.settings = props.heatmapSettings || this.getDefaultSettings();
	}

	private getThemeColor(): string {
		return this.props.theme?.primary || "var(--interactive-accent)";
	}

	private getDefaultSettings(): HeatmapSettings {
		return {
			weekStartDay: WeekStartDay.SUNDAY,
			showMonthLabels: false,
			colorScaleMode: ColorScaleMode.AUTOMATIC,
			colorScaleMin: 0,
			colorScaleMax: 60
		};
	}

	private getWeekStartDay(): WeekStartDay {
		return this.settings.weekStartDay ?? WeekStartDay.SUNDAY;
	}

	private adjustColorLightness(color: string, lightnessFactor: number): string {
		// Convert hex to RGB
		let r: number, g: number, b: number;
		
		if (color.startsWith("#")) {
			r = parseInt(color.slice(1, 3), 16);
			g = parseInt(color.slice(3, 5), 16);
			b = parseInt(color.slice(5, 7), 16);
		} else if (color.startsWith("rgb(")) {
			const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
			if (match) {
				r = parseInt(match[1]);
				g = parseInt(match[2]);
				b = parseInt(match[3]);
			} else {
				return color;
			}
		} else {
			// For CSS variables, return as-is
			return color;
		}

		// Convert RGB to HSL
		const rNorm = r / 255;
		const gNorm = g / 255;
		const bNorm = b / 255;

		const max = Math.max(rNorm, gNorm, bNorm);
		const min = Math.min(rNorm, gNorm, bNorm);
		let h = 0, s = 0, l = (max + min) / 2;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			
			switch (max) {
				case rNorm:
					h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
					break;
				case gNorm:
					h = ((bNorm - rNorm) / d + 2) / 6;
					break;
				case bNorm:
					h = ((rNorm - gNorm) / d + 4) / 6;
					break;
			}
		}

		// Adjust lightness: lightnessFactor 0 = lightest, 1 = darkest
		// We want lower values to be lighter, higher values to be darker
		// So higher lightnessFactor = lower lightness value = darker color
		// Interpolate between light (0.9) and dark (0.3)
		const adjustedL = 0.9 - lightnessFactor * 0.6;

		// Convert HSL back to RGB
		const q = adjustedL < 0.5 ? adjustedL * (1 + s) : adjustedL + s - adjustedL * s;
		const p = 2 * adjustedL - q;

		const rNew = Math.round(this.hueToRgb(p, q, h + 1/3) * 255);
		const gNew = Math.round(this.hueToRgb(p, q, h) * 255);
		const bNew = Math.round(this.hueToRgb(p, q, h - 1/3) * 255);

		return `rgb(${rNew}, ${gNew}, ${bNew})`;
	}

	private hueToRgb(p: number, q: number, t: number): number {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1/6) return p + (q - p) * 6 * t;
		if (t < 1/2) return q;
		if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		return p;
	}

	render(): HTMLElement {
		const container = document.createElement("div");
		container.className = "calendar-heatmap";
		// Container styling is handled by CSS

		// Header with title and menu button
		const header = this.createHeader();
		container.appendChild(header);

		// Create heatmap container
		this.heatmapContainer = document.createElement("div");
		this.heatmapContainer.className = "heatmap-container";
		// Heatmap container styling is handled by CSS

		this.updateHeatmapContent();
		container.appendChild(this.heatmapContainer);

		// Close menu when clicking outside
		document.addEventListener("click", (e) => {
			if (this.isMenuOpen && !container.contains(e.target as Node)) {
				this.isMenuOpen = false;
				this.toggleMenu();
			}
		});

		return container;
	}

	private createHeader(): HTMLElement {
		const header = document.createElement("div");
		header.className = "heatmap-header";

		const adapter = getCalendarAdapter(
			this.props.reportCalendar || ReportCalendar.GREGORIAN
		);
		const year = this.props.year ?? adapter.getCurrentYear();

		const title = document.createElement("h3");
		title.textContent = `Activity Heatmap`;
		title.className = "heatmap-title";
		header.appendChild(title);

		// Menu button
		const menuButton = document.createElement("button");
		menuButton.type = "button";
		menuButton.title = "Heatmap Settings";
		menuButton.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="1"></circle>
				<circle cx="12" cy="5" r="1"></circle>
				<circle cx="12" cy="19" r="1"></circle>
			</svg>
		`;
		menuButton.className = "heatmap-menu-button";
		// Hover states are handled by CSS

		menuButton.addEventListener("click", (e) => {
			e.stopPropagation();
			this.isMenuOpen = !this.isMenuOpen;
			this.toggleMenu();
		});

		header.appendChild(menuButton);

		// Settings dropdown
		const menuDropdown = this.createSettingsMenu();
		header.appendChild(menuDropdown);

		return header;
	}

	private createSettingsMenu(): HTMLElement {
		const menu = document.createElement("div");
		menu.className = "heatmap-settings-menu";
		menu.id = "heatmap-settings-menu";
		// Menu styling is handled by CSS

		// Week start day setting
		const weekStartLabel = document.createElement("label");
		weekStartLabel.textContent = "Week start day";
		weekStartLabel.className = "heatmap-settings-label";
		menu.appendChild(weekStartLabel);

		const weekStartSelect = document.createElement("select");
		weekStartSelect.className = "heatmap-settings-select";

		[WeekStartDay.SUNDAY, WeekStartDay.MONDAY, WeekStartDay.SATURDAY].forEach(day => {
			const option = document.createElement("option");
			option.value = String(day);
			option.textContent = day === WeekStartDay.SUNDAY ? "Sunday" : day === WeekStartDay.MONDAY ? "Monday" : "Saturday";
			option.selected = this.settings.weekStartDay === day;
			weekStartSelect.appendChild(option);
		});

		weekStartSelect.addEventListener("change", () => {
			this.settings.weekStartDay = Number(weekStartSelect.value) as WeekStartDay;
			this.notifySettingsChange();
			this.updateHeatmapContent();
		});

		menu.appendChild(weekStartSelect);

		// Month labels setting
		const monthLabelsContainer = document.createElement("div");
		monthLabelsContainer.className = "heatmap-settings-row";

		const monthLabelsLabel = document.createElement("label");
		monthLabelsLabel.textContent = "Show month labels";
		monthLabelsLabel.className = "heatmap-settings-label-inline";

		const monthLabelsToggle = document.createElement("input");
		monthLabelsToggle.type = "checkbox";
		monthLabelsToggle.checked = this.settings.showMonthLabels ?? false;
		monthLabelsToggle.className = "heatmap-settings-checkbox";

		monthLabelsToggle.addEventListener("change", () => {
			this.settings.showMonthLabels = monthLabelsToggle.checked;
			this.notifySettingsChange();
			this.updateHeatmapContent();
		});

		monthLabelsContainer.appendChild(monthLabelsLabel);
		monthLabelsContainer.appendChild(monthLabelsToggle);
		menu.appendChild(monthLabelsContainer);

		// Color scale mode setting
		const colorScaleLabel = document.createElement("label");
		colorScaleLabel.textContent = "Color scale mode";
		colorScaleLabel.className = "heatmap-settings-label";
		menu.appendChild(colorScaleLabel);

		const colorScaleContainer = document.createElement("div");
		colorScaleContainer.className = "heatmap-settings-column";

		[ColorScaleMode.AUTOMATIC, ColorScaleMode.MANUAL].forEach(mode => {
			const radioContainer = document.createElement("div");
			radioContainer.className = "heatmap-settings-radio-row";

			const radio = document.createElement("input");
			radio.type = "radio";
			radio.name = "colorScaleMode";
			radio.value = mode;
			radio.checked = this.settings.colorScaleMode === mode;
			radio.className = "heatmap-settings-radio";

			radio.addEventListener("change", () => {
				this.settings.colorScaleMode = mode as ColorScaleMode;
				this.notifySettingsChange();
				this.updateHeatmapContent();
				this.updateManualFieldsVisibility();
			});

			const label = document.createElement("label");
			label.textContent = mode === ColorScaleMode.AUTOMATIC ? "Automatic" : "Manual";
			label.className = "heatmap-settings-radio-label";

			radioContainer.appendChild(radio);
			radioContainer.appendChild(label);
			colorScaleContainer.appendChild(radioContainer);
		});

		menu.appendChild(colorScaleContainer);

		// Manual scale fields (shown only when manual mode is selected)
		const manualFieldsContainer = document.createElement("div");
		manualFieldsContainer.id = "manual-scale-fields";
		manualFieldsContainer.className = "heatmap-settings-manual-fields";
		if (this.settings.colorScaleMode !== ColorScaleMode.MANUAL) {
			manualFieldsContainer.style.display = "none";
		}

		// Minimum value field
		const minFieldContainer = document.createElement("div");
		minFieldContainer.className = "heatmap-settings-field-group";

		const minLabel = document.createElement("label");
		minLabel.textContent = "Minimum value";
		minLabel.className = "heatmap-settings-label-inline";

		const minInput = document.createElement("input");
		minInput.type = "number";
		minInput.value = String(this.settings.colorScaleMin ?? 0);
		minInput.className = "heatmap-settings-input";

		minInput.addEventListener("change", () => {
			this.settings.colorScaleMin = parseFloat(minInput.value) || 0;
			this.notifySettingsChange();
			this.updateHeatmapContent();
		});

		minFieldContainer.appendChild(minLabel);
		minFieldContainer.appendChild(minInput);
		manualFieldsContainer.appendChild(minFieldContainer);

		// Maximum value field
		const maxFieldContainer = document.createElement("div");
		maxFieldContainer.className = "heatmap-settings-field-group";

		const maxLabel = document.createElement("label");
		maxLabel.textContent = "Maximum value";
		maxLabel.className = "heatmap-settings-label-inline";

		const maxInput = document.createElement("input");
		maxInput.type = "number";
		maxInput.value = String(this.settings.colorScaleMax ?? 60);
		maxInput.className = "heatmap-settings-input";

		maxInput.addEventListener("change", () => {
			this.settings.colorScaleMax = parseFloat(maxInput.value) || 60;
			this.notifySettingsChange();
			this.updateHeatmapContent();
		});

		maxFieldContainer.appendChild(maxLabel);
		maxFieldContainer.appendChild(maxInput);
		manualFieldsContainer.appendChild(maxFieldContainer);

		menu.appendChild(manualFieldsContainer);

		// Hide color scale settings for boolean habits
		if (this.props.habitType === "boolean") {
			colorScaleLabel.style.display = "none";
			colorScaleContainer.style.display = "none";
			manualFieldsContainer.style.display = "none";
		}

		return menu;
	}

	private toggleMenu(): void {
		const menu = document.getElementById("heatmap-settings-menu");
		if (menu) {
			menu.style.display = this.isMenuOpen ? "block" : "none";
		}
	}

	private updateManualFieldsVisibility(): void {
		const manualFields = document.getElementById("manual-scale-fields");
		if (manualFields) {
			manualFields.style.display = this.settings.colorScaleMode === ColorScaleMode.MANUAL ? "block" : "none";
		}
	}

	private updateHeatmapContent(): void {
		if (!this.heatmapContainer) return;

		this.heatmapContainer.empty();

		const adapter = getCalendarAdapter(
			this.props.reportCalendar || ReportCalendar.GREGORIAN
		);
		const year = this.props.year ?? adapter.getCurrentYear();
		const weekStartDay = this.getWeekStartDay();
		const layout = adapter.buildYearHeatmapLayout(year, weekStartDay);

		this.gridBlock = document.createElement("div");
		this.gridBlock.className = "heatmap-grid-block";

		if (this.settings.showMonthLabels) {
			this.gridBlock.appendChild(
				this.createMonthLabelsRow(layout.monthLabels, layout.weeksCount)
			);
		}

		this.gridBlock.appendChild(this.createHeatmapGrid(adapter, layout));
		this.heatmapContainer.appendChild(this.gridBlock);

		this.legendElement = this.createLegend();
		this.heatmapContainer.appendChild(this.legendElement);
	}

	private notifySettingsChange(): void {
		if (this.props.onHeatmapSettingsChange) {
			this.props.onHeatmapSettingsChange(this.settings);
		}
	}

	private createMonthLabelsRow(
		monthLabels: { weekIndex: number; label: string }[],
		weeksCount: number
	): HTMLElement {
		const cellSize = 10;
		const gap = 2;
		const row = document.createElement("div");
		row.className = "heatmap-month-labels";
		row.style.width = `${weeksCount * cellSize + Math.max(0, weeksCount - 1) * gap}px`;
		// Other styles handled by CSS

		for (const label of monthLabels) {
			const el = document.createElement("span");
			el.textContent = label.label;
			el.style.left = `${label.weekIndex * (cellSize + gap)}px`;
			// Other styles handled by CSS
			row.appendChild(el);
		}

		return row;
	}

	private buildValueMap(): Map<string, number> {
		const valueMap = new Map<string, number>();
		
		// Determine scale based on mode
		let minScale = 0;
		let maxScale = 1;
		
		if (this.settings.colorScaleMode === ColorScaleMode.MANUAL) {
			minScale = this.settings.colorScaleMin ?? 0;
			maxScale = this.settings.colorScaleMax ?? 60;
		} else {
			// Automatic mode: use actual data range
			const numericValues = this.props.values
				.map((v) => typeof v.value === "number" ? v.value : 0)
				.filter(v => v > 0);
			maxScale = Math.max(...numericValues, 1);
		}

		this.props.values.forEach((entry) => {
			const dateKey = toLocalISODate(entry.date);
			if (this.props.habitType === "boolean") {
				valueMap.set(dateKey, entry.value === true ? 1 : 0);
			} else {
				const numValue = entry.value as number;
				// Normalize to 0-1 range based on scale
				const normalized = (numValue - minScale) / (maxScale - minScale);
				valueMap.set(dateKey, Math.max(0, Math.min(1, normalized)));
			}
		});

		return valueMap;
	}

	private intensityColor(value: number, themeColor: string): string {
		if (value <= 0) {
			return "var(--background-modifier-border)";
		}
		// For boolean habits, use base theme color to match legend
		if (this.props.habitType === "boolean") {
			return themeColor;
		}
		if (value <= 0.25) {
			return this.adjustColorLightness(themeColor, 0.25);
		}
		if (value <= 0.5) {
			return this.adjustColorLightness(themeColor, 0.5);
		}
		if (value <= 0.75) {
			return this.adjustColorLightness(themeColor, 0.75);
		}
		return this.adjustColorLightness(themeColor, 1.0);
	}

	private formatTooltip(
		isoDate: string,
		value: number,
		adapter: CalendarDateAdapter
	): string {
		const displayDate = adapter.formatDisplayDate(parseLocalISODate(isoDate));
		if (this.props.habitType === "boolean") {
			return `${displayDate}: ${value > 0 ? "Completed" : "Not completed"}`;
		}
		const raw = this.props.values.find(
			(v) => toLocalISODate(v.date) === isoDate
		)?.value;
		return `${displayDate}: ${raw ?? 0}`;
	}

	private createHeatmapGrid(
		adapter: CalendarDateAdapter,
		layout: YearHeatmapLayout
	): HTMLElement {
		const { cells, weeksCount } = layout;
		const valueMap = this.buildValueMap();
		const themeColor = this.getThemeColor();

		const grid = document.createElement("div");
		grid.className = "heatmap-grid";
		grid.setAttribute("data-weeks", String(weeksCount));
		grid.setAttribute("data-week-start", String(this.getWeekStartDay()));

		for (const cellData of cells) {
			const cell = document.createElement("div");

			if (cellData.isEmpty || !cellData.isoDate) {
				cell.className = "heatmap-cell heatmap-cell-empty";
				grid.appendChild(cell);
				continue;
			}

			const value = valueMap.get(cellData.isoDate) || 0;
			cell.className = "heatmap-cell";
			cell.style.backgroundColor = this.intensityColor(value, themeColor);
			cell.title = this.formatTooltip(cellData.isoDate, value, adapter);
			grid.appendChild(cell);
		}

		return grid;
	}

	private createLegend(): HTMLElement {
		const legend = document.createElement("div");
		legend.className = "heatmap-legend";

		if (this.props.habitType === "boolean") {
			const legendItems = [
				{ label: "Done", color: this.getThemeColor(), filled: true },
				{ label: "Not done", color: "transparent", filled: false }
			];

			legendItems.forEach((item) => {
				const legendItem = document.createElement("div");
				legendItem.className = "heatmap-legend-item";

				const square = document.createElement("div");
				square.className = "heatmap-legend-square";
				square.style.backgroundColor = item.color;

				const label = document.createElement("span");
				label.textContent = item.label;
				legendItem.appendChild(square);
				legendItem.appendChild(label);
				legend.appendChild(legendItem);
			});

			return legend;
		}

		const themeColor = this.getThemeColor();
		let legendColors;

		if (this.settings.colorScaleMode === ColorScaleMode.MANUAL) {
			// Dynamic labels based on manual min/max
			const min = this.settings.colorScaleMin ?? 0;
			const max = this.settings.colorScaleMax ?? 60;
			const range = max - min;
			const step = range / 4;

			legendColors = [
				{ color: "var(--background-modifier-border)", label: `${min}` },
				{ color: this.adjustColorLightness(themeColor, 0.25), label: `${Math.round(min + step * 1)}-${Math.round(min + step * 2)}` },
				{ color: this.adjustColorLightness(themeColor, 0.5), label: `${Math.round(min + step * 2)}-${Math.round(min + step * 3)}` },
				{ color: this.adjustColorLightness(themeColor, 0.75), label: `${Math.round(min + step * 3)}-${Math.round(min + step * 4)}` },
				{ color: this.adjustColorLightness(themeColor, 1.0), label: `${Math.round(min + step * 4)}+` }
			];
		} else {
			// Percentage labels for automatic mode
			legendColors = [
				{ color: "var(--background-modifier-border)", label: "0" },
				{ color: this.adjustColorLightness(themeColor, 0.25), label: "1-25%" },
				{ color: this.adjustColorLightness(themeColor, 0.5), label: "26-50%" },
				{ color: this.adjustColorLightness(themeColor, 0.75), label: "51-75%" },
				{ color: this.adjustColorLightness(themeColor, 1.0), label: "76-100%" }
			];
		}

		const legendLabel = document.createElement("span");
		legendLabel.textContent = "Less";
		legend.appendChild(legendLabel);

		legendColors.forEach((item) => {
			const legendItem = document.createElement("div");
			legendItem.className = "heatmap-legend-color-box";
			legendItem.style.backgroundColor = item.color;
			legendItem.title = item.label;
			legend.appendChild(legendItem);
		});

		const moreLabel = document.createElement("span");
		moreLabel.textContent = "More";
		legend.appendChild(moreLabel);

		return legend;
	}
}
