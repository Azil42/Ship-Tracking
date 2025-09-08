<?php
header('Access-Control-Allow-Origin: ');
header('Content-Type: application/json');

// Fungsi untuk mendapatkan nama negara berdasarkan MMSI
function getCountryFromMMSI($mmsi) {
    $mid = (int)($mmsi / 1000000); // Ambil 3 digit pertama dari MMSI

    // Mapping MID ke negara
    $countries = [
        201 => "Albania",
        202 => "Andorra",
        203 => "Austria",
        204 => "Azores",
        205 => "Belgium",
        206 => "Belarus",
        207 => "Bulgaria",
        208 => "Vatican City",
        209 => "Cyprus",
        210 => "Cyprus",
        211 => "Germany",
        212 => "Cyprus",
        213 => "Georgia",
        214 => "Moldova",
        215 => "Malta",
        216 => "Armenia",
        218 => "Germany",
        219 => "Denmark",
        220 => "Denmark",
        224 => "Spain",
        225 => "Spain",
        226 => "France",
        227 => "France",
        228 => "France",
        229 => "Malta",
        230 => "Finland",
        231 => "Faroe Islands",
        232 => "United Kingdom",
        233 => "United Kingdom",
        234 => "United Kingdom",
        235 => "United Kingdom",
        236 => "Gibraltar",
        237 => "Greece",
        238 => "Croatia",
        239 => "Greece",
        240 => "Greece",
        241 => "Greece",
        242 => "Morocco",
        243 => "Hungary",
        244 => "Netherlands",
        245 => "Netherlands",
        246 => "Netherlands",
        247 => "Italy",
        248 => "Malta",
        249 => "Malta",
        250 => "Ireland",
        251 => "Iceland",
        252 => "Liechtenstein",
        253 => "Luxembourg",
        254 => "Monaco",
        255 => "Madeira",
        256 => "Malta",
        257 => "Norway",
        258 => "Norway",
        259 => "Norway",
        261 => "Poland",
        262 => "Montenegro",
        263 => "Portugal",
        264 => "Romania",
        265 => "Sweden",
        266 => "Sweden",
        267 => "Slovak Republic",
        268 => "San Marino",
        269 => "Switzerland",
        270 => "Czech Republic",
        271 => "Turkey",
        272 => "Ukraine",
        273 => "Russia",
        274 => "Macedonia",
        275 => "Latvia",
        276 => "Estonia",
        277 => "Lithuania",
        278 => "Slovenia",
        279 => "Serbia",
        301 => "Anguilla",
        303 => "Alaska",
        304 => "Antigua and Barbuda",
        305 => "Antigua and Barbuda",
        306 => "Curacao",
        307 => "Aruba",
        308 => "Bahamas",
        309 => "Bahamas",
        310 => "Bermuda",
        311 => "Bahamas",
        312 => "Belize",
        314 => "Barbados",
        316 => "Canada",
        319 => "Cayman Islands",
        321 => "Costa Rica",
        323 => "Cuba",
        325 => "Dominica",
        327 => "Dominican Republic",
        329 => "Guadeloupe",
        330 => "Grenada",
        331 => "Greenland",
        332 => "Guatemala",
        334 => "Honduras",
        336 => "Haiti",
        338 => "United States",
        339 => "Jamaica",
        341 => "Saint Kitts and Nevis",
        343 => "Saint Lucia",
        345 => "Mexico",
        347 => "Martinique",
        348 => "Montserrat",
        350 => "Nicaragua",
        351 => "Panama",
        352 => "Panama",
        353 => "Panama",
        354 => "Panama",
        355 => "-",
        356 => "-",
        357 => "-",
        358 => "Puerto Rico",
        359 => "El Salvador",
        361 => "Saint Pierre and Miquelon",
        362 => "Trinidad and Tobago",
        364 => "Turks and Caicos",
        366 => "United States",
        367 => "United States",
        368 => "United States",
        369 => "United States",
        370 => "Panama",
        371 => "Panama",
        372 => "Panama",
        373 => "Panama",
        375 => "Saint Vincent and the Grenadines",
        376 => "Saint Vincent and the Grenadines",
        377 => "Saint Vincent and the Grenadines",
        378 => "British Virgin Islands",
        379 => "United States Virgin Islands",
        401 => "Afghanistan",
        403 => "Saudi Arabia",
        405 => "Bangladesh",
        408 => "Bahrain",
        410 => "Bhutan",
        412 => "China",
        413 => "China",
        414 => "China",
        416 => "Taiwan",
        417 => "Sri Lanka",
        419 => "India",
        422 => "Iran",
        423 => "Azerbaijan",
        425 => "Iraq",
        428 => "Israel",
        431 => "Japan",
        432 => "Japan",
        434 => "Turkmenistan",
        436 => "Kazakhstan",
        437 => "Uzbekistan",
        438 => "Jordan",
        440 => "South Korea",
        441 => "South Korea",
        443 => "Palestine",
        445 => "North Korea",
        447 => "Kuwait",
        450 => "Lebanon",
        451 => "Kyrgyzstan",
        453 => "Macao",
        455 => "Maldives",
        457 => "Mongolia",
        459 => "Nepal",
        461 => "Oman",
        463 => "Pakistan",
        466 => "Qatar",
        468 => "Syria",
        470 => "United Arab Emirates",
        472 => "Tajikistan",
        473 => "Yemen",
        475 => "Yemen",
        477 => "Hong Kong",
        478 => "Bosnia and Herzegovina",
        501 => "Adelie Land",
        503 => "Australia",
        506 => "Myanmar",
        508 => "Brunei",
        510 => "Micronesia",
        511 => "Palau",
        512 => "New Zealand",
        514 => "Cambodia",
        515 => "Cambodia",
        516 => "Christmas Island",
        518 => "Cook Islands",
        520 => "Fiji",
        523 => "Cocos Islands",
        525 => "Indonesia",
        529 => "Kiribati",
        531 => "Laos",
        533 => "Malaysia",
        536 => "Northern Mariana Islands",
        538 => "Marshall Islands",
        540 => "New Caledonia",
        542 => "Niue",
        544 => "Nauru",
        546 => "French Polynesia",
        548 => "Philippines",
        553 => "Papua New Guinea",
        555 => "Pitcairn Island",
        557 => "Solomon Islands",
        559 => "American Samoa",
        561 => "Samoa",
        563 => "Singapore",
        564 => "Singapore",
        565 => "Singapore",
        566 => "Singapore",
        567 => "Thailand",
        570 => "Tonga",
        572 => "Tuvalu",
        574 => "Vietnam",
        576 => "Vanuatu",
        577 => "Vanuatu",
        578 => "Wallis and Futuna",
        601 => "South Africa",
        603 => "Angola",
        605 => "Algeria",
        607 => "Saint Paul and Amsterdam",
        608 => "Ascension Island",
        609 => "Burundi",
        610 => "Benin",
        611 => "Botswana",
        612 => "Central African Republic",
        613 => "Cameroon",
        615 => "Congo",
        616 => "Comoros",
        617 => "Cape Verde",
        618 => "Crozet Archipelago",
        619 => "Ivory Coast",
        620 => "Comoros",
        621 => "Djibouti",
        622 => "Egypt",
        624 => "Ethiopia",
        625 => "Eritrea",
        626 => "Gabon",
        627 => "Ghana",
        629 => "Gambia",
        630 => "Guinea-Bissau",
        631 => "Equatorial Guinea",
        632 => "Guinea",
        633 => "Burkina Faso",
        634 => "Kenya",
        635 => "Kerguelen Islands",
        636 => "Liberia",
        637 => "Liberia",
        638 => "South Sudan",
        642 => "Libya",
        644 => "Lesotho",
        645 => "Mauritius",
        647 => "Madagascar",
        649 => "Mali",
        650 => "Mozambique",
        654 => "Mauritania",
        655 => "Malawi",
        656 => "Niger",
        657 => "Nigeria",
        659 => "Namibia",
        660 => "Reunion",
        661 => "Rwanda",
        662 => "Sudan",
        663 => "Senegal",
        664 => "Seychelles",
        665 => "Saint Helena",
        666 => "Somalia",
        667 => "Sierra Leone",
        668 => "Sao Tome and Principe",
        669 => "Eswatini",
        670 => "Chad",
        671 => "Togo",
        672 => "Tunisia",
        674 => "Tanzania",
        675 => "Uganda",
        676 => "Democratic Republic of Congo",
        677 => "Tanzania",
        678 => "Zambia",
        679 => "Zimbabwe",
        701 => "Argentina",
        710 => "Brazil",
        720 => "Bolivia",
        725 => "Chile",
        730 => "Colombia",
        735 => "Ecuador",
        740 => "Falkland Islands",
        745 => "French Guiana",
        750 => "Guyana",
        755 => "Paraguay",
        760 => "Peru",
        765 => "Suriname",
        770 => "Uruguay"
    ];
    return $countries[$mid] ?? "Unknown";
}

