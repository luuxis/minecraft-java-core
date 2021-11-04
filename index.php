<?php
function dirToArray($dir) {

   $res = array();
   $cdir = scandir($dir);
   foreach ($cdir as $key => $value)
   {
      if (!in_array($value,array(".","..")))
      {
         if (is_dir($dir . DIRECTORY_SEPARATOR . $value))
         {
            dirToArray($dir . DIRECTORY_SEPARATOR . $value);
         }
         else
         {
            $hash = hash_file('MD5', $dir . "/" . $value);
            $size = filesize($dir . "/" . $value);
            echo "
            {
               \"path\": \"$dir\",
               \"FilesName\": \"$value\",
               \"size\" :\"$size\",
               \"hash\" :\"$hash\"
            },";
         }
      }
   }
}

header("Content-Type: application/json; charset=UTF-8");
echo "[", dirToArray("files"), "\n\"\"]";
?>