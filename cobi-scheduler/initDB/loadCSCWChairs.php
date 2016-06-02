<?php
/*
Copyright (c) 2012-2016 Massachusetts Institute of Technology

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

ini_set('display_errors', 'On');
error_reporting(E_ALL | E_STRICT);
include "../settings/settings.php";

function startsWith($haystack, $needle)
{
  return !strncmp($haystack, $needle, strlen($needle));
}

if(count($argv) != 2 or $argv[1] != 'pineapple'){
  echo "wrong password" . "\n";
  exit(1);
}

define("CHAIRFILE", "chairs.json");
$mysqli = mysqli_connect(COBI_MYSQL_SERVER, COBI_MYSQL_USERNAME, COBI_MYSQL_PASSWORD, COBI_MYSQL_DATABASE);

$contents = file_get_contents(CHAIRFILE);
$chairData = json_decode($contents, true);

foreach ($chairData as $chair) {
  //  if(startsWith($chair["id"], "chair")){// create new chair
    $authorId = mysqli_real_escape_string($mysqli, $chair['authorId']);
    $givenName = mysqli_real_escape_string($mysqli, $chair['givenName']);
    $familyName = mysqli_real_escape_string($mysqli, $chair['familyName']);
    $middleInitial = mysqli_real_escape_string($mysqli, $chair['middleInitial']);
    $id = mysqli_real_escape_string($mysqli, $chair['id']);
    $affinity = mysqli_real_escape_string($mysqli, $chair['affinity']);

    $squery = "insert into sessionChairs (authorId, id, givenName, middleInitial, familyName, affinity) values ('$authorId', '$id', '$givenName', '$middleInitial', '$familyName', '$affinity');";
    mysqli_query($mysqli, $squery);
    echo mysqli_error($mysqli);
    
    if($id != ""){
      $squery = "update session set chairs='$authorId' where id='$id'";
      mysqli_query($mysqli, $squery);
      echo mysqli_error($mysqli);
    }
    //  }
/* else{// insert on lookup */
/*     $authorId = mysqli_real_escape_string($mysqli, $chair['authorId']); */
/*     $id = mysqli_real_escape_string($mysqli, $chair['id']); */
/*     $affinity = mysqli_real_escape_string($mysqli, $chair['affinity']); */

/*     $squery = "insert into sessionChairs (authorId, type, id, venue, rank, givenName, middleInitial, familyName, email, role, primaryAff, secondaryAff) select * from authors where authorId='$authorId' limit 1"; */
/*     mysqli_query($mysqli, $squery); */
/*     echo mysqli_error($mysqli); */
    
/*     $squery = "update sessionChairs set id='$id' where authorId='$authorId'"; */
/*     mysqli_query($mysqli, $squery); */
/*     echo mysqli_error($mysqli); */

/*     $squery = "update sessionChairs set affinity='$affinity' where authorId='$authorId'"; */
/*     mysqli_query($mysqli, $squery); */
/*     echo mysqli_error($mysqli); */
    
/*     if($id != ""){  // update session's chair */
/*       $squery = "update session set chairs='$authorId' where id='$id'"; */
/*       mysqli_query($mysqli, $squery); */
/*       echo mysqli_error($mysqli); */
/*     } */
/*  }*/
}
$mysqli->close();
?>