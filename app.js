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
})

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

// Add custom zoom control in the bottom-right corner
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
var markers = {};  // Menyimpan marker per MMSI
var vesselHistory = {}; // Menyimpan history posisi per MMSI
//var historyLines = {}; // Menyimpan polyline history untuk tiap MMSI

// Fungsi untuk menghitung arah berdasarkan course
function calculateDirection(course) {
    if (course >= 0 && course < 45) return "North";
    if (course >= 45 && course < 135) return "East";
    if (course >= 135 && course < 225) return "South";
    if (course >= 225 && course < 315) return "West";
    return "North"; // Default jika nilai course tidak valid
}

// Fungsi untuk menyimpan history posisi kapal
/*function saveVesselHistory(mmsi, lat, lon, waktu) {
    if (!vesselHistory[mmsi]) {
        vesselHistory[mmsi] = []; // Buat array baru jika belum ada
    }
    vesselHistory[mmsi].push({ lat: lat, lon: lon, waktu: waktu });

    // Batasi jumlah history untuk menghindari penggunaan memori besar
    if (vesselHistory[mmsi].length > 50) { // Simpan hanya 50 koordinat terakhir
        vesselHistory[mmsi].shift();
    }
}*/

// Ambil data kapal secara berkala
setInterval(() => {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Fetched Data:', data); // Debug data dari API
            if (data.vessels && Array.isArray(data.vessels)) {
                updateVesselsOnMap(data.vessels); // Perbarui kapal di peta
            } else {
                console.warn("Data vessels tidak valid:", data);
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}, 5000); // Polling setiap 5 detik 

// Fungsi pengaman tampilan null
function safeText(value) {
    return (value === null || value === undefined || value === '' || value === 'null') ? '-' : value;
}

// Fungsi untuk memperbarui kapal di peta
function updateVesselsOnMap(vesselList) {
    vesselList.forEach(function(vessel) {
        if (vessel.lat && vessel.lon) { // Pastikan koordinat valid
            // Simpan posisi terbaru dalam history
            //saveVesselHistory(vessel.mmsi, vessel.lat, vessel.lon, vessel.waktu);

            // Jika marker sudah ada, update posisi dan rotasi
            if (markers[vessel.mmsi]) {
                markers[vessel.mmsi].setLatLng([vessel.lat, vessel.lon])
                    .setRotationAngle((vessel.course || 0)); // Koreksi rotasi
            } else {
                // Pilih ikon berdasarkan kombinasi owner dan shipType
                if (vessel.owner === "Ship") {
                    switch (vessel['ship type']) {
                        case "Cargo Ship":
                            shipIconUrl = 'cargo.svg';
                            break;
                        case "Tanker":
                            shipIconUrl = 'tanker.svg';
                            break;
                        case "Passenger Ship":
                            shipIconUrl = 'passenger.svg';
                            break;
                        case "Fishing Vessel":
                            shipIconUrl = 'fishing.svg';
                            break;
                        default:
                            shipIconUrl = 'sna.svg'; // Ikon default jika shipType tidak cocok
                            break;
                    }
                } else if (vessel.owner === "Coastal Station") {
                    shipIconUrl = 'coastal.svg';
                } else if (vessel.owner === "Group of ships") {
                    shipIconUrl = 'gos.svg';
                } else if (vessel.owner === "SAR — Search and Rescue Aircraft") {
                    shipIconUrl = 'SAR.svg';
                } else if (vessel.owner === "Diver's radio") {
                   shipIconUrl = 'diverradio.svg';
                } else if (vessel.owner === "Aids to navigation") {
                    shipIconUrl = 'navigasi.svg';
                } else if (vessel.owner === "Auxiliary craft associated with parent ship") {
                    shipIconUrl = 'auxiliary.svg';
                } else if (vessel.owner === "AIS SART — Search and Rescue Transmitter") {
                    shipIconUrl = 'aissart.svg';
                } else if (vessel.owner === "MOB — Man Overboard Device") {
                    shipIconUrl = 'mob.svg';
                } else if (vessel.owner === "EPIRB — Emergency Position Indicating Radio Beacon") {
                    shipIconUrl = 'beacon.svg';
                } else {
                    shipIconUrl = 'na.svg'; // Ikon default
                }

                var shipIcon = L.icon({
                    iconUrl: shipIconUrl,
                    iconSize: [26, 26], // Ukuran ikon
                    iconAnchor: [13, 13], // Titik anchor
                    popupAnchor: [0, -12] // Posisi popup
                });

                // Tambahkan marker baru
                var marker = L.marker([vessel.lat, vessel.lon], {
                    icon: shipIcon, // Gunakan objek L.icon
                    rotationAngle: (vessel.course || 0),
                    rotationOrigin: "center"
                }).addTo(map)
                .bindPopup(
                    'MMSI: ' + safeText(vessel.mmsi) + '<br>' +
                    'Speed: ' + safeText(vessel.speed) + ' km/h<br>' +
                    'Course: ' + safeText(vessel.course) + '<br>' +
                    'Waktu: ' + safeText(vessel.waktu) + '<br>' +
                    'Status: ' + safeText(vessel.status) + '<br>' +
                    'Direction: ' + safeText(calculateDirection(vessel.course)) + '<br>' +
                    'Country: ' + safeText(vessel.country) + '<br>' +
                    'Owner: ' + safeText(vessel.owner) + '<br>' +     
                    'Ship Type: ' + safeText(vessel['ship type'])        
                );
                markers[vessel.mmsi] = marker; // Simpan marker ke dalam markers
            }
        } else {
            console.log('Skipping invalid vessel:', vessel);
        }
    });
}

//untuk menutup opsi
function closeAllDropdowns(exceptId) {
    const dropdowns = document.querySelectorAll('.dropdown-filter, .weather-legend, .dropdown-ship-types, .stats-section');
    dropdowns.forEach(dropdown => {
        if (dropdown.id !== exceptId) {
            dropdown.style.display = 'none';
        }
    });
}

/*   opsi filter kapal   */
function toggleFilter() {
    closeAllDropdowns('dropdown-filter');  // Close other dropdowns
    const dropdown = document.getElementById('dropdown-filter');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Fungsi untuk menerapkan filter berdasarkan input pengguna
let activeFilter = null; // Menyimpan filter yang sedang aktif
function applyFilter() {
    const type = document.getElementById("shipType").value;
    const speed = document.getElementById("shipSpeed").value;
    const status = document.getElementById("shipStatus").value.toLowerCase();
    const country = document.getElementById("shipCountry").value.toLowerCase();
    const owner = document.getElementById("shipOwner").value;

    activeFilter = { type, speed, status, country, owner }; // Simpan filter aktif

    // Ambil data dari API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.vessels && Array.isArray(data.vessels)) {
                const filteredVessels = data.vessels.filter(ship => {
                    return (
                        (type === "" || ship.type === type || ship['ship type'] === type) &&
                        (speed === "" || ship.speed && ship.speed >= parseInt(speed)) &&
                        (status === "" || ship.status && ship.status.toLowerCase() === status) &&
                        (country === "" || ship.country && ship.country.toLowerCase().includes(country)) &&
                        (owner === "" || ship.owner && ship.owner === owner)
                    );
                });
                console.log("Filtered Vessels:", filteredVessels);
                // Hapus marker lama dari peta
                Object.keys(markers).forEach(mmsi => {
                    map.removeLayer(markers[mmsi]);
                    delete markers[mmsi];
                });

                // Tambahkan marker baru dari hasil filter
                updateVesselsOnMap(filteredVessels);
            } else {
                console.error("Data vessels tidak valid:", data);
            }
        })
        .catch(error => console.error("Error filtering data:", error));
}

