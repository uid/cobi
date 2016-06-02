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
function TransactionData(uid, type, data, previousType, previous){
    this.id = null;
    this.uid = uid;
    this.localHash = $.md5($.now());
    this.type = type;
    this.previousType = previousType;
    this.data = data;
    this.previous = previous;
}

var Transact = function(){
    function addTransaction(t){
	localTransactions.push(t);
	DataOps.handleTransaction(t);
	Polling.transactionUpdate(localTransactions[localTransactions.length -1]);
//	$(document).trigger('transactionUpdate', []]);	
	db.addTransaction(t);
	return;
    }
    function addServerTransaction(t){
//	console.log("incoming server transaction");
//	console.log(t);
	if(transactions.length == 0 || t.id > transactions[transactions.length - 1].id){
	    transactions.push(t);
	    DataOps.handleTransaction(t); // TODO: check for case where this couldn't be applied
	    Polling.transactionUpdate(transactions[transactions.length -1]);
	    //$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);	
	}else{ // must be some action I did that is already incorporated?
//	    console.log("must be some action I already incorporated?");
	}
	return;
    }
    function completedLocalTransaction(t){
	// add server's changes, and 
	transactions.push(t);
	// mark local one as done (give it the ID?)
//	console.log('this was accepted:' + JSON.stringify(t));
	for (var i = 0; i < localTransactions.length; i++){
	    if (localTransactions[i].localHash == t.localHash) {
		localTransactions[i].id = t.id;
	    }
	}
	// tell view
	Polling.transactionAccepted(transactions[transactions.length -1]);
//	$(document).trigger('transactionAccepted', []);	
	return;
    }
    
    function failedLocalTransaction(t){
	//console.log("FAILED TRANSACTION: " + JSON.stringify(t));
	// TODO: handle case where it was somewhere in the middle and view depends on it to be in order (e.g., undoing this move doesn't work because of some other move?)
	
	DataOps.handleFailedTransaction(t);
	Polling.transactionFailed(t);
	//$(document).trigger('transactionFailed', t);	
	
	for(var i = 0; i < localTransactions.length; i++){
	    if(localTransactions[i].localHash == t.localHash){
		localTransactions.splice(i, 1);
		break;
	    }
	}
    }
    
    function lastRecordedTransaction(){
	var transactionId = 0;
	if(transactions.length > 0) 
	    transactionId = transactions[transactions.length -1]['id'];
	return transactionId;
    }

    return {
	addTransaction: addTransaction,
	addServerTransaction: addServerTransaction,
	completedLocalTransaction: completedLocalTransaction,
	failedLocalTransaction: failedLocalTransaction,
	lastRecordedTransaction: lastRecordedTransaction
    };
}();

// Include code that interacts with the backend DB
function DB(){
}
var db = new DB();

DB.prototype.addTransaction = function(t){
    $.ajax({
 	async: true,
	type: 'POST',
	data: { transaction: JSON.stringify(t),
		lastKnownTransaction: Transact.lastRecordedTransaction()},
	url: "./php/changeSchedule.php",
	success: function(m){		
	    
	    if(m['transaction'].id != null){
		// add server transactions 
		// (TODO: assuming no rollback needed)
		for(var i = 0; i < m['newTransactions'].length; i++){
		    Transact.addServerTransaction(m['newTransactions'][i]);
		}
		Transact.completedLocalTransaction(m['transaction']);
	    }else{
		Transact.failedLocalTransaction(m['transaction']);
		for(var i = 0; i < m['newTransactions'].length; i++){
		    Transact.addServerTransaction(m['newTransactions'][i]);
		}
	    }
 	},
	error : function(m){
	    console.log("error: " + JSON.stringify(m));
	},
	dataType: "json"
    });
};


// DB.prototype.refresh = function(){
// 	//var transactionId = 0;
// //	if(transactions.length > 0) transactionId = transactions[transactions.length -1]['id'];


//     // Long polling to check for changes
//     (function poll(e){
// 	console.log("Polling with id: " + e.transactionId);
// 	$.ajax({ url: "./php/longPoll.php", 
// 		 type: 'POST', 
// 		 data: {uid: e.uid, transactionId: e.transactionId},   
// 		 error: function(m){
// 		     console.log(m);
// 		 },
// 		 success: function(m){
// 		     // something has changed
// 		     if(m != null){
// 			 var serverSchedule = m['schedule'];
// 			 var serverUnscheduled = m['unscheduled'];
// 			 var serverSlots = m['slots'];
// 			 var serverTransactions = m['transactions'];
// 			 var serverUnscheduledSubmissions = m['unscheduledSubmissions'];
// 			 console.log("Poll has returned");
// 			 console.log(serverTransactions);
			 
