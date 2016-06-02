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

define("AUTHORFILE", "authors.json");
define("ENTITYFILE", "entities.json");
define("SESSIONFILE", "sessions.json");
define("SCHEDULEFILE", "schedule.json");

$mysqli = mysqli_connect(COBI_MYSQL_SERVER, COBI_MYSQL_USERNAME, COBI_MYSQL_PASSWORD, COBI_MYSQL_DATABASE);


clearTables($mysqli);
createAuthorTable($mysqli);
createEntityTable($mysqli);
createSessionTable($mysqli);
createScheduleTable($mysqli);
makeInitialTables($mysqli);

function clearTables($mysqli){
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
}

function createAuthorTable($mysqli) {
	 // Create author table
	 $authorFile = file_get_contents(AUTHORFILE);
	 $authorData = json_decode($authorFile, true);
	 foreach ($authorData as $author) {
	   $authorId = mysqli_real_escape_string($mysqli, $author["authorId"]);
	   $type = mysqli_real_escape_string($mysqli, $author["type"]);
	   $id = mysqli_real_escape_string($mysqli, $author["id"]);
		$rank = $author["rank"];
		$givenName = mysqli_real_escape_string($mysqli, $author["givenName"]);
		$middleInitial = mysqli_real_escape_string($mysqli, $author["middleInitial"]);
		$familyName = mysqli_real_escape_string($mysqli, $author["familyName"]);
		$email = mysqli_real_escape_string($mysqli, $author["email"]);
		$venue = mysqli_real_escape_string($mysqli, $author["venue"]);
		$role = mysqli_real_escape_string($mysqli, $author["role"]);
		$primary =  mysqli_real_escape_string($mysqli, json_encode($author['primary']));
		$secondary = mysqli_real_escape_string($mysqli, json_encode($author['secondary']));
		
		$aquery = "INSERT INTO authors (authorId, type, id, venue, rank, givenName, middleInitial, familyName, email, role, primaryAff, secondaryAff) VALUES ('$authorId', '$type', '$id', '$venue', $rank, '$givenName', '$middleInitial', '$familyName', '$email', '$role', '$primary', '$secondary')";

		mysqli_query($mysqli, $aquery);
		echo  mysqli_error($mysqli);

		$authorHash[$authorId][$id] = array(
		      "id"            => $author['id'],
		      "givenName"     => $author['givenName'],
		      "middleInitial" => $author['middleInitial'],  
		      "familyName"    => $author['familyName'],
		      "email"         => $author['email'],     
		      "primary"       => $author['primary'],
                      "secondary"     => $author['secondary'],   
                      "rank"          => $author['rank'],
                      "role"          => $author['role']); 
	}
	return $authorHash;
}		      

function createEntityTable($mysqli) {
	 $entityFile = file_get_contents(ENTITYFILE);
	 $entityData = json_decode($entityFile, true);
	 foreach ($entityData as $sub) {
	 	$id = mysqli_real_escape_string($mysqli, $sub["id"]);
		$abstract = mysqli_real_escape_string($mysqli, $sub["abstract"]);
		$acmLink   = mysqli_real_escape_string($mysqli, $sub["acmLink"]);
		$authors = mysqli_real_escape_string($mysqli, json_encode($sub["authors"]));		
		$bestPaperNominee = 0;
		$bestPaperAward = 0;
		$cAndB = mysqli_real_escape_string($mysqli, $sub['cbStatement']);
		$contactEmail = mysqli_real_escape_string($mysqli, $sub['contactEmail']);
                $contactFirstName = mysqli_real_escape_string($mysqli, $sub['contactFirstName']);
                $contactLastName = mysqli_real_escape_string($mysqli, $sub['contactLastName']);
		$coreCommunities = mysqli_real_escape_string($mysqli, json_encode($sub['communities']));
		$featuredCommunities = mysqli_real_escape_string($mysqli, json_encode(array()));
		$keywords            = mysqli_real_escape_string($mysqli, json_encode($sub['keywords']));       
                $programNumber       = "";
                $session             = mysqli_real_escape_string($mysqli, $sub['session']);
		$title               = mysqli_real_escape_string($mysqli, $sub['title']               );
		$type                = mysqli_real_escape_string($mysqli, $sub['venue']              );
	        $subtype             = mysqli_real_escape_string($mysqli, $sub['subtype']            );
                $equery = "INSERT INTO entity (id, abstract, acmLink, authors, bestPaperAward, bestPaperNominee, cAndB, contactEmail, contactFirstName, contactLastName, coreCommunities, featuredCommunities, keywords, programNumber, session, title, type, subtype) VALUES ('$id', '$abstract', '$acmLink', '$authors', '$bestPaperAward', '$bestPaperNominee', '$cAndB', '$contactEmail', '$contactFirstName', '$contactLastName', '$coreCommunities', '$featuredCommunities', '$keywords', '$programNumber', '$session', '$title', '$type', '$subtype')";
		  
	        mysqli_query($mysqli, $equery);
                echo  mysqli_error($mysqli);
	}
}

