import Leaflet from "leaflet";

// <HACK>
// Leaflet icons won't load if they're not required by parcel
// source: https://github.com/parcel-bundler/parcel/issues/973
delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
Leaflet.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});
// </HACK>

/**
 * Initializes the Leaflet SDK and the map
 * @returns A map object
 */
export function initializeMap() {
  // <HACK>
  // There were issues with live-reload, this piece of code fixes that
  // source: https://github.com/Leaflet/Leaflet/issues/3962#issuecomment-384510881
  const container = Leaflet.DomUtil.get("map");
  if (container != null) {
    (container as any)._leaflet_id = null;
  }
  // </HACK>
  const map = Leaflet.map("map", {
    zoomControl: false,
  }).setView([52.5170365, 13.3888599], 9);

  // Move zoom control to bottom left
  Leaflet.control
    .zoom({
      position: "bottomleft",
    })
    .addTo(map);

  Leaflet.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: "janmon/cjwaimr6k01ca1cpgdyvhxtw5",
      tileSize: 512,
      zoomOffset: -1,
      accessToken:
        "pk.eyJ1IjoiamFubW9uIiwiYSI6ImNqd2FpbTMxMDBhZW40Mm4wb2N3Y3VnOGQifQ.RXdUIfQZClsirdK7eDKMoQ",
    }
  ).addTo(map);

  return Promise.resolve(map);
}