// 			 if(schedule != null){
// 			     var consistencyReport = checkConsistent(serverSchedule, 
// 								     serverUnscheduled,
// 								     serverUnscheduledSubmissions,
// 								     serverSlots, 
// 								     serverTransactions);
// 			     if(consistencyReport.isConsistent){
// 				 console.log("still consistent");
// 			     }else{
// 				 //console.log("there is an inconsistency in data!");
// 			     }
// 			 }
// 		     }else{// nothing changed, nothing to do
// 			 console.log("nothing changed");
// 		     }
// 		 }, dataType: "json", complete: function() { poll((function(){
// 		     if(transactions.length == 0){
// 		      	 return {uid: userData.id, transactionId: 0};
// 		     }else{
// 			 return {uid: userData.id, transactionId: transactions[transactions.length -1]['id']};
// 		     }})())}, timeout: 30000 });
//     })((function(){
//  	if(transactions.length == 0){
//  	    return {uid: userData.id, transactionId: 0};
//  	}else{
//  	    return {uid: userData.id, transactionId: transactions[transactions.length -1]['id']};
//  	}})());
// };

DB.prototype.refresh = function(){
    // Traditional polling to check for changes
    (function poll(e){
//	console.log("polling with " + e.transactionId);
	setTimeout(function(){
		$.ajax({    url: "./php/loadDBtoJSONCompact.php",
			    type: 'POST',
			    data: {uid: e.uid, transactionId: e.transactionId},   
			    success: function(m){
			    // something has changed
			    if(m != null){
				var serverSchedule = m['schedule'];
				var serverUnscheduled = m['unscheduled'];
				var serverSlots = m['slots'];
				var serverTransactions = m['transactions'];
				var serverUnscheduledSubmissions = m['unscheduledSubmissions'];
				if(schedule != null){
				    var consistencyReport = checkConsistent(serverSchedule, 
									    serverUnscheduled,
									    serverUnscheduledSubmissions,
									    serverSlots, 
									    serverTransactions);
				    if(consistencyReport.isConsistent){
	//				console.log("still consistent");
				    }else{
					//				    alert("there is an inconsistency in data!");
				    }
				}
			    }else {
//				console.log("nothing changed");
			    }
			    poll((function(){
				    if(transactions.length == 0){
					return {uid: userData.id, transactionId: 0};
				    }else{
					return {uid: userData.id, transactionId: transactions[transactions.length -1]['id']};
				    }})());
			    }, 
			    error : function(m){
				console.log("error:" + JSON.stringify(m));
				poll((function(){
				    if(transactions.length == 0){
					return {uid: userData.id, transactionId: 0};
				    }else{
					return {uid: userData.id, transactionId: transactions[transactions.length -1]['id']};
				    }})());
			    },
			    dataType: "json"});
	}, 15000);
    })((function(){
	    if(transactions.length == 0){
		return {uid: userData.id, transactionId: 0};
	    }else{
		return {uid: userData.id, transactionId: transactions[transactions.length -1]['id']};
	    }})());
};

DB.prototype.loadUsers = function(uid){
    $.ajax({
	async: true,
	type: 'POST',
	url: "./php/loadUsers.php",
	success: function(m){
	    if(m != null){
		allUsers = m;
	    }else{
	    }
	},
	error : function(m){
	    console.log(JSON.stringify(m));
	},
	dataType: "json"
    });
};

DB.prototype.loadUser = function(uid){
    $.ajax({
	    async: true,
	    type: 'POST',
	    data: {uid: uid},   
	    url: "./php/loadUser.php",
	    success: function(m){
		if(m != null){
		    userData = new userInfo(m['uid'], m['name'], m['email'], m['type']);
		}else{
		    //		    userData = new userInfo(null, "Anon", null, "rookie");
		}
		$(document).trigger('userLoaded');
	    },
	    error : function(m){
		console.log(JSON.stringify(m));
	    },
	    dataType: "json"
	});
};

DB.prototype.loadSchedule = function(){
	// Read data from the server
    //function loadSchedule(){
    // load scheduled sessions
    $.ajax({
	    async: true,
	    type: 'GET',
	    url: "./php/loadDBtoJSON.php",
	    success: function(m){
		initAfterScheduleLoads(m);
	    },
	    error : function(m){
		console.log(JSON.stringify(m));
	    },
	    dataType: "json"
	});
};

// DB.prototype.undo = function(uid){
//     $.ajax({
//  	    async: true,
// 		type: 'POST',
// 		data: { type: 'undo', 
// 			uid: uid,
// 	         }, 
// 		url: "./php/changeSchedule.php",
// 		success: function(m){
// 		if(m == null){
// 		    //alert("You do not have undo privileges");
// 		}else{
		    
// 		    // should return something like 
// 		    // checkConsistency...
// 		}
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }    


