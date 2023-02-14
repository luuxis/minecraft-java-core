<?php
header("Content-Type: application/json; charset=UTF-8");
include 'php/scandir.php';

$instance = $_GET['instance'];

if ($instance == '/' || $instance[0] == '.') {
    echo json_encode([]);
    exit;
}

echo json_encode(scanfolder("instances"));

// echo dirToArray($instance);
?>