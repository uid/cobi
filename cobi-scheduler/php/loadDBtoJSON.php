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

function checkDupKey($k){
  $dups = array(
		'auth29797' =>		'auth1132' ,
		'auth28194' => 'auth11521' ,
		'auth34702' => 'auth1220' ,
		'auth29796' => 'auth1508' ,
		'auth32501' => 'auth22371' ,
		'auth27369' => 'auth23564' ,
		'auth29438' => 'auth24484' ,
		'auth34954' => 'auth26514' ,
		'auth6155' => 'auth28619' ,
		'auth3090' => 'auth29726' ,
		'auth3496' => 'auth32954' ,
		'auth4635' => 'auth34701' );
  
  if(array_key_exists($k, $dups)){
    return $dups[$k];
  }
  return $k;
}

$mysqli = mysqli_connect(COBI_MYSQL_SERVER, COBI_MYSQL_USERNAME, COBI_MYSQL_PASSWORD, COBI_MYSQL_DATABASE);

// Get the schedule table
$scheduleQ = "select * from schedule"; 
$scheduleTable = mysqli_query($mysqli, $scheduleQ);
echo mysqli_error($mysqli);

// Get the session table
$sessionQ = "select * from session"; 
$sessionTable = mysqli_query($mysqli, $sessionQ);
echo mysqli_error($mysqli);

// Get the entity table
$entityQ = "select * from entity"; 
$entityTable = mysqli_query($mysqli, $entityQ);
echo mysqli_error($mysqli);

// Get the transactions table
//$transQ = "select * from transactions order by id DESC limit 5";
$transQ = "select id, transactions.uid, transactions.type, data, previous, name from transactions LEFT JOIN (users) ON (users.uid=transactions.uid) order by id DESC limit 5";
$transTable =  mysqli_query($mysqli, $transQ);
echo mysqli_error($mysqli);

$unscheduledSubmissions = array();

// Get chairs
$chairsQ = "select * from sessionChairs";
$chairsTable = mysqli_query($mysqli, $chairsQ);
echo mysqli_error($mysqli);
$chairs = array();
while ($row = $chairsTable->fetch_assoc()){
  $row['affinity'] = json_decode($row['affinity']);
  $chairs[$row['authorId']] = $row;
}

// Reconstruct the JSON
while ($row = $entityTable->fetch_assoc()) {
  $row['coreCommunities'] = json_decode($row['coreCommunities']);
  $row['featuredCommunities'] = json_decode($row['featuredCommunities']);
  
  // Process authors into our format
  $authorDB = json_decode($row['authors'], true);
  $authors = array();
  if($authorDB != NULL){
    foreach ($authorDB as $author) {
      $authorKey = $author['givenName'] . ' ' . $author['familyName'];
      if (array_key_exists('id', $author)){
	$authorKey = $author['id'];
      }
      $inst = "";
      if(array_key_exists('primary', $author) and !is_null($author['primary'])){
	if(array_key_exists('institution', $author['primary']) and !is_null($author['primary'])){
	  $inst = $author['primary']['institution'];
	}
      }
      
      $authorData = array(
			  "affiliations" => array(array("country"=> "", "name" => $inst)),
			  "email" => $author['email'],
			  "firstName" => $author['givenName'],
			  "lastName" => $author['familyName'],
			  "middleName" => "",
			  "authorId" => checkDupKey($authorKey)
			  );
      if(array_key_exists('role', $author)){
	$authorData['role'] = $author['role'];
      }
      if(array_key_exists('middleInitial', $author)){
	$authorData['middleName'] = $author['middleInitial'];
      }
      $authors[checkDupKey($authorKey)] = $authorData;
    }
  }
  $row['authors'] = $authors;
  //  var_dump($authors);
  $row['keywords'] = json_decode($row['keywords']);
  
  $row['bestPaperAward'] = (bool)$row['bestPaperAward'];
  $row['bestPaperNominee'] = (bool)$row['bestPaperNominee'];
  
  $entity[$row['id']] = $row; 
  
    if ($row['session'] == "null"){
      $unscheduledSubmissions[$row['id']] = $row;
    }
}
  
$unscheduled = array();

while ($row = $sessionTable->fetch_assoc()) {
  $row['chairs'] = $row['chairs'];
  $row['coreCommunities'] = json_decode($row['coreCommunities']);
  $row['personas'] = $row['personas'];
  
  $row['featuredCommunities'] = json_decode($row['featuredCommunities']);
  $row['hasAward'] = (bool)$row['hasAward'];
  $row['hasHonorableMention'] = (bool)$row['hasHonorableMention'];
  $row['scheduled'] = (bool)$row['scheduled'];
  $subKeys = explode(",", trim($row['submissions']));
  $subs = array();

  foreach ($subKeys as $sub){
    if ($sub == ""){
    }else{
      if (!array_key_exists($sub, $entity)){ 
	// SHOULDN"T BE HERE
      }else{
	  // HQ: changing this to output an array
	array_push($subs, $entity[$sub]);
	//	$subs[$sub] = $entity[$sub];
      }
    }
  }
  //  if (empty($subs)) $subs = (object) null;
  $row['submissions'] = $subs;
  $ses[$row['id']] = $row; 
  
  if (!$row['scheduled']){
    $unscheduled[$row['id']] = $row; 
  }
}

while ($row = $scheduleTable->fetch_assoc()) {
  $slots[$row['date']][$row['time']][$row['room']]['locked'] = (bool) $row['locked'];
  if ($row['id'] == ""){
    $schedule[$row['date']][$row['time']][$row['room']] = (object) null;
  }else{
    $schedule[$row['date']][$row['time']][$row['room']][$row['id']] = $ses[$row['id']];
  }
}


$transactions = array();
while ($row = $transTable->fetch_assoc()) {
  $row["data"] = json_decode($row["data"], true);
  $row["previous"] = json_decode($row["previous"], true);
  array_unshift($transactions, $row);
}

$output = array('schedule' => $schedule, 
		'unscheduled' => (object)$unscheduled,
		'unscheduledSubmissions' => (object)$unscheduledSubmissions,
		'slots' => $slots,
		'transactions' => $transactions,
		'chairs' =>$chairs);

echo json_encode($output);

$mysqli->close();
?>