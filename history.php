<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "ais", 3307);
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed"]));
}

$mmsi = $_GET['mmsi'] ?? null;
if (!$mmsi) {
    die(json_encode(["error" => "MMSI parameter is required"]));
}

// Query data history kapal berdasarkan MMSI
$sql = "SELECT latitude AS lat, longitude AS lon, waktu 
        FROM ais_datasnq 
        WHERE mmsi = ? 
        ORDER BY waktu DESC
        LIMIT 100"; // Batasi 100 data terakhir
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $mmsi);
$stmt->execute();
$result = $stmt->get_result();

$history = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }
}

echo json_encode($history);
$conn->close();
?>