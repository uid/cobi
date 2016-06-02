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

if(count($argv) != 2 or $argv[1] != 'pineapple'){
  echo "wrong password" . "\n";
  exit(1);
}

$mysqli = mysqli_connect(COBI_MYSQL_SERVER, COBI_MYSQL_USERNAME, COBI_MYSQL_PASSWORD, COBI_MYSQL_DATABASE);

$query = "delete from initial_schedule";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

$query = "delete from initial_session";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

$query = "delete from initial_entity";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

$query = "delete from schedule";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

$query = "delete from session";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

$query = "delete from entity";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

$query = "delete from authors";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

$query = "delete from transactions";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

// Form the author table
$authorFile = file_get_contents('authors-2013-2-20-12-25-28.json');
$authorData = json_decode($authorFile, true);
$authorData = $authorData['rows'];

foreach ($authorData as $auth) {
  $authorId = mysqli_real_escape_string($mysqli, $auth['id']); 
  $type = mysqli_real_escape_string($mysqli, $auth['value']['type']          );
  
  foreach ($auth['value']['submissions'] as $detail){
    $venue = mysqli_real_escape_string($mysqli, $detail['venue']);
    $id = mysqli_real_escape_string($mysqli, $detail['id']);
    $rank = $detail['rank'];
    $givenName = mysqli_real_escape_string($mysqli, $detail['author']['givenName']);
    $middleInitial = mysqli_real_escape_string($mysqli, $detail['author']['middleInitial']);
    $familyName = mysqli_real_escape_string($mysqli, $detail['author']['familyName']);
    $email= mysqli_real_escape_string($mysqli, $detail['author']['email']);
    $role= mysqli_real_escape_string($mysqli, trim($detail['author']['role']));
    $primary =  mysqli_real_escape_string($mysqli, json_encode($detail['author']['primary']));
    $secondary = mysqli_real_escape_string($mysqli, json_encode($detail['author']['secondary']));
    $aquery = "INSERT INTO authors (authorId, type, id, venue, rank, givenName, middleInitial, familyName, email, role, primaryAff, secondaryAff) VALUES ('$authorId', '$type', '$id', '$venue', $rank, '$givenName', '$middleInitial', '$familyName', '$email', '$role', '$primary', '$secondary')";
    mysqli_query($mysqli, $aquery);
    echo  mysqli_error($mysqli);
    
    $authorHash[$authorId][$id] = array(
      "id" => $auth['id'],
      "givenName"     =>      $detail['author']['givenName'],
      "middleInitial" =>    $detail['author']['middleInitial'],  
      "familyName" =>    $detail['author']['familyName'],
      "email" =>        $detail['author']['email'],     
      "primary"=>  $detail['author']['primary'],
      "secondary"=>   $detail['author']['secondary'],   
      "rank"=>      $detail['rank'],
      "role"=>       trim($detail['author']['role']) 
					);
  }
}

// Form the schedule table
//schedule-2013-0-30-13-51-39.json
$scheduleFile = file_get_contents('schedule-2013-2-20-12-25-24.json');
//$scheduleFile = file_get_contents('schedule-2012-11-16-14-55-35.json');
$schedule = json_decode($scheduleFile, true);
$schedule = $schedule["rows"];

foreach ($schedule as $slot) {
  $slotId = $slot['id'];  
  $date = $slot['value']['day'];
  $time = $slot['value']['time'];
  $room = $slot['value']['room'];
  if($room == "242AB"){
    $room = "242A";
  }
  $id = $slot['value']['session'];
  
  $query = "INSERT INTO schedule (date, time, room, id, locked, slotId) VALUES ('$date', '$time', '$room', '$id', 0, '$slotId')"; 
  mysqli_query($mysqli, $query); 
  echo  mysqli_error($mysqli); 
}


// Form the entity table
$entityFile = file_get_contents('submissions-2013-2-20-12-25-16.json');
$entities = json_decode($entityFile, true);
$entities = $entities["rows"];
$awardHash = array();
$honorableHash = array();

