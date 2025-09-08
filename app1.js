// Initialize the map
var map = L.map('map', {
    attributionControl: false,
    zoomControl: false,
    minZoom: 2,
    maxBounds: [
        [-90, -180], 
        [90, 180]
    ]
}).setView([-7.2458, 112.7378], 10); // Surabaya, Indonesia

// Define different map themes
var realMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 20
});

var lightMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '© OpenStreetMap contributors, © Carto'
});

var darkMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '© OpenStreetMap contributors, © Carto'
});

var satelliteMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '© OpenStreetMap contributors, SRTM | OpenTopoMap'
});

realMap.addTo(map); // Add the initial map layer

// Add custom zoom control
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// Add layer control to switch between map themes
var baseMaps = {
    "Base Map": realMap,
    "Light Map": lightMap,
    "Dark Map": darkMap,
    "Satellite Map": satelliteMap
};

L.control.layers(baseMaps).addTo(map);

var apiUrl = 'http://localhost/ais_project/get_vessels.php';
var markers = {};
var vesselHistory = {};
var activeFilter = null;
var filterActive = false;

// Function to calculate direction based on course
function calculateDirection(course) {
    if (course >= 0 && course < 45) return "North";
    if (course >= 45 && course < 135) return "East";
    if (course >= 135 && course < 225) return "South";
    if (course >= 225 && course < 315) return "West";
    return "North";
}

function lihatHistori(mmsi) {
    window.location.href = `http://localhost/ais_project/history.html?mmsi=${encodeURIComponent(mmsi)}`;
}

// Safe display for null values
function safeText(value) {
    return (value === null || value === undefined || value === '' || value === 'null') ? '-' : value;
}

// Main function to update vessels on map with filter support
function updateVesselsOnMap(vesselList) {
    // 1. Filter vessels jika perlu
    const vesselsToShow = filterActive 
        ? vesselList.filter(vessel => filterVessel(vessel)) 
        : vesselList;
    
    // 2. Buat Set untuk pencarian lebih efisien
    const visibleMMSI = new Set(vesselsToShow.map(v => v.mmsi));
    
    // 3. Hapus marker yang tidak ada lagi
    Object.keys(markers).forEach(mmsi => {
        if (!visibleMMSI.has(mmsi)) {
            map.removeLayer(markers[mmsi]);
            delete markers[mmsi];
        }
    });

    // 4. Update atau tambahkan marker
    vesselsToShow.forEach(vessel => {
        if (!vessel.lat || !vessel.lon) return;
        
        const mmsi = vessel.mmsi;
        const newContent = createPopupContent(vessel);
        
        if (markers[mmsi]) {
            // Optimasi: hanya update jika ada perubahan
            const marker = markers[mmsi];
            const oldLatLng = marker.getLatLng();
            const newLatLng = [vessel.lat, vessel.lon];
            
            // Update posisi jika berubah
            if (oldLatLng.lat !== newLatLng[0] || oldLatLng.lng !== newLatLng[1]) {
                marker.setLatLng(newLatLng);
            }
            
            // Update rotasi jika berubah
            const newRotation = vessel.course || 0;
            if (marker.options.rotationAngle !== newRotation) {
                marker.setRotationAngle(newRotation);
            }
            
            // Update popup jika terbuka
            if (marker.isPopupOpen()) {
                marker.setPopupContent(newContent);
            } else {
                // Simpan konten baru untuk saat popup dibuka
                marker.bindPopup(newContent);
            }
        } else {
            // Buat marker baru
            const shipIcon = L.icon({
                iconUrl: getShipIcon(vessel),
                iconSize: [26, 26],
                iconAnchor: [13, 13],
                popupAnchor: [0, -12]
            });

            markers[mmsi] = L.marker([vessel.lat, vessel.lon], {
                icon: shipIcon,
                rotationAngle: (vessel.course || 0),
                rotationOrigin: "center"
            }).bindPopup(newContent).addTo(map);
        }
    });
}