// Fungsi untuk mendapatkan jenis kapal berdasarkan MMSI
function getShipTypeFromMMSI($mmsi) {
    switch (true) {
        case $mmsi >= 200000000 && $mmsi < 800000000:
            $mid = $mmsi / 1000000;
            $owner = "Ship";
            if ($mmsi >= 200000000 && $mmsi < 300000000) {
                $shipType = "Cargo Ship";
            } elseif ($mmsi >= 300000000 && $mmsi < 400000000) {
                $shipType = "Tanker";
            } elseif ($mmsi >= 400000000 && $mmsi < 500000000) {
                $shipType = "Passenger Ship";
            } elseif ($mmsi >= 500000000 && $mmsi < 600000000) {
                $shipType = "Fishing Vessel";
            } else {
                $shipType = "Other Ship";
            }
            break;

        case $mmsi <= 9999999:
            $mid = $mmsi / 10000;
            $owner = "Coastal Station";
            $shipType = "N/A";
            break;

        case $mmsi <= 99999999:
            $mid = $mmsi / 100000;
            $owner = "Group of ships";
            $shipType = "N/A";
            break;

        case $mmsi <= 199999999:
            $mid = $mmsi / 1000 - 111000;
            $owner = "SAR — Search and Rescue Aircraft";
            $shipType = "N/A";
            break;

        case $mmsi < 900000000:
            $mid = $mmsi / 100000 - 8000;
            $owner = "Diver's radio";
            $shipType = "N/A";
            break;

        case $mmsi >= 990000000 && $mmsi < 1000000000:
            $mid = $mmsi / 10000 - 99000;
            $owner = "Aids to navigation";
            $shipType = "N/A";
            break;

        case $mmsi >= 980000000 && $mmsi < 990000000:
            $mid = $mmsi / 10000 - 98000;
            $owner = "Auxiliary craft associated with parent ship";
            $shipType = "N/A";
            break;

        case $mmsi >= 970000000 && $mmsi < 970999999:
            $mid = $mmsi / 1000 - 970000;
            $owner = "AIS SART — Search and Rescue Transmitter";
            $shipType = "N/A";
            break;

        case $mmsi >= 972000000 && $mmsi < 972999999:
            $owner = "MOB — Man Overboard Device";
            $shipType = "N/A";
            break;

        case $mmsi >= 974000000 && $mmsi < 974999999:
            $owner = "EPIRB — Emergency Position Indicating Radio Beacon";
            $shipType = "N/A";
            break;

        default:
            $owner = "Invalid MMSI";
            $shipType = "N/A";
            break;
    }

    return [
        'owner' => $owner,
        'shipType' => $shipType ?? 'N/A',
    ];
}

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "ais", 3307);
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed"]));
}