function createSessionTable($mysqli) {
 	 $sessionFile = file_get_contents(SESSIONFILE);
	 $sessionData = json_decode($sessionFile, true);
	 foreach ($sessionData as $session) {
    	   $id = mysqli_real_escape_string($mysqli, $session["id"]);
           $date = mysqli_real_escape_string($mysqli, $session["date"]);
	   $time = mysqli_real_escape_string($mysqli, $session["time"]);
	   $room = mysqli_real_escape_string($mysqli, $session["room"]);
	   $chairAffiliations = "";
	   $chairs = "";
   	   $coreCommunities = mysqli_real_escape_string($mysqli, json_encode($session['communities']));
	   $featuredCommunities = mysqli_real_escape_string($mysqli, json_encode(array()));
	   $personas = mysqli_real_escape_string($mysqli, $session["persona"]);
	   $hasAward = 0;     
	   $hasHonorableMention = 0;
	   $notes = "";
	   $submissionKeys = mysqli_real_escape_string($mysqli, $session["submissions"]); // comma delimited list of sub ids
	   $title = mysqli_real_escape_string($mysqli, $session["title"]);
	   $venue = mysqli_real_escape_string($mysqli, $session["venue"]);
	   $scheduled = mysqli_real_escape_string($mysqli, $session["scheduled"]);

   	   $squery = "INSERT INTO session (id, date, time, chairAffiliations, chairs, coreCommunities, featuredCommunities, personas, hasAward, hasHonorableMention, notes, room, submissions, title, venue, scheduled) VALUES ('$id', '$date', 'stime', '$chairAffiliations', '$chairs', '$coreCommunities', '$featuredCommunities', '$personas', '$hasAward', '$hasHonorableMention', '$notes', '$room', '$submissionKeys', '$title', '$venue', '$scheduled')";
	   mysqli_query($mysqli, $squery);
	   echo  mysqli_error($mysqli);
	 }	 
}

function createScheduleTable($mysqli){
	 $scheduleFile = file_get_contents(SCHEDULEFILE);
	 $schedule = json_decode($scheduleFile, true);

	 foreach ($schedule as $slot) {
	     $slotId = $slot['id'];  
             $date = $slot['date'];
             $time = $slot['time'];
             $room = $slot['room'];
	     $id = $slot['sessionId'];

	     $query = "INSERT INTO schedule (date, time, room, id, locked, slotId) VALUES ('$date', '$time', '$room', '$id', 0, '$slotId')"; 
	     mysqli_query($mysqli, $query); 
	     echo  mysqli_error($mysqli);  
	 }
}

function makeInitialTables($mysqli){
	 $query = "INSERT initial_schedule SELECT * FROM schedule";
	 mysqli_query($mysqli, $query);
	 echo mysqli_error($mysqli);

	 $query = "INSERT initial_session SELECT * FROM session";
	 mysqli_query($mysqli, $query);
	 echo mysqli_error($mysqli);

	 $query = "INSERT initial_entity SELECT * FROM entity";
	 mysqli_query($mysqli, $query);
	 echo mysqli_error($mysqli);
}

$mysqli->close();

?>