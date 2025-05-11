(function () {
  // Dynamically detect the script's source domain
  const scriptElement = document.currentScript;
  const scriptSrc =
    scriptElement instanceof HTMLScriptElement ? scriptElement.src : "";

  // Extract base URL (remove widget-script.js from the path)
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf("/"));

  // Parse query parameters from the script src
  const queryParams = new URLSearchParams(
    scriptSrc.includes("?") ? scriptSrc.substring(scriptSrc.indexOf("?")) : "",
  );

  // Build the iframe URL with parameters
  let iframeUrl = baseUrl + "/embed";
  const urlParams = new URLSearchParams();

  // Get all creator IDs from the query parameters
  const creators = queryParams.getAll("creators[]");
  console.log("Creators:", creators);

  if (creators && creators.length > 0) {
    creators.forEach((id) => {
      urlParams.append("creators[]", id);
    });
  }

  // Get location parameters
  const lat = queryParams.get("lat");
  const lng = queryParams.get("lng");
  const zoom = queryParams.get("zoom");

  if (lat) urlParams.append("lat", lat);
  if (lng) urlParams.append("lng", lng);
  if (zoom) urlParams.append("zoom", zoom);

  // Add all parameters to the iframe URL
  if (urlParams.toString()) {
    iframeUrl += "?" + urlParams.toString();
  }

  // Create iframe with the correct domain
  const iframe = document.createElement("iframe");
  iframe.src = iframeUrl;
  iframe.style.width = "100%";
  iframe.style.height = "100vh";
  iframe.style.border = "none";

  // Find the map container element, or fall back to inserting before the script
  const mapContainer = document.getElementById("map-container");

  if (mapContainer) {
    // Append the iframe to the map container
    mapContainer.appendChild(iframe);
  } else if (scriptElement && scriptElement.parentNode) {
    // Fallback: insert before the script
    scriptElement.parentNode.insertBefore(iframe, scriptElement);
  }
})();