//buar search button
document.getElementById('search-btn').addEventListener('click', function() {
  var query = document.getElementById('search-bar').value.toLowerCase(); // Ambil input dari search bar
  // Ambil data kapal langsung dari API dan filter berdasarkan query
  fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
          if (data.vessels && Array.isArray(data.vessels)) {
              // Filter data kapal berdasarkan query pencarian
              const filteredVessels = data.vessels.filter(function(vessel) {
                  // Cek kecocokan pada semua atribut kapal
                  return Object.keys(vessel).some(key => {
                      if (vessel[key] && typeof vessel[key] === "string") {
                          return vessel[key].toLowerCase().includes(query);
                      }
                      return false;
                  });
              });

              console.log("Filtered Vessels (Search):", filteredVessels);

              // Hapus marker lama dari peta
              Object.keys(markers).forEach(mmsi => {
                  map.removeLayer(markers[mmsi]);
                  delete markers[mmsi];
              });

              // Tambahkan marker kapal yang terfilter ke peta
              updateVesselsOnMap(filteredVessels);
          } else {
              console.error("Invalid API response:", data);
          }
      })
      .catch(error => console.error("Error fetching data for search:", error));
});

// Menginisialisasi layer cuaca dari OpenWeatherMap
var apiKey = 'ea5a726a363c40c1efdadacc743c32d7'; // Ganti dengan API Key Anda
var windLayer = L.OWM.wind({ appId: apiKey, showLegend: false });
var tempLayer = L.OWM.temperature({ appId: apiKey, showLegend: false });
var rainLayer = L.OWM.precipitation({ appId: apiKey, showLegend: false });

