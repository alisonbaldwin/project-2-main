
const searchInput = document.getElementById("searchInput");
const qualityFilter = document.getElementById("qualityFilter");
const cityCards = document.querySelectorAll(".city-card");
const stationCount = document.getElementById("stationCount");
const noResultsMessage = document.getElementById("noResultsMessage");

// distribution elements
const excellentCount = document.getElementById("excellentCount");
const goodCount = document.getElementById("goodCount");
const fairCount = document.getElementById("fairCount");
const poorCount = document.getElementById("poorCount");
const veryPoorCount = document.getElementById("veryPoorCount");

const excellentBar = document.getElementById("excellentBar");
const goodBar = document.getElementById("goodBar");
const fairBar = document.getElementById("fairBar");
const poorBar = document.getElementById("poorBar");
const veryPoorBar = document.getElementById("veryPoorBar");

function updateDistribution(visibleCards) {
  const total = visibleCards.length;

  let excellent = 0;
  let good = 0;
  let fair = 0;
  let poor = 0;
  let veryPoor = 0;

  visibleCards.forEach((card) => {
    const quality = card.dataset.quality.toLowerCase();

    if (quality === "excellent") excellent++;
    else if (quality === "good") good++;
    else if (quality === "fair") fair++;
    else if (quality === "poor") poor++;
    else if (quality === "very poor") veryPoor++;
  });

  const getPercent = (count) => total > 0 ? ((count / total) * 100).toFixed(0) : 0;

  excellentCount.textContent = `${excellent} (${getPercent(excellent)}%)`;
  goodCount.textContent = `${good} (${getPercent(good)}%)`;
  fairCount.textContent = `${fair} (${getPercent(fair)}%)`;
  poorCount.textContent = `${poor} (${getPercent(poor)}%)`;
  veryPoorCount.textContent = `${veryPoor} (${getPercent(veryPoor)}%)`;

  excellentBar.style.width = `${getPercent(excellent)}%`;
  goodBar.style.width = `${getPercent(good)}%`;
  fairBar.style.width = `${getPercent(fair)}%`;
  poorBar.style.width = `${getPercent(poor)}%`;
  veryPoorBar.style.width = `${getPercent(veryPoor)}%`;
}

// leaflet //
const map = L.map('map').setView([42.0, -93.5], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function buildPopup(row) {
  return `
    <strong>${row.nickname || row.uid}</strong><br>
    ${row.river || "Unknown river"}<br><br>

    <strong>Nitrate:</strong> ${row.avg_nitrate_con ?? "—"}<br>
  `;
}

function getMarkerColor(row) {
  const n = row.avg_nitrate_con;

  if (n > 10) return "#d73027";      // high nitrate
  if (n > 5) return "#fc8d59";       // medium
  return "#1a9850";                  // low
}
// drainage bounds in WGS84
const drainageBounds = [
  [40.327722924, -96.647446502],   // Ymin, Xmin
  [43.587264673, -90.015945687]    // Ymax, Xmax
];

// drainage map overlay
L.imageOverlay('data/drainage.png', drainageBounds, {
  opacity: 0.7
}).addTo(map);

// zoom to the drainage raster
map.fitBounds(drainageBounds);
Papa.parse("data/IWQIS_march10merge.csv", {
  download: true,
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  transformHeader: h => h.trim(),
  complete: function(results) {
    const rows = results.data;

    rows.forEach(row => {
      const lat = parseFloat(row.latitude);
      const lon = parseFloat(row.longitude);

      if (isNaN(lat) || isNaN(lon)) return;

      L.circleMarker([lat, lon], {
        radius: 7,
        color: getMarkerColor(row),
        weight: 2,
        fillOpacity: 0.85
      })
      .bindPopup(buildPopup(row))
      .addTo(map);
    });
  }
});


cityCards.forEach(card => {
  card.style.display = "block";
});
stationCount.textContent = `${cityCards.length} of ${cityCards.length} stations`;
noResultsMessage.style.display = "none";
updateDistribution(cityCards);

  stationCount.textContent = `${visibleCount} of ${cityCards.length} stations`;
  noResultsMessage.style.display = visibleCount === 0 ? "block" : "none";

  updateDistribution(visibleCards);


searchInput.addEventListener("input", filterStations);
qualityFilter.addEventListener("change", filterStations);

filterStations();