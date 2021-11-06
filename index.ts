import "leaflet/dist/leaflet.css";
import "spectre.css/dist/spectre.min.css";
import { interpret } from "xstate";
import { render } from "lit-html";
import { editorMachine } from "./src/editor";
import { ChooseGpx } from "./src/components/ChooseGpx";
import { EditorUI } from "./src/components/EditorUI";
import { Export } from "./src/components/Export";

const contentEl = document.querySelector(".content") as HTMLElement;
const machine = interpret(editorMachine);

machine
  .onTransition((ev) => {
    switch (ev.value) {
      case "choose-gpx":
        const onFileSelected = (file: File) =>
          machine.send({ type: "FILE_SELECTED", file });
        const onDemoSelected = () => machine.send({ type: "DEMO_SELECTED" });
        return render(ChooseGpx({ onFileSelected, onDemoSelected }), contentEl);
      case "display-gpx":
        const removePoint = () =>
          machine.send({
            type: "POINT_REMOVED",
            point: ev.context.currentPoint,
          });
        const goToExport = () => machine.send({ type: "GO_TO_EXPORT" });

        const toggleMarkers = () => machine.send({ type: "TOGGLE_MARKERS" });
        return render(
          EditorUI({
            file: ev.context.file,
            selectedPoint: ev.context.currentPoint,
            removePoint,
            showMarkers: ev.context.showMarkers,
            toggleMarkers,
            goToExport,
          }),
          contentEl
        );
      case "display-export":
        const onCancel = () => {
          machine.send({ type: "EXPORT_CANCEL" });
        };
        const onExported = () => machine.send({ type: "EXPORT_DONE" });
        return render(
          Export({
            file: ev.context.file,
            onCancel,
            onExported,
          }),
          contentEl
        );
    }
  })
  .start();

// Add Drag & Drop
document.body.addEventListener("dragover", (event) => {
  event.preventDefault();
  document.body.classList.add("dragging");
});
document.body.addEventListener("dragleave", (event) => {
  event.preventDefault();
  document.body.classList.remove("dragging");
});
document.body.addEventListener("drop", (event) => {
  event.preventDefault();
  document.body.classList.remove("dragging");
  machine.send({
    type: "FILE_SELECTED",
    file: (event as DragEvent).dataTransfer.files[0],
  });
});
