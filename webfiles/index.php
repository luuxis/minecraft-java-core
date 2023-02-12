<?php
header("Content-Type: application/json; charset=UTF-8");
include 'php/scandir.php';

$instance = $_GET['instance'] ?? 'files';

if ($instance[0] === '.') {
    echo json_encode([]);
    exit;
}
echo dirToArray($instance);
?>