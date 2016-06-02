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

define("ENTITYFILE", "entitiesToAdd.json");

$mysqli = mysqli_connect(COBI_MYSQL_SERVER, COBI_MYSQL_USERNAME, COBI_MYSQL_PASSWORD, COBI_MYSQL_DATABASE);

createEntityTable($mysqli);

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

$mysqli->close();

?>