// DB.prototype.toggleSlotLock = function(date, time, room, lock, uid){
//     $.ajax({
//  	    async: true,
// 		type: 'POST',
// 		data: { type: 'lock', 
// 			uid: uid,
// 		    lock: lock,
// 		    date: date,
// 		    time: time,
// 		    room: room
// 		    }, 
// 		url: "./php/changeSchedule.php",
// 		success: function(m){
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 		error : function(m){
// 		alert("lock error: " + JSON.stringify(m));
// 	    },
// 		dataType: "json"
// 		});
// }    

//     DB.prototype.unscheduleSession = function(id, date, time, room, uid){
//     $.ajax({
//  	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'unschedule', 
// 		    uid: uid,
// 		    id: id,
// 		    date: date,
// 		    time: time,
// 		    room: room
// 	    }, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){
// 	    	console.log("unscheduleSession success", m);
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }; 

// DB.prototype.scheduleSession = function(id, date, time, room, uid){
//     $.ajax({
//  	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'schedule', 
// 		    id: id,
// 		    date: date,
// 		    time: time,
// 		    room: room,
// 		    uid: uid}, 
// 		url: "./php/changeSchedule.php",
// 		success: function(m){		
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 		error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 		dataType: "json"
// 	});
// };

// DB.prototype.moveSession = function(id, date, time, room, tdate, ttime, troom, uid){
//     $.ajax({
//  	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'move', 
// 		    id: id,
// 		    sdate: date,
// 		    stime: time,
// 		    sroom: room,
// 		    tdate: tdate,
// 		    ttime: ttime,
// 		    troom: troom,
// 		    uid: uid}, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){		
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// };


// DB.prototype.swapSession = function(s1id, s1date, s1time, s1room, 
// 				    s2id, s2date, s2time, s2room, uid){
    
//     $.ajax({
//  	    async: true,
// 		type: 'POST',
// 		data: { type: 'swap', 
// 			s1id: s1id,
// 			s1date: s1date,
// 			s1time: s1time,
// 			s1room: s1room,
// 			s2id: s2id,
// 			s2date: s2date,
// 			s2time: s2time,
// 			s2room: s2room,
// 			uid: uid
// 	    }, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){

// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }

// DB.prototype.swapWithUnscheduledSession = function(s1id, 
// 						   s2id, s2date, s2time, s2room, uid){
    
//     $.ajax({
//  	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'swapWithUnscheduled', 
// 		    s1id: s1id,
// 		    s2id: s2id,
// 		    s2date: s2date,
// 		    s2time: s2time,
// 		    s2room: s2room,
// 		    uid: uid
// 	    }, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }
    
// ////// paper level operations
//     DB.prototype.reorderPapers = function(id, newPaperOrder, previousPaperOrder, uid){
//     $.ajax({
// 	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'reorderPapers',
// 		    id: id,
// 		    newPaperOrder: newPaperOrder.join(),
// 		    previousPaperOrder: previousPaperOrder.join(),
// 		    uid: uid
// 	    }, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }
    
// DB.prototype.swapPapers = function(s1id, p1id, s2id, p2id, uid){
//     $.ajax({
// 	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'swapPapers',
// 		    s1id: s1id,
// 		    p1id: p1id,
// 		    s2id: s2id,
// 		    p2id: p2id,
// 		    uid: uid
// 	    }, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }

// DB.prototype.swapWithUnscheduledPaper = function(p1id, s2id, p2id, uid){
//     $.ajax({
// 	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'swapWithUnscheduledPaper',
// 		    p1id: p1id,
// 		    s2id: s2id,
// 		    p2id: p2id,
// 		    uid: uid
// 	    }, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }

// DB.prototype.movePaper = function(s1id, p1id, s2id, uid){
//     $.ajax({
// 	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'movePaper',
// 		    s1id: s1id,
// 		    p1id: p1id,
// 		    s2id: s2id,
// 		    uid: uid
// 	    }, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }

// DB.prototype.unschedulePaper = function(sid, pid, uid){
//     $.ajax({
// 	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'unschedulePaper',
// 		    sid: sid,
// 		    pid: pid,
// 		    uid: uid
// 	    }, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }
    
// DB.prototype.schedulePaper = function(sid, pid, uid){
//     $.ajax({
// 	    async: true,
// 	    type: 'POST',
// 	    data: { type: 'schedulePaper',
// 		    sid: sid,
// 		    pid: pid,
// 		    uid: uid
// 	    }, 
// 	    url: "./php/changeSchedule.php",
// 	    success: function(m){
// 		transactions.push(m);
// 		$(document).trigger('transactionUpdate', [transactions[transactions.length -1]]);
//  	    },
// 	    error : function(m){
// 		alert(JSON.stringify(m));
// 	    },
// 	    dataType: "json"
// 	});
// }
    

    
