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
            $path = str_replace("files/", "", $dir);
            echo "
            {
               \"path\": \"$path\",
               \"FilesName\": \"$value\",
               \"size\" :\"$size\",
               \"MD5\" :\"$hash\"
            },";
         }
      }
   }
}

header("Content-Type: application/json; charset=UTF-8");
echo "[", dirToArray("files"), "\n\"\"]";
?>