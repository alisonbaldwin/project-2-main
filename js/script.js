const usgs_url = 
  "https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=IA&parameterCd=00300,63680,00095,00400&period=P1D"

async function fetchusgsURL() {
  const response = await fetch(usgs_url);
  const data = await response.json();
  return data.value.timeSeries;
}

function stationGrouping(timeSeries) {
  const stations = {};

  timeSeries.forEach(series => {
    const site = series.sourceInfo.siteCode[0].value;
    const param = series.variable.variableCode[0].value;
    const latest = getLatestValue(series);

    if (!stations[site]) {
      stations[site] = {
        siteName: series.sourceInfo.siteName,
        coords: series.sourceInfo.geoLocation.geogLocation,
        parameters: {}
      };
    }

    stations[site].parameters[param] = latest;
  });

  return stations;
}

function createStationCard(stationID, station) {
  const card = document.createElement("div");
  card.classList.add("city-card")

  const quality = classifyStation(station.parameters);

  card.dataset.name = station.siteName;
  card.dataset.location = `${station.coords.latitude}, ${station.coords.longitude}`;
  card.dataset.quality = quality;
}


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

// Iowa markers
L.marker([41.5868, -93.6250]).addTo(map).bindPopup("Des Moines River");
L.marker([41.9779, -91.6656]).addTo(map).bindPopup("Cedar River");
L.marker([41.6611, -91.5302]).addTo(map).bindPopup("Iowa River");
L.marker([42.4999, -96.4003]).addTo(map).bindPopup("Missouri Tributary");

function filterStations() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const selectedQuality = qualityFilter.value.toLowerCase();

  let visibleCount = 0;
  const visibleCards = [];

  cityCards.forEach((card) => {
    const name = card.dataset.name.toLowerCase();
    const location = card.dataset.location.toLowerCase();
    const quality = card.dataset.quality.toLowerCase();

    const matchesSearch =
      name.includes(searchValue) || location.includes(searchValue);

    const matchesQuality =
      selectedQuality === "all" || quality === selectedQuality;

    if (matchesSearch && matchesQuality) {
      card.style.display = "block";
      visibleCount++;
      visibleCards.push(card);
    } else {
      card.style.display = "none";
    }
  });

  stationCount.textContent = `${visibleCount} of ${cityCards.length} stations`;
  noResultsMessage.style.display = visibleCount === 0 ? "block" : "none";

  updateDistribution(visibleCards);
}

searchInput.addEventListener("input", filterStations);
qualityFilter.addEventListener("change", filterStations);

filterStations();