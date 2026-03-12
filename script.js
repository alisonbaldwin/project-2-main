const searchInput = document.getElementById("searchInput");
const qualityFilter = document.getElementById("qualityFilter");
const cityCards = document.querySelectorAll(".city-card");
const stationCount = document.getElementById("stationCount");
const noResultsMessage = document.getElementById("noResultsMessage");

function filterStations() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const selectedQuality = qualityFilter.value.toLowerCase();

  let visibleCount = 0;

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
    } else {
      card.style.display = "none";
    }
  });

  stationCount.textContent = `${visibleCount} of ${cityCards.length} stations`;
  noResultsMessage.style.display = visibleCount === 0 ? "block" : "none";
}

searchInput.addEventListener("input", filterStations);
qualityFilter.addEventListener("change", filterStations);

filterStations();