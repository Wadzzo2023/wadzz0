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

  // Build the iframe URL with creator parameters
  let iframeUrl = baseUrl + "/embed";

  // Get all creator IDs from the query parameters
  const creators = queryParams.getAll("creators[]");
  console.log("Creators:", creators);

  if (creators && creators.length > 0) {
    // Add creators as query parameters to the iframe URL
    iframeUrl +=
      "?" +
      creators.map((id) => `creators[]=${encodeURIComponent(id)}`).join("&");
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