foreach ($entities as $entity) {
  $eid = mysqli_real_escape_string($mysqli, $entity['id']); 
  $abstract = mysqli_real_escape_string($mysqli, $entity['value']['abstract']          );
  $acmLink   = "";
  $authors = array();
  $authorsInvolved = array();
  foreach ($entity['value']['authorList'] as $auth){
    if(!in_array($auth['id'], $authorsInvolved)){
      array_push($authorsInvolved, $auth['id']);
    }
  }
  foreach ($entity['value']['presenters'] as $auth){
    if(!in_array($auth['id'], $authorsInvolved)){
      array_push($authorsInvolved, $auth['id']);
    }
  }
  foreach ($authorsInvolved as $auth){
    if(array_key_exists($auth, $authorHash) and 
       array_key_exists($eid, $authorHash[$auth])){
      array_push($authors, $authorHash[$auth][$eid]);
    }else{
      die($auth . ',' . $eid);
    }
  }

  $authors             = mysqli_real_escape_string($mysqli, json_encode($authors)             );
  
  $bestPaperNominee = 0;
  $bestPaperAward = 0;
  if(array_key_exists("award", $entity['value'])){    
    $awardee      = $entity['value']['award']  ;
    if (strcasecmp($awardee, "Best") == 0){
      $awardHash[$entity['id']] = true;
      $bestPaperAward = 1;
    }else{
      $honorableHash[$entity['id']] = true;
      $bestPaperNominee = 1;
    }
  }
  $cAndB               = mysqli_real_escape_string($mysqli, json_encode($entity['value']['cbStatement']));
  $contactEmail        = mysqli_real_escape_string($mysqli, $entity['value']['contactEmail']        );
  $contactFirstName    = mysqli_real_escape_string($mysqli, $entity['value']['contactAuthor']    );
  $contactLastName    = mysqli_real_escape_string($mysqli, $entity['value']['contactAuthor']    );
  $coreCommunities     = mysqli_real_escape_string($mysqli, json_encode($entity['value']['communities'])     );
  $featuredCommunities = mysqli_real_escape_string($mysqli, json_encode(array()));
  $keywords            = mysqli_real_escape_string($mysqli, json_encode($entity['value']['authorKeywords'])            );
  $programNumber       = "";
  $session             = mysqli_real_escape_string($mysqli, json_encode($entity['value']['session'])             );
  $title               = mysqli_real_escape_string($mysqli, $entity['value']['title']               );
  $type                = mysqli_real_escape_string($mysqli, $entity['value']['venue']                );
  $subtype                = mysqli_real_escape_string($mysqli, $entity['value']['subtype']                );
  
  $equery = "INSERT INTO entity (id, abstract, acmLink, authors, bestPaperAward, bestPaperNominee, cAndB, contactEmail, contactFirstName, contactLastName, coreCommunities, featuredCommunities, keywords, programNumber, session, title, type, subtype) VALUES ('$eid', '$abstract', '$acmLink', '$authors', '$bestPaperAward', '$bestPaperNominee', '$cAndB', '$contactEmail', '$contactFirstName', '$contactLastName', '$coreCommunities', '$featuredCommunities', '$keywords', '$programNumber', '$session', '$title', '$type', '$subtype')";
	
  mysqli_query($mysqli, $equery);
  echo  mysqli_error($mysqli);
}

// Form the session table
$sessionsFile = file_get_contents('sessions-2013-2-20-12-25-20.json');
//
//sessions-2012-11-16-14-55-33.json');
$sessions = json_decode($sessionsFile, true);
$sessions = $sessions["rows"];

