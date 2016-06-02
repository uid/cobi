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
var newAuth = 200000;
var authordata;
var CHAIRFILE = "chairs.json";

connection.connect();
connection.query('SELECT id, given_name, family_name from pcs_authors', function(err, rows, fields) {
    if (err) throw err;
    var PCS = rows;
    authordata = require("./authors.json");
    chairdata = [];
    loadPCs(PCS);
    
});

connection.end();


function loadPCs(PCS){
    var parser = csv();
    parser.on("record", function (row, index){
	chairdata.push(row);
    }); 
    parser.from.options({
	columns: true,
	delimiter: '\t'
    });
    parser.from('CSCWPC.txt');
    parser.on("end", function(){
	attachAuthorData(chairdata, PCS);
	var output = [];
	for (var i = 0; i < chairdata.length; i++){
	    var chair = chairdata[i];
	    var chairArray = chair['PC Member (67)'].split(', ');
	    var d = {
		'authorId': chairdata[i].id,
		'givenName': chairArray[1],
		'familyName': chairArray[0],
		'id' : '',
		'middleInitial' : '',
		'affinity' : '{}'
	    }
	    output.push(d);
	}
	
	
	fs.writeFile(CHAIRFILE, JSON.stringify(output, null, 4), function(err) {});});

}

function attachAuthorData(chairs, PCS){
    for(var i = 0; i < chairs.length; i++){
	var id = lookUpChair(chairs[i], PCS);

	if(id != null){
	    chairs[i].id = id;
	}else{
	    chairs[i].id = 'chair' + newAuth;
	    newAuth+=1;
	}
    }
    return chairs;
}

function lookUpChair(chair, PCS){
    var chairArray = chair['PC Member (67)'].split(', ');
//    console.log(chairArray);
    var matches = authordata.filter(function(x){
	return ((x.givenName==chairArray[1]) &&
		(x.familyName==chairArray[0]));
    });
    
    if(matches.length > 0){
	return matches[0].authorId
    }else{
	// in PCS
	matches = PCS.filter(function(x){
	    return ((x.given_name == chairArray[1]) &&
		    (x.family_name == chairArray[0]));
	});
	if (matches.length > 0){
	    return matches[0].id
	}else{
	    return null;
	}
    }		
}