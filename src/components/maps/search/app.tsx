// import React, { useState } from "react";
// import { createRoot } from "react-dom/client";
// import { APIProvider, ControlPosition, Map } from "@vis.gl/react-google-maps";
// import { CustomMapControl } from "./map-control";
// import MapHandler from "./map-handler";

// const API_KEY = "vong cong";

// export type AutocompleteMode = { id: string; label: string };

// const MapApp = () => {
//   const [selectedPlace, setSelectedPlace] =
//     useState<google.maps.places.PlaceResult | null>(null);

//   return (
//     <APIProvider apiKey={API_KEY}>
//       <Map
//         defaultZoom={3}
//         defaultCenter={{ lat: 22.54992, lng: 0 }}
//         gestureHandling={"greedy"}
//         disableDefaultUI={true}
//       />

//       <CustomMapControl
//         controlPosition={ControlPosition.TOP}
//         onPlaceSelect={setSelectedPlace}
//       />

//       <MapHandler place={selectedPlace} />
//     </APIProvider>
//   );
// };

// export default MapApp;
