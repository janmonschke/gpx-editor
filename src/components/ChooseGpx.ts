import "./ChooseGpx.css";
import { html } from "lit-html";

type Props = {
  onFileSelected: (file: File) => void;
};

export const ChooseGpx = (props: Props) => html` <div
  class="modal modal-sm active chooseGpx"
>
  <div class="modal-overlay"></div>
  <div class="modal-container">
    <div class="modal-body">
      <h3 class="text-center">Select or drop a file</h3>
      <form>
        <label class="btn btn-primary p-centered">
          <input
            class="chooseGpx__fileInput"
            type="file"
            @change=${(event: Event) =>
              props.onFileSelected(
                (event.currentTarget as HTMLInputElement).files[0]
              )}
          />
          Select GPX file
        </label>
      </form>
    </div>
  </div>
</div>`;