// Helper function to get ship icon based on type and owner
function getShipIcon(vessel) {
    if (vessel.owner === "Ship") {
        switch (vessel['ship type']) {
            case "Cargo Ship": return 'cargo.svg';
            case "Tanker": return 'tanker.svg';
            case "Passenger Ship": return 'passenger.svg';
            case "Fishing Vessel": return 'fishing.svg';
            default: return 'sna.svg';
        }
    } else if (vessel.owner === "Coastal Station") return 'coastal.svg';
    else if (vessel.owner === "Group of ships") return 'gos.svg';
    else if (vessel.owner === "SAR — Search and Rescue Aircraft") return 'SAR.svg';
    else if (vessel.owner === "Diver's radio") return 'diverradio.svg';
    else if (vessel.owner === "Aids to navigation") return 'navigasi.svg';
    else if (vessel.owner === "Auxiliary craft associated with parent ship") return 'auxiliary.svg';
    else if (vessel.owner === "AIS SART — Search and Rescue Transmitter") return 'aissart.svg';
    else if (vessel.owner === "MOB — Man Overboard Device") return 'mob.svg';
    else if (vessel.owner === "EPIRB — Emergency Position Indicating Radio Beacon") return 'beacon.svg';
    else return 'na.svg';
}

// Helper function to create popup content
function createPopupContent(vessel) {
    return `
        <div style="font-family: Arial, sans-serif; font-size: 13px; max-width: 300px;">
            <strong style="font-size: 14px;">MMSI: ${safeText(vessel.mmsi)}</strong><br>
            <small>${safeText(vessel['ship type'] || 'Unknown Type')}</small><br>
            <small>${safeText(vessel.country || 'Unknown Country')}</small><br>
            <small>${safeText(vessel.owner || 'Unknown Owner')}</small>
            <hr style="margin: 8px 0;">
            <table style="width: 100%; font-size: 13px;">
                <tr><td><strong>Status</strong></td><td>${safeText(vessel.status)}</td></tr>
                <tr><td><strong>Speed</strong></td><td>${safeText(vessel.speed)} kn</td></tr>
                <tr><td><strong>Course</strong></td><td>${safeText(vessel.course)}°</td></tr>
                <tr><td><strong>Waktu</strong></td><td>${safeText(vessel.waktu)}</td></tr>
            </table>
            <div style="margin-top: 10px;">
                <button onclick="lihatHistori('${safeText(vessel.mmsi)}')" style="background-color: #007bff; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">
                    ⏪ Lihat Riwayat
                </button>
            </div>
        </div>
    `;
}

// Filter function
function filterVessel(vessel) {
    if (!activeFilter) return true;
    
    return (
        (activeFilter.owner === '' || (vessel.owner && vessel.owner.includes(activeFilter.owner))) &&
        (activeFilter.shipType === '' || (vessel['ship type'] && vessel['ship type'].includes(activeFilter.shipType))) &&
        (activeFilter.status === '' || (vessel.status && vessel.status.toLowerCase() === activeFilter.status)) &&
        (activeFilter.country === '' || (vessel.country && vessel.country.toLowerCase().includes(activeFilter.country)))
    );
}

// Apply filter function
function applyFilter() {
    const selectedValue = document.getElementById("shipGroup").value;
    const [owner = '', shipType = ''] = selectedValue.split('|');
    const status = document.getElementById("shipStatus").value.toLowerCase();
    const country = document.getElementById("shipCountry").value.toLowerCase();

    activeFilter = { owner, shipType, status, country };
    filterActive = true;
    
    fetchAndFilterVessels();
}

// Remove filter function
function removeFilter() {
    activeFilter = null;
    filterActive = false;
    document.getElementById("shipGroup").value = "";
    document.getElementById("shipStatus").value = "";
    document.getElementById("shipCountry").value = "";
    
    fetchAndFilterVessels();
}

// Fetch and filter vessels
function fetchAndFilterVessels() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.vessels && Array.isArray(data.vessels)) {
                updateVesselsOnMap(data.vessels);
            }
        })
        .catch(error => console.error("Error:", error));
}

