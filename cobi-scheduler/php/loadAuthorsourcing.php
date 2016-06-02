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

$mysqli = mysqli_connect(COBI_MYSQL_SERVER, COBI_MYSQL_USERNAME, COBI_MYSQL_PASSWORD, COBI_MYSQL_DATABASE);

// Get the schedule table
$query = "select authorId, id, great, ok, notsure, notok, interested,relevant from authorsourcing"; 
$asTable = mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

$output = array();
$authoroutput = array();
while ($row = $asTable->fetch_assoc()) {
  if($row['authorId'] == ""){
    $row['authorId'] = "anon";
  }
  if(array_key_exists($row['id'], $output) and 
     array_key_exists($row['authorId'], $output[$row['id']])){ 
    array_push($output[$row['id']][$row['authorId']], $row); 
    if($row['authorId'] != "anon"){
      array_push($authoroutput[$row['authorId']][$row['id']], $row);
    }
  } else{
    $output[$row['id']][$row['authorId']] = array($row);
    if($row['authorId'] != "anon"){
      $authoroutput[$row['authorId']][$row['id']] = array($row);
    }
  }
}		      

$alloutput = array('sessionauthor' => $output,
		   'authorsession' => $authoroutput);
echo json_encode($alloutput);
		      