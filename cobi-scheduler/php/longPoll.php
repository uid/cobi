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

$uid = mysqli_real_escape_string($mysqli, $_POST['uid']);
$clientId = mysqli_real_escape_string($mysqli, $_POST['transactionId']);

while (true){
  // Get the transactions table
  $transQ = "select id, transactions.uid, transactions.type, data, previous, name from transactions LEFT JOIN (users) ON (users.uid=transactions.uid) where id > $clientId order by id DESC";
  $transTable =  mysqli_query($mysqli, $transQ);
  echo mysqli_error($mysqli);
  
  if(mysqli_num_rows($transTable) == 0){// No updates
    sleep(2);
  }else{
    // Get the schedule table
    $scheduleQ = "select * from schedule"; 
    $scheduleTable = mysqli_query($mysqli, $scheduleQ);
    echo mysqli_error($mysqli);
    
    // Get unscheduled sessions
    $sessionUQ = "select * from session where scheduled=0"; 
    $sessionUnscheduledTable = mysqli_query($mysqli, $sessionUQ);
    echo mysqli_error($mysqli);
    
    // Forming unscheduled data
    $unscheduled = array();
    while ($row = $sessionUnscheduledTable->fetch_assoc()) {
      $unscheduled[$row['id']] = $row; 
    }
    
    // Get unscheduled sessions
    $entityQ = "select * from entity where session='null'"; 
    $entityUnscheduledTable = mysqli_query($mysqli, $entityQ);
    echo mysqli_error($mysqli);

    // Forming unscheduled data
    $unscheduledSubmissions = array();
    while ($row = $entityUnscheduledTable->fetch_assoc()) {
      $unscheduledSubmissions[$row['id']] = $row; 
    }
    
    // Get the session table with submissions only
    $sessionQ = "select id,submissions from session"; 
    $sessionTable = mysqli_query($mysqli, $sessionQ);
    echo mysqli_error($mysqli);
    
    while ($row = $sessionTable->fetch_assoc()) {
      $subKeys = explode(",", trim($row['submissions']));
      $subs = array();
      
      foreach ($subKeys as $sub){
	if ($sub == ""){
	}else{
	  array_push($subs, $sub);
	}
      }
      
      //  if (empty($subs)) $subs = (object) null;
      $row['submissions'] = $subs;
      $ses[$row['id']] = $row; 
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
		    'unscheduled' => $unscheduled,
		    'unscheduledSubmissions' => $unscheduledSubmissions,
		    'slots' => $slots,
		    'transactions' => $transactions);
    
    echo json_encode($output);
  }
}

$mysqli->close();
?>