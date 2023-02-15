<?php
header("Content-Type: application/json; charset=UTF-8");
include 'php/scandir.php';

$instance = $_GET['instance'];

if ($instance == '/' || $instance[0] == '.') {
    echo json_encode([]);
    exit;
} elseif (!file_exists('instances')) {
    echo dirToArray("files");
    exit;
} elseif ($instance == '') {
    echo json_encode(scanfolder("instances"));
    exit;
} else {
    echo dirToArray("instances/$instance");
    exit;
}
?>