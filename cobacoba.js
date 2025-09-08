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
var historyLines = {}; // Menyimpan polyline history untuk tiap MMSI

// Fungsi untuk menghitung arah berdasarkan course
function calculateDirection(course) {
    if (course >= 0 && course < 45) return "North";
    if (course >= 45 && course < 135) return "East";
    if (course >= 135 && course < 225) return "South";
    if (course >= 225 && course < 315) return "West";
    return "North"; // Default jika nilai course tidak valid
}

// Fungsi untuk menyimpan history posisi kapal
function saveVesselHistory(mmsi, lat, lon, waktu) {
    if (!vesselHistory[mmsi]) {
        vesselHistory[mmsi] = []; // Buat array baru jika belum ada
    }
    vesselHistory[mmsi].push({ lat: lat, lon: lon, waktu: waktu });

    // Batasi jumlah history untuk menghindari penggunaan memori besar
    if (vesselHistory[mmsi].length > 50) { // Simpan hanya 50 koordinat terakhir
        vesselHistory[mmsi].shift();
    }
}

// Fungsi untuk menggambar lintasan (track) kapal di peta
function drawVesselHistory(mmsi) {
    if (vesselHistory[mmsi] && vesselHistory[mmsi].length > 1) {
        // Ambil semua koordinat dari history
        var latlngs = vesselHistory[mmsi].map(h => [h.lat, h.lon]);

        // Hapus garis sebelumnya jika ada
        if (historyLines[mmsi]) {
            map.removeLayer(historyLines[mmsi]);
        }

        // Buat garis baru menggunakan Polyline
        historyLines[mmsi] = L.polyline(latlngs, { color: 'blue', weight: 2 }).addTo(map);
    }
}

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

// Fungsi untuk memperbarui kapal di peta
function updateVesselsOnMap(vesselList) {
    vesselList.forEach(function(vessel) {
        if (vessel.lat && vessel.lon) { // Pastikan koordinat valid
            // Simpan posisi terbaru dalam history
            saveVesselHistory(vessel.mmsi, vessel.lat, vessel.lon, vessel.waktu);

            // Gambarkan lintasan kapal di peta
            drawVesselHistory(vessel.mmsi);

            // Jika marker sudah ada, update posisi dan rotasi
            if (markers[vessel.mmsi]) {
                markers[vessel.mmsi].setLatLng([vessel.lat, vessel.lon])
                    .setRotationAngle((vessel.course || 0)); // Koreksi rotasi
            } else {
                // Tambahkan marker jika belum ada
                var shipIcon = L.icon({
                    iconUrl: 'boat.svg',  // Path ikon kapal
                    iconSize: [26, 26],     // Ukuran ikon
                    iconAnchor: [13, 13],   // Titik pusat rotasi
                    popupAnchor: [0, -12]   // Posisi popup
                });

                var marker = L.marker([vessel.lat, vessel.lon], {
                    icon: shipIcon,
                    rotationAngle: (vessel.course || 0), // Koreksi rotasi ke Utara
                    rotationOrigin: "center"                  // Titik pusat rotasi
                }).addTo(map)
                .bindPopup(
                    'MMSI: ' + vessel.mmsi + '<br>' +
                    'Speed: ' + vessel.speed + ' km/h<br>' +
                    'Course: ' + vessel.course + '<br>' +
                    'Waktu: ' + vessel.waktu + '<br>' +
                    'Status: ' + vessel.status + '<br>' +
                    'Direction: ' + calculateDirection(vessel.course) + '<br>' +
                    'Country: ' + vessel.country+ '<br>' +
                    'Owner: ' + vessel.owner + '<br>' +     
                    'Ship Type: ' + vessel['ship type']        
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
    const dropdowns = document.querySelectorAll('.dropdown-filter, .weather-legend, .stats-section');
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

// Menambahkan event listener untuk checkbox "Wind"
document.getElementById('windLayer').addEventListener('change', function (e) {
  if (e.target.checked) {
    map.addLayer(windLayer);  // Menambahkan layer angin ke peta
  } else {
    map.removeLayer(windLayer);  // Menghapus layer angin dari peta
  }
});

// Menambahkan event listener untuk checkbox "Temperature"
document.getElementById('tempLayer').addEventListener('change', function (e) {
  if (e.target.checked) {
    map.addLayer(tempLayer);  // Menambahkan layer suhu ke peta
  } else {
    map.removeLayer(tempLayer);  // Menghapus layer suhu dari peta
  }
});

// Menambahkan event listener untuk checkbox "Precipitation"
document.getElementById('rainLayer').addEventListener('change', function (e) {
  if (e.target.checked) {
    map.addLayer(rainLayer);  // Menambahkan layer curah hujan ke peta
  } else {
    map.removeLayer(rainLayer);  // Menghapus layer curah hujan dari peta
  }
});

function toggleWeather() {
    closeAllDropdowns('weather-legends');
    const dropdown = document.getElementById('weather-legends');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

/* untuk statistik kapal */
function updateStats() {
  const berlayar = document.getElementById("berlayar-count");
  const berlabuh = document.getElementById("berlabuh-count");
  fetch(apiUrl)
    .then(response => {
        console.log('Status Respons:', response.status); // Debug status
        return response.json();
    })
    .then(data => {
        console.log('Data Diterima:', data); // Debug data
        if (data.berlayar_count !== undefined && data.berlabuh_count !== undefined) {
            berlayar.textContent = "Berlayar: " + data.berlayar_count;
            berlabuh.textContent = "Berlabuh: " + data.berlabuh_count;
        } else {
            console.error("Data statistik tidak lengkap:", data);
        }
    })
    .catch(error => console.error("Kesalahan mengambil data:", error));
}

// Panggil fungsi untuk memperbarui statistik
window.onload = updateStats;


function toggleStats() {
    closeAllDropdowns('stats-section');
    const dropdown = document.getElementById('stats-section');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

/* untuk jarak */
var distanceMeasureActive = false;
var distanceControl = new L.Draw.Polyline(map, {metric: true});

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
map.on(L.Draw.Event.CREATED, function(event) {
  var layer = event.layer;
  map.addLayer(layer);

  var latlngs = layer.getLatLngs();
  var distance = 0;
  
  for (var i = 0; i < latlngs.length - 1; i++) {
    distance += latlngs[i].distanceTo(latlngs[i + 1]);
  }

  alert("Total distance: " + (distance / 1000).toFixed(2) + " km");
});