// Fungsi untuk menghapus semua layer cuaca dari peta
function removeAllWeatherLayers() {
    map.removeLayer(windLayer);
    map.removeLayer(tempLayer);
    map.removeLayer(rainLayer);
}

// Menambahkan event listener untuk setiap radio button cuaca
document.querySelectorAll('input[name="weatherLayer"]').forEach(radio => {
    radio.addEventListener('change', function () {
        removeAllWeatherLayers(); // Hapus semua layer saat radio button berubah

        // Tambahkan layer berdasarkan radio button yang dipilih
        switch (this.value) {
            case 'wind':
                map.addLayer(windLayer);
                break;
            case 'temperature':
                map.addLayer(tempLayer);
                break;
            case 'rain':
                map.addLayer(rainLayer);
                break;
            case 'none':
                // Tidak ada layer yang ditampilkan
                break;
        }
    });
});

// Saat halaman dimuat, pastikan tidak ada layer yang tertumpuk
window.addEventListener('load', () => {
    removeAllWeatherLayers();
});

function toggleWeather() {
    closeAllDropdowns('weather-legends');
    const dropdown = document.getElementById('weather-legends');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleShipTypes() {
    closeAllDropdowns('dropdown-ship-types');
    const dropdown = document.getElementById('dropdown-ship-types');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Panggil fungsi untuk memperbarui statistik
/*window.onload = updateStats;

function toggleStats() {
    closeAllDropdowns('stats-section');
    const dropdown = document.getElementById('stats-section');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

/* untuk jarak */
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
var distanceMeasureActive = false;
var distanceControl = new L.Draw.Polyline(map, {
    edit: {
      featureGroup: drawnItems
    },
    metric: true,
    shapeOptions: {
      color: 'blue'
    }
  });  

function toggleDistanceMeasure() {
  if (!distanceMeasureActive) {
    // Aktifkan pengukuran jarak
    distanceControl.enable();
    distanceMeasureActive = true;
  } else {
    // Nonaktifkan pengukuran jarak
    distanceControl.disable();
    distanceMeasureActive = false;
  }
}

// Event handler untuk menyelesaikan pengukuran dan menghitung jarak
map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    drawnItems.addLayer(layer);
  
    var latlngs = layer.getLatLngs();
    var distance = 0;
  
    for (var i = 0; i < latlngs.length - 1; i++) {
      distance += latlngs[i].distanceTo(latlngs[i + 1]);
    }
  
    alert("Total distance: " + (distance / 1000).toFixed(2) + " km");
  });
  
  