// Query data dari tabel
$sql = "SELECT latitude AS lat, longitude AS lon, mmsi, speed, course, waktudatabase FROM ais_datasnq";
$result = $conn->query($sql);

// Variabel untuk menghitung jumlah kapal berlayar dan berlabuh
/*$berlayar_count = 0;
$berlabuh_count = 0;*/
$vessels = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $mmsi = (int)$row['mmsi'];
        $row['country'] = getCountryFromMMSI($mmsi);
        $shipData = getShipTypeFromMMSI($mmsi);
        $row['owner'] = $shipData['owner'];
        $row['ship type'] = $shipData['shipType'];
        // Tentukan status kapal sberdasarkan kecepatan
        $speed = (float)$row['speed'];
        if ($speed == 0) {
            $row['status'] = "Berlabuh";
            //$berlabuh_count++;
        } elseif ($speed > 0) {
            $row['status'] = "Berlayar";
            //$berlayar_count++;
        } else {
            $row['status'] = "Tidak diketahui";
        }

        // Konversi nilai arah (course) ke arah kompas
        $course = (float)$row['course'];
        if ($course == 0) {
            $row['direction'] = "North";
        } elseif ($course > 0 && $course < 90) {
            $row['direction'] = "North-East";
        } elseif ($course == 90) {
            $row['direction'] = "East";
        } elseif ($course > 90 && $course < 180) {
            $row['direction'] = "South-East";
        } elseif ($course == 180) {
            $row['direction'] = "South";
        } elseif ($course > 180 && $course < 270) {
            $row['direction'] = "South-West";
        } elseif ($course == 270) {
            $row['direction'] = "West";
        } else {
            $row['direction'] = "North-West";
        }

        // Tambahkan data kapal ke array
        $vessels[] = $row;
    }
} else {
    echo json_encode(["message" => "No data available"]);
    $conn->close();
    exit;
}

// Mengirimkan jumlah kapal berlayar dan berlabuh
echo json_encode([
    /*'berlayar_count' => $berlayar_count,
    'berlabuh_count' => $berlabuh_count,*/
    'vessels' => $vessels
]);

$conn->close();
?>
