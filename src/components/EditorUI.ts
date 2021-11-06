import { html } from "lit-html";
import { ParsedFile, Point } from "../file";
import { format, parseISO } from "date-fns";

import "./EditorUI.css";

type Props = {
  file: ParsedFile;
  selectedPoint?: Point;
  showMarkers: boolean;
  toggleMarkers: () => void;
  removePoint: () => void;
  goToExport: () => void;
};

export const EditorUI = (props: Props) => html`<div class="editorUi">
  <aside class="editorUi__main editorUi__container">
    <div class="mb-2">
      <strong>${props.file.meta.fileName}</strong><br />
      <em
        >${props.file.meta.time &&
        format(parseISO(props.file.meta.time), "MMM do yyyy")}
        - (${props.file.points.length} points)</em
      ><br />
    </div>
    <label class="form-checkbox mb-2">
      <input
        type="checkbox"
        ?checked=${props.showMarkers}
        @change=${() => props.toggleMarkers()}
      />
      <i class="form-icon"></i>
      Show points
    </label>
    <button class="btn btn-primary" @click=${() => props.goToExport()}>
      Export
    </button>
  </aside>
  <div class="editorUi__selectedPoint">
    ${props.selectedPoint ? SelectedPoint(props) : ""}
  </div>
</div>`;

const SelectedPoint = (props: Props) =>
  html`<aside class="editorUi__container">
    <div>Point #${props.file.points.indexOf(props.selectedPoint) + 1}</div>
    ${props.selectedPoint.time &&
    html`<div>${format(props.selectedPoint.time, "HH:ss, MMM do")}</div>`}
    <button class="btn btn-primary" @click=${() => props.removePoint()}>
      Remove point
    </button>
  </aside>`;
