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

var csv = require("csv");
var fs = require('fs');

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'HOSTNAME',
    user     : 'USER',
    password : 'PASSWORD',
    database : 'DATABASENAME'
});

var honorableMentions = ['cscw223',
			 'cscw431',
			 'cscw471',
			 'cscw527',
			 'cscw128',
			 'cscw147',
			 'cscw204',
			 'cscw209',
			 'cscw299',
			 'cscw358',
			 'cscw411',
			 'cscw432',
			 'cscw588',
			 'cscw599',
			 'cscw609'
			];

var bestPapers =  ['cscw240',
		   'cscw244',
		   'cscw285',
		   'cscw389'];

connection.connect();
connection.query('SELECT id, session from entity', function(err, rows, fields) {
    if (err) throw err;

    // do best papers
    for(var i = 0; i < bestPapers.length; i++){
	var p = bestPapers[i];
	var query1 = "UPDATE entity SET bestPaperAward=1 where id='" + p + "';";
	var s = (rows.filter(function (x) { return x.id == p }))[0].session;
	var query2 = "UPDATE session SET hasAward=1 where id='" + s + "';";


	connection.query(query1, function(err, rows, fields) {});
	connection.query(query2, function(err, rows, fields) {});
    }

    // do honorable mentions
    for(var i = 0; i < honorableMentions.length; i++){
	var p = honorableMentions[i];
	var query1 = "UPDATE entity SET bestPaperNominee=1 where id='" + p + "';";
	var s = (rows.filter(function (x) { return x.id == p }))[0].session;
	var query2 = "UPDATE session SET hasHonorableMention=1 where id='" + s + "';";

	connection.query(query1, function(err, rows, fields) {});
	connection.query(query2, function(err, rows, fields) {});
    }
    
    connection.end();
});