// Set up periodic data refresh
setInterval(fetchAndFilterVessels, 5000);

// Initial data load
fetchAndFilterVessels();

// Close all dropdowns except specified one
function closeAllDropdowns(exceptId) {
    const dropdowns = document.querySelectorAll('.dropdown-filter, .weather-legend, .stats-section');
    dropdowns.forEach(dropdown => {
        if (dropdown.id !== exceptId) {
            dropdown.style.display = 'none';
        }
    });
}

// Toggle filter dropdown
function toggleFilter() {
    closeAllDropdowns('dropdown-filter');
    const dropdown = document.getElementById('dropdown-filter');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Search functionality
document.getElementById('search-btn').addEventListener('click', function() {
    var query = document.getElementById('search-bar').value.toLowerCase();
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.vessels && Array.isArray(data.vessels)) {
                const filteredVessels = data.vessels.filter(function(vessel) {
                    return Object.keys(vessel).some(key => {
                        if (vessel[key] && typeof vessel[key] === "string") {
                            return vessel[key].toLowerCase().includes(query);
                        }
                        return false;
                    });
                });

                // Clear existing markers
                Object.keys(markers).forEach(mmsi => {
                    map.removeLayer(markers[mmsi]);
                    delete markers[mmsi];
                });

                // Add filtered markers
                updateVesselsOnMap(filteredVessels);
            }
        })
        .catch(error => console.error("Error:", error));
});

// Weather layer functionality
var apiKey = 'ea5a726a363c40c1efdadacc743c32d7';
var windLayer = L.OWM.wind({ appId: apiKey, showLegend: false });
var tempLayer = L.OWM.temperature({ appId: apiKey, showLegend: false });
var rainLayer = L.OWM.precipitation({ appId: apiKey, showLegend: false });

function removeAllWeatherLayers() {
    map.removeLayer(windLayer);
    map.removeLayer(tempLayer);
    map.removeLayer(rainLayer);
}

document.querySelectorAll('input[name="weatherLayer"]').forEach(radio => {
    radio.addEventListener('change', function() {
        removeAllWeatherLayers();
        switch (this.value) {
            case 'wind': map.addLayer(windLayer); break;
            case 'temperature': map.addLayer(tempLayer); break;
            case 'rain': map.addLayer(rainLayer); break;
        }
    });
});

function toggleWeather() {
    closeAllDropdowns('weather-legends');
    const dropdown = document.getElementById('weather-legends');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Distance measurement functionality
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var distanceMeasureActive = false;
var distanceControl = new L.Draw.Polyline(map, {
    shapeOptions: {
        color: 'blue',
        weight: 3
    },
    metric: true
});

map.on(L.Draw.Event.CREATED, function(e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);
    
    var latlngs = layer.getLatLngs();
    var distance = 0;
    
    for (var i = 0; i < latlngs.length - 1; i++) {
        distance += latlngs[i].distanceTo(latlngs[i + 1]);
    }
    
    alert("Total distance: " + (distance / 1000).toFixed(2) + " km");
});

function toggleDistanceMeasure() {
    if (!distanceMeasureActive) {
        distanceControl.enable();
        distanceMeasureActive = true;
    } else {
        distanceControl.disable();
        distanceMeasureActive = false;
        drawnItems.clearLayers();
    }
}

// Initialize Select2 with icons
$(document).ready(function() {
    function formatOption(option) {
        if (!option.id) return option.text;
        const iconUrl = $(option.element).data('icon');
        return $(
            `<div class="option-with-icon">
                <img src="${iconUrl}" class="option-icon" onerror="this.style.display='none'"/>
                <span>${option.text}</span>
            </div>`
        );
    }

    $('.icon-select').select2({
        templateResult: formatOption,
        templateSelection: formatOption,
        escapeMarkup: function(m) { return m; }
    });

    $('#shipStatus').select2({
        minimumResultsForSearch: Infinity
    });
});