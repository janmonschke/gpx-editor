import Leaflet from "leaflet";
import { createMachine, assign } from "xstate";
import { parseXMLDocumentFromFile } from "./file";
import { initializeMap } from "./map";
import { ParsedFile, parseFileFromGPX, Point } from "./file";

type MapEditorEvent =
  | { type: "done.invoke.initializeMap"; data: Leaflet.Map }
  | { type: "FILE_SELECTED"; file: any }
  | { type: "FILE_PARSED"; file: ParsedFile }
  | { type: "POINT_SELECTED"; point?: Point }
  | { type: "POINT_REMOVED"; point: Point }
  | { type: "POINT_UPDATED" }
  | { type: "TOGGLE_MARKERS" }
  | { type: "GO_TO_EXPORT" }
  | { type: "EXPORT_CANCEL" }
  | { type: "EXPORT_DONE" };

interface MapEditorContext {
  map?: Leaflet.Map;
  file?: ParsedFile;
  line?: Leaflet.Polyline;
  currentPoint?: Point;
  showMarkers: boolean;
}

type MapEditorState =
  | {
      value: "idle";
      context: MapEditorContext & {
        map: undefined;
        file: undefined;
        line: undefined;
        currentPoint: undefined;
      };
    }
  | {
      value: "choose-gpx";
      context: MapEditorContext & {
        map: Object;
        file: undefined;
        line: undefined;
        currentPoint: undefined;
      };
    }
  | {
      value: "load-gpx";
      context: MapEditorContext & {
        map: Object;
        file: undefined;
        line: undefined;
        currentPoint: undefined;
      };
    }
  | {
      value: "display-gpx";
      context: MapEditorContext & {
        map: Object;
        file: Object[];
        currentPoint: undefined;
      };
    }
  | {
      value: "display-export";
      context: MapEditorContext & {
        map: Object;
        file: Object[];
      };
    };

export const editorMachine = createMachine<
  MapEditorContext,
  MapEditorEvent,
  MapEditorState
>(
  {
    id: "map-editor",
    initial: "idle",
    context: {
      showMarkers: false,
    },
    states: {
      idle: {
        invoke: {
          src: "initializeMap",
          onDone: { target: "choose-gpx", actions: "assignMap" },
        },
      },
      "choose-gpx": {
        entry: "resetMarkers",
        on: {
          FILE_SELECTED: {
            target: "load-gpx",
          },
        },
      },
      "load-gpx": {
        entry: "resetMarkers",
        invoke: {
          src: "loadPointsFromFile",
        },
        on: {
          FILE_PARSED: {
            target: "display-gpx",
            actions: ["assignFile"],
          },
        },
      },
      "display-gpx": {
        entry: ["syncLine", "syncMarkers", "adjustMapBoundary"],
        invoke: { src: "markerInteraction" },
        on: {
          POINT_SELECTED: {
            actions: "selectPoint",
          },
          POINT_REMOVED: {
            actions: ["removePoint", "syncLine"],
          },
          POINT_UPDATED: {
            actions: "syncLine",
          },
          FILE_SELECTED: {
            target: "load-gpx",
          },
          TOGGLE_MARKERS: {
            actions: ["toggleMarkers", "syncMarkers"],
          },
          GO_TO_EXPORT: {
            target: "display-export",
            actions: "selectPoint",
          },
        },
      },
      "display-export": {
        on: {
          EXPORT_CANCEL: "display-gpx",
          EXPORT_DONE: "display-gpx",
        },
      },
    },
  },
  {
    actions: {
      assignMap: assign({
        map: (ctx, event) => {
          return event.type === "done.invoke.initializeMap"
            ? event.data
            : ctx.map;
        },
      }),
      assignFile: assign({
        file: (ctx, event) =>
          event.type === "FILE_PARSED" ? event.file : ctx.file,
      }),
      syncLine: assign({
        line: (ctx) => {
          if (ctx.file && ctx.map) {
            // remove previous line if any
            ctx.line?.remove();
            const latlngs = ctx.file.points.map((point) =>
              point.marker.getLatLng()
            );
            const line = new Leaflet.Polyline(latlngs);
            line.addTo(ctx.map);
            return line;
          }
          return undefined;
        },
      }),
      toggleMarkers: assign({ showMarkers: (ctx) => !ctx.showMarkers }),
      syncMarkers: (ctx) => {
        if (ctx.showMarkers) {
          if (ctx.map && ctx.file) {
            ctx.file.points.forEach((point) => {
              point.marker.addTo(ctx.map);
            });
          }
        } else {
          ctx.file.points.forEach((point) => point.marker.remove());
        }
      },
      adjustMapBoundary: (ctx) => {
        if (ctx.file && ctx.map) {
          const coordinates: Leaflet.LatLngLiteral[] = [];
          ctx.file.points.forEach((point) => {
            coordinates.push(point.latLng);
          });

          ctx.map.fitBounds(Leaflet.latLngBounds(coordinates), {
            animate: true,
            padding: [100, 100],
          });
        }
      },
      resetMarkers: (ctx) => {
        if (ctx.file) {
          ctx.file.points.forEach((point) => point.marker.remove());
        }
      },
      selectPoint: assign({
        currentPoint: (ctx, event) => {
          // <HACK>
          // Changes the current marker color with a global class
          // source: https://stackoverflow.com/a/61982880
          if (ctx.currentPoint) {
            (ctx.currentPoint.marker as any)._icon.classList.remove(
              "current-point"
            );
          }
          if (event.type === "POINT_SELECTED") {
            (event.point?.marker as any)._icon.classList.add("current-point");
            // </HACK>
            return event.point;
          } else {
            return undefined;
          }
        },
      }),
      removePoint: assign({
        currentPoint: (ctx, event) =>
          event.type === "POINT_REMOVED" && event.point === ctx.currentPoint
            ? undefined
            : ctx.currentPoint,
        file: (ctx, event) => {
          if (event.type === "POINT_REMOVED") {
            event.point.marker.remove();
            return {
              ...ctx.file,
              points: ctx.file.points.filter((point) => point !== event.point),
            };
          }
          return ctx.file;
        },
      }),
    },
    services: {
      loadPointsFromFile: (_, event) => (callback) => {
        if (event.type === "FILE_SELECTED") {
          parseXMLDocumentFromFile(event.file)
            .then((xmlDoc) =>
              parseFileFromGPX(xmlDoc, { fileName: (event.file as File).name })
            )
            .then((file) => callback({ type: "FILE_PARSED", file }));
        }
      },
      markerInteraction: (ctx) => (callback) => {
        if (ctx.file) {
          ctx.file.points.forEach((point) => {
            point.marker.on("dragstart click", () => {
              callback({ type: "POINT_SELECTED", point });
            });

            point.marker.on("dragend", () => {
              callback({ type: "POINT_UPDATED" });
            });
          });
        }
      },
      initializeMap: () => initializeMap(),
    },
  }
);
