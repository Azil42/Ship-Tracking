<?php
// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "ais_data");

// Cek koneksi
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
// Baca file
$file = fopen("C:/xampp/htdocs/ais_project/#2023_9_10_13_43_31 (1).txt#", "r");
if ($file !== FALSE) {
    while (($data = fgetcsv($file, 1000, " ")) !== FALSE) {
        // Masukkan data ke tabel
        $query = "INSERT INTO ais_data (MID, MMSI, longitude, latitude, speed, course, waktu)
                  VALUES ('$data[0]', '$data[1]', '$data[2]', '$data[3]', '$data[4]', '$data[5]', '$data[6]')";
        $conn->query($query);
    }
    fclose($file);
    echo "Import berhasil!";
} else {
    echo "Gagal membuka file.";
}

$conn->close();
?>