foreach ($sessions as $session) {
  $sid = mysqli_real_escape_string($mysqli, $session['id']); 

  if($session['value']['timeslot'] == "" or $session['value']['timeslot'] == null){
    $sdate = "";
    $stime = "";
    $sroom = "";
    $scheduled = 0;
  }else{
    $timeslot = explode(" ", $session['value']['timeslot']);
    $sdate = mysqli_real_escape_string($mysqli, $timeslot[0]);
    $stime = mysqli_real_escape_string($mysqli, $timeslot[1]);
    $sroom = mysqli_real_escape_string($mysqli, $timeslot[2]);
    $scheduled = 1;
  }
  if($sroom == "242AB"){
    $sroom = "242A";
  }
  $title = mysqli_real_escape_string($mysqli, $session['value']['title']);
  $venue = mysqli_real_escape_string($mysqli, $session['value']['venue']);
  $chairAffiliations = "";
  $chairs = mysqli_real_escape_string($mysqli, json_encode(array()));

  $notes = "";
  if(array_key_exists("rank", $session['value'])){
    $notes = mysqli_real_escape_string($mysqli, $session['value']['rank']); 
  }

  $coreCommunities = mysqli_real_escape_string($mysqli, json_encode(array()));
  if(array_key_exists('communities', $session['value'])){
    $coreCommunities = mysqli_real_escape_string($mysqli, json_encode($session['value']['communities']));
  }
  $personas = "";
  if(array_key_exists('track', $session['value'])){
    $personas = mysqli_real_escape_string($mysqli, $session['value']['track']);
  }
  $featuredCommunities = mysqli_real_escape_string($mysqli, json_encode(array()));
  $hasAward = 0;
  $hasHonorableMention = 0;
  foreach ($session['value']['content'] as $paperContent){
    if(array_key_exists($paperContent, $honorableHash)){
      $hasHonorableMention = 1;
    }
    if(array_key_exists($paperContent, $awardHash)){
      $hasAward = 1;
    }
  }

  $submissionKeys = mysqli_real_escape_string($mysqli, trim(implode(",", $session['value']['content'])));

  // add session id to the submissions
  foreach ($session['value']['content'] as $paperContent){
    $equery = "UPDATE entity SET session='$sid' where id='$paperContent'";
    mysqli_query($mysqli, $equery);
    echo  mysqli_error($mysqli);
  }
  
  
  $squery = "INSERT INTO session (id, date, time, chairAffiliations, chairs, coreCommunities, featuredCommunities, personas, hasAward, hasHonorableMention, notes, room, submissions, title, venue, scheduled) VALUES ('$sid', '$sdate', '$stime', '$chairAffiliations', '$chairs', '$coreCommunities', '$featuredCommunities', '$personas', '$hasAward', '$hasHonorableMention', '$notes', '$sroom', '$submissionKeys', '$title', '$venue', '$scheduled')";
  mysqli_query($mysqli, $squery);
  echo  mysqli_error($mysqli);
}



/* /\* 	// Form the author table *\/ */
/* /\* 	// decided it's not needed! *\/ */
/* /\* 	// todo: note: don't insert same author twice? *\/ */
/* /\* 	foreach ($subdata['authors'] as $authorKey => $authordata) { *\/ */
/* /\* 	  $author = mysqli_real_escape_string($mysqli, $authorKey);  *\/ */
/* /\* 	  $affiliations = mysqli_real_escape_string($mysqli, json_encode($authordata['affiliations'])); *\/ */
/* /\* 	  $email = mysqli_real_escape_string($mysqli, $authordata['email']); *\/ */
/* /\* 	  $firstName = mysqli_real_escape_string($mysqli, $authordata['firstName']); *\/ */
/* /\* 	  $lastName = mysqli_real_escape_string($mysqli, $authordata['lastName']); *\/ */
/* /\* 	  $middleName = mysqli_real_escape_string($mysqli, $authordata['middleName']); *\/ */
/* /\* 	  $submissions = mysqli_real_escape_string($mysqli, json_encode($authordata['submissions'])); *\/ */

/* /\* 	  $aquery = "INSERT INTO author (authorKey, affiliations, email, firstName, lastName, middleName, submissions) VALUES ('$author', '$affiliations', '$email', '$firstName', '$lastName', '$middleName', '$submissions')"; *\/ */
/* /\* 	  mysqli_query($mysqli, $aquery); *\/ */
/* /\* 	  echo  mysqli_error($mysqli); *\/ */
/* /\* 	} *\/ */
/*       } */
/*     } */
/*   } */
/* } */

// duplicate the tables into initial tables
 $query = "CREATE TABLE initial_schedule LIKE schedule"; 
 mysqli_query($mysqli, $query); 
 echo  mysqli_error($mysqli); 

$query = "INSERT initial_schedule SELECT * FROM schedule";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

// duplicate the tables into initial tables
$query = "CREATE TABLE initial_session LIKE session"; 
 mysqli_query($mysqli, $query);
 echo  mysqli_error($mysqli); 

$query = "INSERT initial_session SELECT * FROM session";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

 // duplicate the tables into initial tables 
 $query = "CREATE TABLE initial_entity LIKE entity"; 
 mysqli_query($mysqli, $query); 
 echo  mysqli_error($mysqli); 

$query = "INSERT initial_entity SELECT * FROM entity";
mysqli_query($mysqli, $query);
echo mysqli_error($mysqli);

$mysqli->close();

?>