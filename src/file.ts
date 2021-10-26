import { saveAs } from "file-saver";
import Leaflet from "leaflet";

export type FileMeta = {
  time?: string;
  fileName?: string;
};

export type Point = {
  latLng: Leaflet.LatLngLiteral;
  elevation?: number;
  time: Date;
  timeString: string;
  marker: Leaflet.Marker;
};

export type ParsedFile = {
  meta: FileMeta;
  points: Point[];
};

/**
 * Parses points from a GPX document
 * @param gpx The GPX document to parse
 * @returns A points array
 */
export function parseFileFromGPX(
  gpxDoc: Document,
  meta: FileMeta = {}
): ParsedFile {
  // Parse the root's <time/> value if present
  gpxDoc.getElementsByTagName("gpx")[0].childNodes.forEach((child) => {
    if (child.nodeName === "time") {
      meta.time = child.textContent;
    }
  });
  // Parse the points
  const pointElements = gpxDoc.getElementsByTagName("trkpt");
  const points = Array.from(pointElements).map<Point>((curr) => {
    const elevationEl = curr.getElementsByTagName("ele")[0];
    const elevation = elevationEl
      ? parseFloat(elevationEl.textContent)
      : undefined;
    const timeString = curr.getElementsByTagName("time")[0].textContent;
    const time = new Date(timeString);
    const lat = parseFloat(curr.getAttribute("lat"));
    const lng = parseFloat(curr.getAttribute("lon"));
    const latLng: Leaflet.LatLngLiteral = {
      lat,
      lng,
    };
    const marker = Leaflet.marker(latLng, {
      draggable: true,
    });
    const point = {
      latLng,
      elevation,
      time,
      timeString,
      marker,
    };
    return point;
  });
  return {
    meta,
    points,
  };
}

/**
 * Parses a file into a XML document
 * @param file The file to parse
 * @returns The XML document
 */
export function parseXMLDocumentFromFile(file: File) {
  return new Promise<Document>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("loadend", () => {
      if (reader.error) {
        reject(reader.error);
      } else {
        try {
          const doc = new DOMParser().parseFromString(
            reader.result as string,
            "text/xml"
          );

          resolve(doc);
        } catch (e) {
          reject(e);
        }
      }
    });

    reader.addEventListener("error", (er) => {
      reject(er);
    });

    reader.readAsText(file);
  });
}

export type ExportOptions = {
  fileName: string;
  omitElevation: boolean;
};

/**
 * @param file File to save
 * @param config Optional
 */
export function saveFile(file: ParsedFile, config: ExportOptions) {
  const sortedPoints = file.points
    .slice()
    .sort((a, b) => a.time.getTime() - b.time.getTime());
  const time = file.meta.time ? `<time>${file.meta.time}</time>` : "";
  const newGPX = `<?xml version="1.0" encoding="UTF-8" ?>
    <gpx version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/0" xsi:schemaLocation="http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd">
      ${time}
      <trk>
        <trkseg>
          ${sortedPoints
            .map((point) => {
              const longLat = point.marker.getLatLng();
              const elevation = `<ele>${point.elevation}</ele>`;
              return `<trkpt lat="${longLat.lat}" lon="${longLat.lng}"><time>${
                point.timeString
              }</time>${config.omitElevation ? "" : elevation}</trkpt>`;
            })
            .join("")}
        </trkseg>
      </trk>
    </gpx>
  `;

  const blob = new Blob([newGPX], {
    type: "text/GPX;charset=utf-8",
  });

  saveAs(blob, config.fileName);
}
