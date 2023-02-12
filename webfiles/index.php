<?php
header("Content-Type: application/json; charset=UTF-8");
include 'php/scandir.php';

$instance = $_GET['instance'] ?? 'files';
echo dirToArray($instance);
?>