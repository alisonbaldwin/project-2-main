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
const map = L.map("map").setView([42.0, -93.5], 7);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map);


function getMarkerColor(row) {
  const n = row.avg_nitrate_con;

  if (n === null || n === undefined || Number.isNaN(n)) return "#6b7280";
  if (n > 10) return "#d73027"; // high nitrate
  if (n > 5) return "#fc8d59";  // medium
  return "#1a9850";             // low
}

function getQualityLabel(row) {
  const n = row.avg_nitrate_con;

  if (n === null || n === undefined || Number.isNaN(n)) return "unknown";
  if (n > 10) return "very poor";
  if (n > 5) return "poor";
  if (n > 2) return "fair";
  return "good";
}

function updateSelectedStation(row) {
  document.getElementById("selectedName").textContent =
    row.nickname || row.guid || "Unknown Station";

  document.getElementById("selectedLocation").textContent =
    `${row.town || "Unknown"}, ${row.state || ""}`;

 
  document.getElementById("selectedDO").textContent =
    row.avg_diss_oxy_con !== null && row.avg_diss_oxy_con !== undefined
      ? row.avg_diss_oxy_con + " mg/L"
      : "—";

  document.getElementById("selectedPh").textContent =
  row.avg_ph !== null && row.avg_ph !== undefined
    ? row.avg_ph
    : "—";

document.getElementById("selectedTurb").textContent =
  row.avg_turbi_mean !== null && row.avg_turbi_mean !== undefined
    ? row.avg_turbi_mean + " NTU"
    : "—";

  
  const quality = getQualityLabel(row);
  const pill = document.getElementById("selectedQuality");

  pill.textContent = quality;
  pill.className = "pill " + quality.replace(" ", "-");
}
const markerBounds = [];
let selectedMarker = null;
const stationMarkers = [];

function matchesSearch(row, searchTerm) {
  const term = searchTerm.trim().toLowerCase();

  if (!term) return true;

  return (
    (row.nickname || "").toLowerCase().includes(term) ||
    (row.guid || "").toLowerCase().includes(term) ||
    (row.river || "").toLowerCase().includes(term) ||
    (row.town || "").toLowerCase().includes(term) ||
    (row.state || "").toLowerCase().includes(term) ||
    (row.road || "").toLowerCase().includes(term)
  );
}

function matchesQuality(row, selectedQuality) {
  if (!selectedQuality || selectedQuality === "all") return true;
  return getQualityLabel(row) === selectedQuality;
}

function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedQuality = qualityFilter.value.toLowerCase();

  let visibleCount = 0;
  const visibleBounds = [];

  stationMarkers.forEach(({ row, marker }) => {
    const matchesText = matchesSearch(row, searchTerm);
    const matchesLevel = matchesQuality(row, selectedQuality);
    const matches = matchesText && matchesLevel;

    if (matches) {
      if (!map.hasLayer(marker)) {
        marker.addTo(map);
      }
      visibleCount++;
      visibleBounds.push(marker.getLatLng());
    } else {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    }
  });

  if (stationCount) {
    stationCount.textContent = `${visibleCount} stations loaded`;
  }

  applyFilters(); 

  noResultsMessage.style.display = visibleCount === 0 ? "block" : "none";

  if (visibleBounds.length > 0) {
    map.fitBounds(visibleBounds, { padding: [30, 30] });
  }
}

Papa.parse("data/IWQIS_march10merge.csv", {
  download: true,
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  transformHeader: h => h.trim(),
  complete: function(results) {
    const rows = results.data;
    let validCount = 0;
    let firstValidRow = null;

    rows.forEach(row => {
      const lat = parseFloat(row.latitude);
      const lon = parseFloat(row.longitude);

      if (isNaN(lat) || isNaN(lon)) return;
      if (lat === -99 || lon === -99) return;
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

      validCount++;
      if (!firstValidRow) firstValidRow = row;

      const marker = L.circleMarker([lat, lon], {
        radius: 7,
        color: getMarkerColor(row),
        fillColor: getMarkerColor(row),
        weight: 2,
        fillOpacity: 0.85
      })
      .on("click", function() {
        if (selectedMarker) {
          selectedMarker.setStyle({ radius: 7 });
        }

        this.setStyle({ radius: 10 });
        selectedMarker = this;

        updateSelectedStation(row);
      })
      .addTo(map);

      stationMarkers.push({ row, marker });
      markerBounds.push([lat, lon]);
    });

    if (markerBounds.length > 0) {
      map.fitBounds(markerBounds, { padding: [30, 30] });
      map.setMaxBounds(map.getBounds());
    }

    if (firstValidRow) {
      updateSelectedStation(firstValidRow);
    }

    if (stationCount) {
      stationCount.textContent = `${validCount} stations loaded`;
    }
  }
});

searchInput.addEventListener("input", applyFilters);
qualityFilter.addEventListener("change", applyFilters);
cityCards.forEach(card => {
  card.style.display = "block";
});