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
var typeMatch = {
    'panel': {'prefix': 'pan',
	      'start' : 100}
}
var newAuth = 100000;

var ENTITYFILE = "entitiesToAdd.json";
var entityData = [];

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'HOSTNAME',
    user     : 'USER',
    password : 'PASSWORD',
    database : 'DATABASENAME'
});

connection.connect();
connection.query('SELECT id, given_name, family_name from pcs_authors', function(err, rows, fields) {
    if (err) throw err;
    var PCS = rows;
    authordata = require("./authors.json");
    loadPanels(PCS);
});
connection.end();

function loadPanels(PCS){
    var parser = csv();
    parser.on("record", function (row, index){
	   entityData.push(row);
	}); 
    parser.from.options({
	columns: true
    });
    parser.from('CSCWPanel.csv');
    parser.on("end", function(){
	attachAuthorData(entityData, PCS);
	var entities = createEntityData(entityData);
	fs.writeFile(ENTITYFILE, JSON.stringify(entities, null, 4), function(err) { return;});
	return;
    });
}

function attachAuthorData(entities, PCS){
    for(var i = 0; i < entities.length; i++){

	var entity = entities[i];
	var authors = entities[i]['Authors'].split(', ');
	var authorsData = [];
	
	for(var j = 0; j < authors.length; j++){

	    var authorData = {};
	    var ret = lookUpAuthor(authors[j], PCS);
	    if(ret != null){
		authorData = ret.content
	    }else{
		authorData = {
		    "id": 'auth' + newAuth,
		    "type": "author",
		    "venue": "",
		    "rank": 1,
		    "givenName": authors[j],
		    "middleInitial": "",
		    "familyName": "",
		    "email": "",
		    "role": "",
		    "primary": {},
		    "secondary": {}};
		newAuth+=1;
	    }
	    authorsData.push(authorData);
	}
	entities[i]['authorData'] = authorsData;
    }
}


function attachVenue(e, type){
    for(var i = 0; i < e.length; i++){
	e[i].venue = type;
    }
    return e;
}

function createEntityData(data){
    var entities = [];
    for(var i = 0; i < data.length; i++){
	var ent = data[i];
	var entity = {
	    "id" : typeMatch[ent.Type].prefix + typeMatch[ent.Type].start,
	    "title": ent.Title,
	    "abstract" : "",
	    "acmLink" : "",
	    "authors" : attachVenue(ent.authorData, ent.Type),
	    "cbStatement" : "",
	    "contactEmail" : "",
	    "contactFirstName" : "",
	    "contactLastName" : "",
	    "keywords" : "",
	    "venue" : ent.Type,
	    "subtype" : ent.Type,
	    "session" : "null",
	    "communities" : []
	}
	typeMatch[ent.Type].start += 1; 
	entities.push(entity);
    }
    return entities;
}

function lookUpAuthor(author, PCS){
    if(author.indexOf('.') != -1){
	author = author.split(/(\s).+\s/).join("")
    }

    var matches = authordata.filter(function(x){
	var constructedName = x.givenName + " " + x.familyName;
	return constructedName == author;
    });
    
    if(matches.length > 0){
	console.log("matched with authors!");
	return {'id': matches[0].authorId, 
		'content': {
		    "id": matches[0].authorId,
		    "type": "author",
		    "venue": "",
		    "rank": 1,
		    "givenName": matches[0].givenName,
		    "middleInitial": matches[0].middleInitial,
		    "familyName": matches[0].familyName,
		    "email": matches[0].email,
		    "role": "",
		    "primary": matches[0].primary,
		    "secondary": matches[0].secondary
		}
	       } 
    }else{
	// in PCS
	matches = PCS.filter(function(x){
	    var constructedName = x.given_name + " " + x.family_name;
	    return constructedName == author;
			     
	});
	if (matches.length > 0){
	    return {
		'id': matches[0].id,
		'content': {
		    "id": matches[0].id,
		    "type": "author",
		    "venue": "",
		    "rank": 1,
		    "givenName": matches[0].given_name,
		    "middleInitial": matches[0].middle_initial,
		    "familyName": matches[0].family_name,
		    "email": "", 
		    "role": "",
		    "primary": {},
		    "secondary": {},
		}
	    } 
	}else{
	    console.log("no match");
	    return null;
	}
    }		
    return;
}