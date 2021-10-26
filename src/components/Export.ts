import { html } from "lit-html";
import { ExportOptions, ParsedFile, saveFile } from "../file";

type Props = {
  file: ParsedFile;
  onCancel: () => void;
  onExported: () => void;
};

function submitForm(event: SubmitEvent, props: Props) {
  event.preventDefault();
  const formData = new FormData(event.target as HTMLFormElement);

  const options: ExportOptions = {
    fileName: formData.get("fileName").toString(),
    omitElevation: formData.get("omitElevation").toString() === "on",
  };
  saveFile(props.file, options);
  props.onExported();
}

export const Export = (props: Props) => html` <div class="modal active">
  <div class="modal-overlay" @click=${() => props.onCancel()}></div>
  <div class="modal-container">
    <form @submit=${(event) => submitForm(event, props)}>
      <div class="modal-body">
        <h4 class="text-center">Export</h4>
        <div class="form-group">
          <label class="form-label" for="filename">Filename</label>
          <input
            value=${props.file.meta.fileName || "export.gpx"}
            type="text"
            name="fileName"
            id="fileName"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-checkbox">
            <input type="checkbox" name="omitElevation" checked />
            <i class="form-icon"></i> Omit elevation values
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <input class="btn btn-primary" type="submit" value="Export file" />
        <button class="btn btn-link" @click=${() => props.onCancel()}>
          Close
        </button>
      </div>
    </form>
  </div>
</div>`;
