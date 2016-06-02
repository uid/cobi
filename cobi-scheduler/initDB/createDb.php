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

include "../settings/settings.php";

mysql_connect(COBI_MYSQL_SERVER, COBI_MYSQL_USERNAME, COBI_MYSQL_PASSWORD);
@mysql_select_db(COBI_MYSQL_PASSWORD) or die( "Unable to select database");

				      

// Create user table
//  uid, name, email, type
$userQ = "CREATE TABLE users (uid varchar(32), name varchar(128), email varchar(128), type varchar(32))";
 mysql_query($userQ);
  echo mysql_error();

// Create transactions table
$transQ = "CREATE TABLE transactions (id MEDIUMINT NOT NULL AUTO_INCREMENT, uid varchar(32), type varchar(32), data text, previous text, PRIMARY KEY (id))"; 				      
				      mysql_query($transQ)
echo mysql_error();

// Create Schedule Table
// date, time, room, sessionID

$schedQ = "CREATE TABLE schedule (date varchar(128), time varchar(128), room varchar(128), id varchar(32), locked tinyint(1))";
mysql_query($schedQ);
echo  mysql_error();


 // // Create Session Table
 // id, chairAffiliations, chairs, coreCommunities, date, endTime, featuredCommunities, hasAward, hasHonorableMention,  notes, room, submissions, time, title, type, scheduled?

 $sessionQ = "CREATE TABLE session (id varchar(128), date varchar(128), time varchar(128), endTime varchar(128), chairAffiliations varchar(128), chairs text, coreCommunities text, featuredCommunities text, hasAward tinyint(1), hasHonorableMention tinyint(1), notes text, room varchar(128), submissions text, title text, type varchar(128), scheduled tinyint(1))";
 mysql_query($sessionQ);
 echo mysql_error();
 
// // Create Author Table
// author key, affiliations, email, firstName, lastName, middleName, submissions
// $authorQ = "CREATE TABLE author (authorKey varchar(128), affiliations text, email varchar(128), firstName varchar(128), lastName varchar(128), middleName varchar(128), submissions text)";
// mysql_query($authorQ);
// echo mysql_error();

 // // Create Entity Table
 // id, abstract, acmLink, authors, bestPaperAward, bestPaperNominee, cAndB, contactEmail, contactFirstName, contactLastName, coreCommunities, featuredCommunities, keywords, programNumber, session, title, type

  $entityQ = "CREATE TABLE entity (id varchar(128), abstract text,
  acmLink varchar(128), authors text, bestPaperAward tinyint(1),
  bestPaperNominee tinyint(1), cAndB text, contactEmail varchar(128),
  contactFirstName varchar(128), contactLastName varchar(128),
  coreCommunities text, featuredCommunities text, keywords text,
  programNumber varchar(128), session text, title text, type
  varchar(128))";

   mysql_query($entityQ); 
   echo mysql_error();

mysql_close();

?>