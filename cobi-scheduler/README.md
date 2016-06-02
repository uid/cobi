cobi scheduling tool
======================

Directory structure
- p1.html: interface main HTML file
- backup: python script to dump the cobi database
- initDB: php scripts and json data files for loading all data into DB initally
- js: javascript files for all scheduling related operations
- php: php scripts for loading data to front end from db and changing db on scheduling operations
- pollDemo: API providing live feed of current schedule state
- settings: Database settings

Environment
- we set up 2 DBs, for dev/production respectively. Which gets created/used is determined by settings/settings.php

Setup
- in initDB directory, run "php createDb.php" to create user, transactions, schedule, session, author, and entity tables (authorsourcing data and sessionChairs handled manually at the moment). 
- run "php initDBfromJSON.php pineapple" to load contents of JSON files into database (currently hooked up to Michel's JSON files, from CHI 2013)
- run "php processAuthorsourcing [filename]" to create authorsourcing table and load authorsourcing data into it, where [filename] is from Authorsourcing-CHI2013.csv
- [optional and hacky] run "php assignChairs.php pineapple [filename]" to assign chairs to sessions. Assumes a sessionChairs table with the following schema:
+---------------+--------------+------+-----+---------+-------+
| Field         | Type         | Null | Key | Default | Extra |
+---------------+--------------+------+-----+---------+-------+
| authorId      | varchar(128) | YES  |     | NULL    |       |
| type          | varchar(128) | YES  |     | NULL    |       |
| id            | varchar(128) | YES  |     | NULL    |       |
| venue         | varchar(128) | YES  |     | NULL    |       |
| rank          | int(11)      | YES  |     | NULL    |       |
| givenName     | text         | YES  |     | NULL    |       |
| middleInitial | varchar(128) | YES  |     | NULL    |       |
| familyName    | text         | YES  |     | NULL    |       |
| email         | text         | YES  |     | NULL    |       |
| role          | varchar(128) | YES  |     | NULL    |       |
| primaryAff    | text         | YES  |     | NULL    |       |
| secondaryAff  | text         | YES  |     | NULL    |       |
| affinity      | text         | YES  |     | NULL    |       |
+---------------+--------------+------+-----+---------+-------+ 

Run
- open p1.html?uid=[userId], where userId is from users table


==============================
js directory
* CCOps.js: handles all constraint loading, checking, and resolution
* cobi.js: 
----maintains model for frontend
----proposeSwap/Move operations for frontend to call (that then call corresponding functions in CCOps)
----move/Swap operations for frontend to call that create transactions that are then handled by the transaction module
----DataOps module updates model based on transactions, in response to frontend operations
* db.js:
---- Transact module keeps consistent records of operations and handles updates
---- DB module handles data loading and updating via transactions, and has a refresh function for live polling

[TODO: add description of frontend js files]


==============================
php directory
- loadAUthorsourcing.php: load authorsourcing Data
- loadDBtoJSON: loading database files into a JSON for frontend
- loadDBtoJSONCompact.php: loading database state as JSON for polling
- loadUser.php/loadUsers.php: loading user data
- changeSchedule.php: handles all data changes in DB

==============================
pollDemo directory
- frontend.html/poll.js: demo for a client who wishes to get a live feed of the scheduling state.
- frontendDev.html/pollDev.js: for the developer to use on the server, URLs pointing to local refs
- loadSchedule.php: loads the current scheduling state (client can call the version of this file on the server)

