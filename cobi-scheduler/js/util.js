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

// detect if the current transaction is mine or not
function isTransactionMyChange(t) {
    return t.id == null;
}

// transaction type: session or paper level?
function isTransactionSessionLevel(t){
  return t.type.indexOf("Paper") === -1 && t.type.indexOf("Chair") === -1;
}

function isTransactionPaperLevel(t){
  return t.type.indexOf("Paper") !== -1;
}

function isTransactionChairLevel(t){
  return t.type.indexOf("Chair") !== -1;
}

function getUsernameByUID(uid){
	if (typeof uid == "undefined" || uid == null || uid == "" || typeof allUsers[uid] == "undefined")
		return "Anonymous User";
	else
		return allUsers[uid].name.substring(0,32);
}

function getCellLinkByID(id){
    var title = allSessions[id].title;
    title = (title.length > 30) ? (title.substring(0, 30) + "...") : title; 
    return $("<a/>").attr("href", "#").attr("data-session-id", id).addClass("session-link").html(title);
}

function getPaperCellLinkByID(id, paperId){
	var title;
	if (paperId != ""){
		title = allSubmissions[paperId].title;
		title = (title.length > 30) ? (title.substring(0, 30) + "...") : title; 
	} else {
		title = allSessions[id].title;
		title = (title.length > 30) ? (title.substring(0, 30) + "...") : title; 		
	}
	var $cell = $("<a/>").attr("href", "#").attr("data-submission-id", paperId).addClass("submission-link").html(title);
	if (typeof id !== "undefined")
		$cell.attr("data-session-id", id);
	return $cell;
}

function getChairCellLinkByID(id, chairId){
	var name;
	if (chairId != ""){
		name = displayChairName(allChairs[chairId], false);
		name = (name.length > 30) ? (name.substring(0, 30) + "...") : name; 
	} else {
		name = allSessions[id].title;
		name = (name.length > 30) ? (name.substring(0, 30) + "...") : name; 		
	}
	var $cell = $("<a/>").attr("href", "#").attr("data-chair-id", chairId).addClass("chair-link").html(name);
	if (typeof id !== "undefined")
		$cell.attr("data-session-id", id);
	return $cell;
}

function getCellLinkByDateTimeRoom(ldate, ltime, lroom){
  	return $("<a/>").attr("href", "#").attr("data-slot-date", ldate).attr("data-slot-time", ltime).attr("data-slot-room", lroom)
       .addClass("session-link").html(ldate + ", " + ltime + ", " + lroom); 
}


function getRandomColor(){
	return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
}

function isPlural(num){
	if (num == 0 || Math.abs(num) == 1)
		return false;
	return true;
}


function getSessionNumSubmissions(submissions){
	var key, count = 0;
	for (key in submissions){
		count++;
	}
	return count;
}

function isSpecialSession(session){
    switch(session.venue){
	    case 'panel':
	    case 'SIG':
	    case 'course':
	    case 'special':
	    case 'bof':
		return true;
    default:
		break;
    }
}

// HQ: added new durartion function
function getSessionDuration(session){
	if (isSpecialSession(session))
		return 80;

    var submissions = session.submissions;
    var key, count = 0;
    for (key in submissions){
	if(submissions[key].type == "TOCHI"){
	    count += 20;
	}else if(submissions[key].type == "paper"){
	    if(submissions[key].subtype == "Note"){
		count += 10;
	    }else{ // paper
		count += 20;
	    }
	}else if(submissions[key].type == "altchi"){
	    count += 20;
	}else if(submissions[key].type == "casestudy"){
	    count += 20;
	}
    }
    return count;
}

function displayChairName(chair, includePrefix){
	var name = includePrefix ? "Chair: " : "";
	if (typeof chair === "undefined" || chair == null || typeof chair.familyName === "undefined" || typeof chair.givenName === "undefined")
		return name + "N/A";
	return name  + chair.givenName + " " + chair.familyName;
}

function shortenDate(date){
	/*
	var str = "";
	
	if (date == "May 7, 2012")
	   str = "MON 5/7";
	else if (date == "May 8, 2012")
	   str = "TUE 5/8";
	else if (date == "May 9, 2012")
	   str = "WED 5/9";
	else if (date == "May 10, 2012")
	   str = "THU 5/10";
	*/
	// Monday -> Mon
	return date.substring(0,3); 
}	

 function getLength(item) {
      if (item === null || typeof item === "undefined")
           return 0;
      else 
           return item.length;
 }

function addSign(val){
	if (val > 0)
		return "+" + val;
	else
		return val;
}   

// Get outerHTML even when outerHTML is not available
function outerHTML(node){
	// if IE, Chrome take the internal method otherwise build one
	return node.outerHTML || (
	  	function(n){
		  var div = document.createElement('div'), h;
		  div.appendChild( n.cloneNode(true) );
		  h = div.innerHTML;
		  div = null;
		  return h;
	  	})(node);
}


// remove all data attributes from a DOM element
function removeDataAttributes($el){
    var attributes = $.map($el[0].attributes, function(item) {
        return item.name;
    });

    $.each(attributes, function(i, item) {
        if (item.indexOf("data") == 0)
            $el.removeAttr(item);
    });
}

// Locate an empty session by its date, time, and room
// Returns null when there is no such cell that's empty.
function findCellByDateTimeRoom(cellDate, cellTime, cellRoom){
    var cell = null;
    $("#program .slot").each(function(){
        if ($(this).attr("data-date") == cellDate && $(this).attr("data-time") == cellTime  && $(this).attr("data-room") == cellRoom)
            cell = $(this);
    });
    return cell;
}

// return a frontend cell with given ID
function findCellByID(id) {
    return $("#session-" + id); 
    /*
    $cell = null;
    $(".slot:not('.unavailable')").each(function(){
        if ($(this).attr("id").substr(8) == id)
            $cell = $(this);
    });
    return $cell;
    */
}

// Retrieve ID from a cell
// Returns -1 when it doesn't exist.
function getID(cell){
	if (typeof cell.attr("id") === "undefined")
		return -1;
	// substr(8) because we are adding "session-" in front of the ID
	return cell.attr("id").substr(8);
}

// Check if this cell has any special cell status class applied, which change the background color of the cell. (selected, recommended, ...)
function isSpecialCell($item){
	if ($item.hasClass("selected") || $item.hasClass("move-src-selected") || $item.hasClass("recommended"))
		return true;
	else
		return false;
}


function isEqualCell($cell1, $cell2) {
	return $cell1.get(0) == $cell2.get(0);
}

function isEqualDateTimeRoom(date1, time1, room1, date2, time2, room2) {
	return date1 == date2 && time1 == time2 && room1 == room2;
}


