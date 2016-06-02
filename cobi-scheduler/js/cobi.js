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
var allRooms = null;
var allSessions = null;
var allSubmissions = null;
var allAuthors = null;
var allChairs = null;
var authorConflictsAmongSessions = {};
var personaConflictsAmongSessions = {};
var conflictsByTime = null;
var conflictsBySession = null;
var unscheduled = null;
var unscheduledSubmissions = null;
var unscheduledChairs = null;
var schedule = null;
var frontEndOnly = false;
var scheduleSlots = null;
var userData = new userInfo(null, "Anon", null, "rookie");
var allUsers = {};
var transactions = [];
var localTransactions = [];
var roomCapacity = [
    {   "Blue": "Amphitheater, 862p"},
    {   "Bordeaux": "Amphitheater, 650p"},
    {   "252B": "Theater, 220p"},
    {   "352AB": "Theater, 380p"},
    {   "Havane": "Amphitheater, 373p"},
    {   "241": "Theater, 220p"},
    {   "342A": "Theater, 220p"},
    {   "251": "Theater, 220p"},
    {   "351": "Theater, 220p"},
    {   "242AB": "Theater, 280p"},
    {   "242A": "Theater, ??p"},
    {   "242B": "Theater, ??p"},
    {   "243": "Classroom, 60p"},
    {   "253": "Classroom, 60p"},
    {   "343": "Classroom, 60p"},
    {   "252A": "Theater, 120p"},
    {   "361": "Conference, 24p"},
    {   "362/363": "Conference, 32p"},
    {   "221/221M": "Conference, 64p"}
];

var desiredRoomOrder = [
    "GB56",
    "GB5",
    "GB6",
    "GB12",
    "GB34",
    "GB78",
    "GB910",
    "160T",
    "102C",
    "Dover AB",
    "100T",
    "Dover C",
    "Bristol"];

var personaList = [
"Collaborative information retrieval",
"Collaborative software development",
"Community analysis and support, virtual or physical",
"Computer-Mediated Communication",
"Concurrency control",
"Cross-cultural Systems or Studies",
"Crowdsourcing",
"Distributed/virtual teams",
"E-Learning and Education",
"Entertainment/games",
"Location-based and context-aware computing",
"Machine Learning and Data Mining",
"Medical and health support",
"Organization/office/workplace support",
"Other domain-specific support",
"Social Computing and Social Navigation",
"Social Networking Site Design and Use",
"Telepresence/video/desktop conferencing",
    "User experience/interaction design"];

var fullpersonaList = ["B2B / information systems",
		   "Collaboration architectures",
		   "Collaborative information retrieval",
		   "Collaborative software development",
		   "Collaborative visualization",
		   "Community analysis and support, virtual or physical",
		   "Computer-Mediated Communication",
		   "Concurrency control",
		   "Cross-cultural Systems or Studies",
		   "Crowdsourcing",
		   "Development Tools / Toolkits / Programming Environments",
		   "Distributed/virtual teams",
		   "E-Learning and Education",
		   "Empirical Methods, Qualitative",
		   "Empirical Methods, Quantitative",
		   "Entertainment/games",
		   "Home/family/intimacy support",
		   "Legal/historical/philosophical aspects",
		   "Location-based and context-aware computing",
		   "Machine Learning and Data Mining",
		   "Medical and health support",
		   "Mobile and embedded devices",
		   "Organization/office/workplace support",
		   "Other domain-specific support",
		   "Participatory Design / Cooperative Design",
		   "Privacy/access control/trust",
		   "Recommender and Filtering Systems",
		   "Social Computing and Social Navigation",
		   "Social Networking Site Design and Use",
		   "Social network analysis",
		   "Studies of Wikipedia/Web",
		   "Tabletop and Large Wall Displays",
		   "Telepresence/video/desktop conferencing",
		   "User experience/interaction design",
		   "Virtual Worlds/Avatars/Proxies",
		   "Workflow management"];

var communityList = [ 'Asking in Social Networks',
		      'citizen science',
		      'civic participation',
		      'Collaboration architectures',
		      'Collaborative information retrieval',
		      'Collaborative software development',
		      'Community analysis and support, virtual or physical',
		      'Computer-Mediated Communication',
		      'Concurrency control',
		      'consumer applications',
		      'coordination',
		      'Corporate Research',
		      'creativity',
		      'Cross-cultural Systems or Studies',
		      'Crowdfunding',
		      'Crowdsourcing',
		      'design',
		      'distance',
		      'Distributed/virtual teams',
		      'E-Learning and Education',
		      'Empirical Methods, Qualitative',
		      'enterprise',
		      'Entertainment/games',
		      'Facebook',
		      'Family on Social Networks',
		      'friendsourcing',
		      'home',
		      'Home/family/intimacy support',
		      'Infrastructure',
		      'leaders',
		      'Legal/historical/philosophical aspects',
		      'Location-based and context-aware computing',
		      'Machine Learning and Data Mining',
		      'Medical and health support',
		      'Mobile and embedded devices',
		      'MOOCs',
		      'online support groups',
		      'Organization/office/workplace support',
		      'Other domain-specific support',
		      'paid crowdsourcing',
		      'Participation motivations',
		      'persuasion',
		      'Politics/Social Media',
		      'Privacy/access control/trust',
		      'Q&A',
		      'Scientific work',
		      'search process',
		      'Self-disclosure and identity',
		      'Social Computing and Social Navigation',
		      'Social Media Offline',
		      'Social network analysis',
		      'Social Networking Site Design and Use',
		      'Sustainability',
		      'Telepresence/video/desktop conferencing',
		      'trust',
		      'twitter',
		      'User experience/interaction design',
		      'values',
		      'Virtual Worlds/Avatars/Proxies',
		      'worker bees',
		      'Workflow management',
		      'youth' ];

var DataOps = function() {
    function handleFailedTransaction(t){
	var rollbackTransaction = new TransactionData(t.uid, t.previousType, t.previous, t.type, t.data);
	//	console.log("rolling back the failed transaction");
	//	console.log(rollbackTransaction);
	handleTransaction(rollbackTransaction);
    }
    
    function handleTransaction(t){
	switch (t.type) {
   	case 'lock': 
	    lockSlot(t.data.date, t.data.time, t.data.room);
	    break;
	case 'unlock':
	    unlockSlot(t.data.date, t.data.time, t.data.room);
	    break;
	case 'unscheduleChair':
	    unscheduleChair(allSessions[t.data.id], allChairs[t.data.chairId]);
	    break;
	case 'scheduleChair':
	    scheduleChair(allSessions[t.data.id], allChairs[t.data.chairId]);
	    break;
	case 'moveChair':
	    moveChair(allSessions[t.data.s1id], 
		      allChairs[t.data.chairId],
		      allSessions[t.data.s2id]);
	    break;
	case 'swapChair':
	    swapChair(allSessions[t.data.s1id],
		      allChairs[t.data.chair1Id],
		      allSessions[t.data.s2id],
		      allChairs[t.data.chair2Id]);
	    break;
	case 'swapWithUnscheduledChair':
	    swapWithUnscheduledChair(allSessions[t.data.s1id],
				     allChairs[t.data.chair1Id],
				     allChairs[t.data.chair2Id]);
	    break;
	case 'editSessionTitle':
	    editSessionTitle(allSessions[t.data.id], t.data.title);
	    break;
	case 'unschedule':
	    // first check if session is actually there?
	    unscheduleSession(allSessions[t.data.id]);
	    break;
	case 'schedule':
	    scheduleSession(allSessions[t.data.id], 
			    t.data.date, 
			    t.data.time, 
			    t.data.room);
	    break;
	case 'move':
	    scheduleSession(allSessions[t.data.id], 
			    t.data.tdate, 
			    t.data.ttime, 
			    t.data.troom);
	    break;
	case 'swap':
//	    console.log("data from swapping:" + JSON.stringify(t));
	    swapSessions(allSessions[t.data.s1id],
			 allSessions[t.data.s2id]);
	    break;
	case 'swapWithUnscheduled':
	    swapWithUnscheduledSession(allSessions[t.data.s1id],
				       allSessions[t.data.s2id]);
	    break;
	    // now for the paper related cases
	case 'reorderPapers':
	    reorderPapers(allSessions[t.data.id],
			  t.data.paperOrder.split(","));
	    break;
	case 'swapPapers':
	    swapPapers(allSessions[t.data.s1id],
		       allSubmissions[t.data.p1id],
		       allSessions[t.data.s2id],
		       allSubmissions[t.data.p2id]);
	    break;
	case 'unschedulePaper':
	    unschedulePaper(allSessions[t.data.sid],
			    allSubmissions[t.data.pid]);
	    break;
	case 'schedulePaper':
	    schedulePaper(allSessions[t.data.sid],
			  allSubmissions[t.data.pid],
			  t.data.pos);
	    break;
	case 'movePaper':
	    movePaper(allSessions[t.data.s1id],
		      allSubmissions[t.data.p1id],
		      allSessions[t.data.s2id],
		      t.data.pos);
	    break;
	case 'swapWithUnscheduledPaper':
	    swapWithUnscheduledPaper(allSubmissions[t.data.p1id],
				     allSessions[t.data.s2id],
				     allSubmissions[t.data.p2id]);
	    break;
	default: 
//	    console.log("Weird, nonexistent operation? " + t.type);
	}
//	getAllConflicts();
    }

    function lockSlotsAtDayTime(day, time){
	for(var room in scheduleSlots[day][time]){
	    lockSlot(day, time, room);
	}
    }
    
    function unlockSlotsAtDayTime(day, time){
	for(var room in scheduleSlots[day][time]){
	    unlockSlot(day, time, room);
	}
    }
    
    function lockSlotsInRoom(r){
	for(var day in scheduleSlots){
	    for(var time in scheduleSlots[day]){
		for(var room in scheduleSlots[day][time]){
		    if(room == r){
			lockSlot(day, time, r);
		    }
		}
	    }
	}
    }
    
    function unlockSlotsInRoom(r){
	for(var day in scheduleSlots){
	    for(var time in scheduleSlots[day]){
		for(var room in scheduleSlots[day][time]){
		    if(room == r){
			unlockSlot(day, time, r);
		    }
		}
	    }
	}
    }
    
    function toggleSlotLock(day, time, room){
//	console.log("Test: toggling slot: " + day + ", " + time + ", " + room);    
	scheduleSlots[day][time][room]['locked'] = !scheduleSlots[day][time][room]['locked'];
    }
    
    function lockSlot(day, time, room){
//	console.log("Test: locking slot: " + day + ", " + time + ", " + room);    
	scheduleSlots[day][time][room]['locked'] = true;
    }
    
    function unlockSlot(day, time, room){
//	console.log("Test: unlocking slot: " + day + ", " + time + ", " + room);
	scheduleSlots[day][time][room]['locked'] = false;
    }
    
    function removeSessionFromSlot(s, date, time, room){
//	console.log("Test: removing session " + s.id + " from " + date + ", " + time + ", " + room);
	delete schedule[date][time][room][s.id];
    }
    
    function clearSlot(date, time, room){
//	console.log("Test: removing sessions from " + date + ", " + time + ", " + room);
	for(s in schedule[date][time][room]){
	    removeSessionFromSlot(allSessions[s], date, time, room);
	}
    }
    
    
    function addSessionToSlot(s, date, time, room){
//	console.log("Test: adding session " + s.id + " to " + date + ", " + time + ", " + room);
	schedule[date][time][room][s.id] = s;
	schedule[date][time][room][s.id]['date'] = date;
	schedule[date][time][room][s.id]['time'] = time;
	schedule[date][time][room][s.id]['room'] = room;
	// todo doesn't deal with endTime
    }
    function unscheduleChair(s,c){
	c.id = '';
	unscheduledChairs[c.authorId] = c;
	s.chairs = '';
    }
    function scheduleChair(s,c){
	c.id = s.id;
	s.chairs = c.authorId;
	delete unscheduledChairs[c.authorId];
    }
    function moveChair(s1, c1, s2){
	s1.chairs = '';
	c1.id = s2.id;
	s2.chairs = c1.authorId;
    }
    
    function swapChair(s1, c1, s2, c2){
	console.log(s1, c1, s2, c2);
	s1.chairs = c2.authorId;
	s2.chairs = c1.authorId;
	c1.id = s2.id;
	c2.id = s1.id;
    }

    function swapWithUnscheduledChair(s1, c1, c2){
	console.log(s1);
	console.log(c1);
	console.log(c2);
	unscheduledChairs[c1.authorId] = c1;
	delete unscheduledChairs[c2.authorId];
	c1.id = '';
	c2.id = s1.id;
	s1.chairs = c2.authorId;
    }
    
    function editSessionTitle(s, t){
	s.title = t;
    }

    function addToUnscheduled(s){
//	console.log("Test: adding session " + s.id + " to unscheduled list.");
	unscheduled[s.id] = s;
	s['date'] = "";
	s['time'] = "";
	s['room'] = "";
    }
    
    function removeFromUnscheduled(s){
	// remove session from unscheduled
//	console.log("Test: removing session " + s.id + " from unscheduled list.");
	delete unscheduled[s.id];
    }
    
    // Unschedule a session
    function unscheduleSession(s){	
	// todo: doesn't deal with endTime
	var sdate = s.date;
	var stime = s.time;
	var sroom = s.room;
	
//	console.log("Test: unscheduling session " + s.id + " from " + sdate + ", " + stime + ", " + sroom);
	
	if(scheduleSlots[sdate][stime][sroom]['locked']){
	    $(document).trigger('slotLocked', [sdate, stime, sroom]);
	    return;
	}
	
	// remove session from slot
	removeSessionFromSlot(s, sdate, stime, sroom);
	
	//console.log("before unscheduling.." + JSON.stringify(unscheduled));
	// add to unscheduled
	addToUnscheduled(s);
	//console.log("after unscheduling.." + JSON.stringify(unscheduled));
    }

    // schedule a session
    function scheduleSession(s, sdate, stime, sroom){
	if(scheduleSlots[sdate][stime][sroom]['locked']){
	    $(document).trigger('slotLocked', [sdate, stime, sroom]);
	    return;
	}
	
//	console.log("Test: scheduling session " + s.id + " to " + sdate + ", " + stime + ", " + sroom);

//	console.log("before scheduling.." + JSON.stringify(unscheduled));
	var isUnscheduled = false;
	// remove session from unscheduled
	if(s.id in unscheduled){
	    removeFromUnscheduled(s);
	    isUnscheduled = true;
	}
	
	// schedule on frontend
	if(!isUnscheduled){
	    removeSessionFromSlot(s, s.date, s.time, s.room)
	}
	addSessionToSlot(s, sdate, stime, sroom);
//	console.log("after scheduling.." + JSON.stringify(unscheduled));
    }
    
    
    // Swaps two sessions into the original schedule data structure
    function swapSessions(s1, s2){
	var s1date = s1.date;
	var s1time = s1.time;
	var s1room = s1.room;
	var s2date = s2.date;
	var s2time = s2.time;
	var s2room = s2.room;
	
//	console.log("Test: swapping sessions " + s1.id + " and " + s2.id);
	
	if(scheduleSlots[s1date][s1time][s1room]['locked']){
	    $(document).trigger('slotLocked', [s1date, s1time, s1room]);
	    return;
	}
	
	if(scheduleSlots[s2date][s2time][s2room]['locked']){
	    $(document).trigger('slotLocked', [s2date, s2time, s2room]);
	    return;
	}
	
	
	s1.date = s2date;
	s1.time = s2time;
	s1.room = s2room;
	s2.date = s1date;
	s2.time = s1time;
	s2.room = s1room;
	
	// change it's locations in the data structure
	schedule[s1date][s1time][s1room][s2.id] = s2;
	delete schedule[s1date][s1time][s1room][s1.id];
	
	schedule[s2date][s2time][s2room][s1.id] = s1;
	delete schedule[s2date][s2time][s2room][s2.id];
    }
    
    // Swaps two sessions where first is currently unscheduled
    function swapWithUnscheduledSession(s1, s2){
	// assume s1 is unscheduled
	var s2date = s2.date;
	var s2time = s2.time;
	var s2room = s2.room;
	
//	console.log("Test: swapping unscheduled session " + s1.id + " with scheduled session " + s2.id);
	
	if(scheduleSlots[s2date][s2time][s2room]['locked']){
	    $(document).trigger('slotLocked', [s2date, s2time, s2room]);
	    return;
	}
	
	removeFromUnscheduled(s1);
	removeSessionFromSlot(s2, s2date, s2time, s2room);
	addToUnscheduled(s2);
	addSessionToSlot(s1, s2date, s2time, s2room);
    }
    
    // Example: 
    // flipping first two papers in Mobile keyboard / text entry
    // reorderPapers(allSessions["s254"], ["pn1566","pn1376","pn1360","pn492","pn1936"], ["pn1376","pn1566","pn1360","pn492","pn1936"]);
    // reorderPapers(allSessions["s254"], ["pn1376","pn1566","pn1360","pn492","pn1936"], ["pn1566","pn1376","pn1360","pn492","pn1936"]);
    function reorderPapers(s, newPaperOrder){
	// assume paperOrder is an array of paper IDs
	
//	console.log("Test: reordering papers in session " + s.id + " to " + JSON.stringify(newPaperOrder));
	var submissions = [];
	
	for(var i = 0; i < newPaperOrder.length; i++){
	    for(var j = 0; j < s.submissions.length; j++){
		if(s.submissions[j].id == newPaperOrder[i]){
		    submissions.push(s.submissions[j]);
		    break;
		} 
	    }
	}
	
	s.submissions = submissions;	
    }
    
    function isLocked(s1){
	if(s1.id in unscheduled){
	    return false;
	} 
	var s1date = s1.date;
	var s1time = s1.time;
	var s1room = s1.room;
	if(scheduleSlots[s1date][s1time][s1room]['locked']){
	    $(document).trigger('slotLocked', [s1date, s1time, s1room]);
	    return true;
	}
	return false;
    }
    
    function paperIsInSession(s1, p1){
	// make sure keys come from right place
	var p1ins1 = false;
	for (var p in s1.submissions){
	    if(s1.submissions[p] == p1){
		p1ins1 = true;
	    }
	}
	return p1ins1;
    }
    
    // Example: 
    // Swapping mobile keyboard  paper with Learning first paper (top row)
    // swapPapers(allSessions['s254'], allSubmissions['pn1566'], allSessions['s288'], allSubmissions['pn2178'])
    // swapPapers(allSessions['s254'], allSubmissions['pn2178'], allSessions['s288'], allSubmissions['pn1566'])
    function swapPapers(s1, p1, s2, p2){
	
	if(isLocked(s1) || isLocked(s2)) return;
	
	// make sure types match and papers from their session
	if(s1.venue != s2.venue) return;
	if(!(paperIsInSession(s1, p1) && paperIsInSession(s2, p2))) return;
	
	
//	console.log("Test: swapping papers " + p1.id + " and " + p2.id);
	
	for(var i = 0; i < s1.submissions.length; i++){
	    if(s1.submissions[i] == p1){
		s1.submissions[i] = p2;
		p2.session = s1.id;
	    }
	}
	for(var i = 0; i < s2.submissions.length; i++){
	    if(s2.submissions[i] == p2){
		s2.submissions[i] = p1;
		p1.session = s2.id;
	    }
	}
	
	//if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
	//	    console.log("relying on CCOps");
	CCOps.updateAllConstraintEntities([s1.id, s2.id]);
	//	    updateAuthorConflicts([s1.id, s2.id]);
	//}
	// associate papers with different sessions
    }

    function clearSession(s){
	//	console.log("Test: removing papers from " + s.id);
	s.submissions = []; 
    }
    
    function removePaperFromSession(s, p){
//	console.log("Test: removing paper " + p.id + " from " + s.id);
	// change it from the session
	
	// erase paper from list of submissions in session
	var idx = s.submissions.indexOf(p); // Find the index
	if(idx !=-1) s.submissions.splice(idx, 1); // Remove it if really found!
	
	return;
    }
    
    function addToUnscheduledPaper(p){
//	console.log("Test: adding paper " + p.id + " to unscheduledSubmissions list.");
	unscheduledSubmissions[p.id] = p;
	p.session = "null";
    }
    
    // Example:
    // unscheduling improving two-thumb text entry from Mobile keyword / text
    // unschedulePaper(allSessions['s254'], allSubmissions['pn1376']);
    function unschedulePaper(s, p){
	if(isLocked(s) || !paperIsInSession(s,p)) return;
	
	//	console.log("Test: unscheduling paper " + p.id + " from " + s.id);
	
	removePaperFromSession(s, p);
	addToUnscheduledPaper(p);
	//	if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
	//	    console.log("relying on CCOps");
	CCOps.updateAllConstraintEntities([s.id]);
	//    updateAuthorConflicts([s.id]);
	//	}
    }
    
    // note: always add at start of session
    function insertPaperIntoSession(s, p, pos){
	//	console.log(s);
	//	console.log("Test: adding paper " + p.id + " to " + s.id + " at position " + pos);
	if(pos <= 0){
	    s.submissions.unshift(p);
	}else if(pos >= s.submissions.length){
	    s.submissions.push(p);
	}else { // insert in middle
	    s.submissions.splice(pos, 0, p);
	}
	// set paper's session
	p.session = s.id;
	
	return;
    }

    function removeFromUnscheduledPaper(p){
//	console.log("Test: removing paper " + p.id + " from unscheduledSubmissions list.");
	delete unscheduledSubmissions[p.id];
    }
    
    // Example:
    // scheduling improving two-thumb text entry to Mobile keyword / text
    // schedulePaper(allSessions['s254'], allSubmissions['pn1376']);
    function schedulePaper(s, p, pos){
	if(isLocked(s) || !(p.id in unscheduledSubmissions)) return;
	
//	console.log("Test: scheduling paper " + p.id + " into " + s.id);
	
	insertPaperIntoSession(s, p, pos);
	removeFromUnscheduledPaper(p);
//	if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
//	    console.log("relying on CCOps");
	    CCOps.updateAllConstraintEntities([s.id]);
//	    updateAuthorConflicts([s.id]);
//      }
    }
    
    // Example: 
    // Moving mobile keyboard  paper into Learning (top row)
    // movePaper(allSessions['s254'], allSubmissions['pn1376'], allSessions['s288']);
    // movePaper(allSessions['s288'], allSubmissions['pn1376'], allSessions['s254']);
    // Note: always inserts at front
    function movePaper(s1, p1, s2, pos){
//	console.log(s1, p1, s2, pos);
	if(isLocked(s1) || isLocked(s2)) return;
	
	// make sure types match and papers from their session
	if(s1.venue != s2.venue) return;
	if(!(paperIsInSession(s1, p1)))return;
	
	//	console.log("Test: moving paper " + p1.id + " from " + s1.id + " to " + s2.id);
	
	removePaperFromSession(s1, p1);
	insertPaperIntoSession(s2, p1, pos);
	//	if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
	//	    console.log("relying on CCOps");
	    CCOps.updateAllConstraintEntities([s1.id, s2.id]);
	//	    updateAuthorConflicts([s1.id, s2.id]);
    }
    
    // Example:
    // assuming pn1376 is unscheduled, swap it with paper in Mobile keyword / text that is scheduled
    // swapWithUnscheduledPaper(unscheduledSubmissions['pn1376'], allSessions['s254'], allSubmissions['pn1566']);
    // swapWithUnscheduledPaper(unscheduledSubmissions['pn1566'], allSessions['s254'], allSubmissions['pn1376']);
    function swapWithUnscheduledPaper(p1, s2, p2){
//	console.log("swapping with unscheduled");
//	console.log(p1, s2, p2);
	// assume p1 is unscheduled
	if(isLocked(s2)) {
	    console.log("lock");
	    return;
	}
	if(!(p1.type == s2.venue || (p1.type=="TOCHI" && s2.venue == "paper"))){
	    console.log("venue not match");
	    return;
	}
	if(!(paperIsInSession(s2,p2))){
	    console.log("what???" , s2, p2);
	    return;
	}
	
//	console.log("Test: swapping unscheduled paper " + p1.id + " with scheduled paper " + p2.id + " in " + s2.id);
	
	removeFromUnscheduledPaper(p1);
	for(var i = 0; i < s2.submissions.length; i++){
	    if(s2.submissions[i] == p2){
		s2.submissions[i] = p1;
		p2.session = "null";
		p1.session = s2.id;
	    }
	}
	addToUnscheduledPaper(p2);
	//	if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
	//    console.log("relying on CCOps");
	CCOps.updateAllConstraintEntities([s2.id]);
	//  updateAuthorConflicts([s2.id]);
	//}
    }
    return {
	handleTransaction: handleTransaction,
	handleFailedTransaction: handleFailedTransaction
    }

}();

// $(document).on("transactionUpdate", function(event, transaction){
// 	console.log(transaction);
//     });

		     
////// Functions that change the data schedule 

/// TODO: don't allow actually changing slots that are locked.

function undo(){
    // TODO: assume a local transactions array of latest transactions..
    // undo last move

    // undo it in the json data
    // alert the frontend of changes
    if(transactions && transactions.length >0){
	// undo allowed
	var type = transactions[transactions.length -1].type;
	var previous = transactions[transactions.length -1].previous;
	$(document).trigger('undoLastStep', [transactions[transactions.length -1]]);
	
	if(type == "lock"){
	    toggleSlotLock(previous['date'], 
			   previous['time'],
			   previous['room']);
	    $(document).trigger('lockChange', [previous['date'], previous['time'], previous['room']]);
	}else if(type == "unschedule"){
	    // schedule the session
	    addSessionToSlot(allSessions[previous['id']],
			     previous['date'], 
			     previous['time'],
			     previous['room']);
	    removeFromUnscheduled(allSessions[previous['id']]);
	    $(document).trigger('slotChange', [previous['date'], previous['time'], previous['room']]);
	    $(document).trigger('unscheduledChange');
	    
	}else if(type == "schedule"){
	    removeSessionFromSlot(allSessions[previous['id']],
				  previous['date'], 
				  previous['time'],
				  previous['room']);
	    unscheduled[previous['id']] = allSessions[previous['id']];;

	    $(document).trigger('slotChange', [previous['date'], previous['time'], previous['room']]);
	    $(document).trigger('unscheduledChange');

	}else if(type == "swap"){
	    var s1date = previous['s1date'];
	    var s1time = previous['s1time'];
	    var s1room = previous['s1room'];
	    var s2date = previous['s2date'];
	    var s2time = previous['s2time'];
	    var s2room = previous['s2room'];
	    
	    allSessions[previous['s1id']].date = s2date;
	    allSessions[previous['s1id']].time = s2time;
	    allSessions[previous['s1id']].room = s2room;
	    allSessions[previous['s2id']].date = s1date;
	    allSessions[previous['s2id']].time = s1time;
	    allSessions[previous['s2id']].room = s1room;
 
	    // change it's locations in the data structure
	    schedule[s1date][s1time][s1room][previous['s2id']] = allSessions[previous['s2id']];
	    delete schedule[s1date][s1time][s1room][previous['s1id']];
	    
	    schedule[s2date][s2time][s2room][previous['s1id']] = allSessions[previous['s1id']];
	    delete schedule[s2date][s2time][s2room][previous['s2id']];

	    var s1date = previous['s1date'];
	    var s1time = previous['s1time'];
	    var s1room = previous['s1room'];
	    var s2date = previous['s2date'];
	    var s2time = previous['s2time'];
	    var s2room = previous['s2room'];
	    
	    $(document).trigger('slotChange', [s1date, s1time, s1room]);
	    $(document).trigger('slotChange', [s2date, s2time, s2room]);


	}else if(type == "swapWithUnscheduled"){
	    var s2date = previous['s2date'];
	    var s2time = previous['s2time'];
	    var s2room = previous['s2room'];
	    
	    scheduleSession(allSessions[previous['s1id']], s2date, s2time, s2room);
	    unscheduleSession(allSessions[previous['s2id']], s2date, s2time, s2room);

	    $(document).trigger('unscheduledChange');
	    $(document).trigger('slotChange', [s2date, s2time, s2room]);
	}else if(type == "move"){
	    removeSessionFromSlot(allSessions[previous['id']], previous['sdate'], previous['stime'], previous['sroom']);
	    addSessionToSlot(allSessions[previous['id']], previous['tdate'], previous['ttime'], previous['troom']);

	    $(document).trigger('slotChange', [previous['sdate'], previous['stime'], previous['sroom']]);
	    $(document).trigger('slotChange', [previous['tdate'], previous['ttime'], previous['troom']]);
	}
	
		    
	// get rid of last transaction
	transactions.pop();

	// TODO: should really check this first before 
	// allowing undo in frontend 

	// undo it on the backend
	db.undo(userData.id);
    }
}

// Operations
function lockSlot(date, time, room){
    var td = { 'date': date,
	       'time': time,
	       'room': room };
    
    var tp = { 'date': date,
	       'time': time,
	       'room': room };
    
    var t = new TransactionData(userData.id,
				'lock',
				td,
				'unlock',
				tp);
    Transact.addTransaction(t);		
}

function unlockSlot(date, time, room){
    var td = { 'date': date,
	       'time': time,
	       'room': room };
    
    var tp = { 'date': date,
	       'time': time,
	       'room': room };
    
    var t = new TransactionData(userData.id,
				'unlock',
				td,
				'lock',
				tp);
    Transact.addTransaction(t);		
}

/////////////// CHAIR FUNCTIONALITY //////////////

// unscheduleChair(allSessions['s202'], allChairs[allSessions['s202'].chairs]);
function unscheduleChair(s, c){
    var td = { 'id': s.id,
	       'chairId': c.authorId
	     };
    var tp = { 'id': s.id,
	       'chairId': c.authorId
	     };
    var t = new TransactionData(userData.id,
				'unscheduleChair',
				td,
				'scheduleChair',
				tp);
    Transact.addTransaction(t);
}

// scheduleChair(allSessions['s202'], unscheduledChairs['auth1104'])
function scheduleChair(s, c){
    var td = { 'id': s.id,
	       'chairId': c.authorId
	     };
    var tp = { 'id': s.id,
	       'chairId': c.authorId
	     };
    var t = new TransactionData(userData.id,
				'scheduleChair',
				td,
				'unscheduleChair',
				tp);
    Transact.addTransaction(t);
}

// moveChair(allSessions['s202'], allChairs[allSessions['s202'].chairs], allSessions['s230'])
function moveChair(s1, c1, s2){
    var td = { 's1id': s1.id,
	       'chairId': c1.authorId,
	       's2id' :s2.id
	     };
    var tp = { 's1id': s2.id,
	       'chairId': c1.authorId,
	       's2id' : s1.id
	     };
    var t = new TransactionData(userData.id,
				'moveChair',
				td,
				'moveChair',
				tp);
    Transact.addTransaction(t);
}

// swapChair(allSessions['s202'], allChairs[allSessions['s202'].chairs], allSessions['s199'], allChairs[allSessions['s199'].chairs]);
function swapChair(s1, c1, s2, c2){
    var td = { 's1id': s1.id,
	       'chair1Id': c1.authorId,
	       's2id' :s2.id,
	       'chair2Id': c2.authorId,
	     };
    var tp = { 's1id': s1.id,
	       'chair1Id': c2.authorId,
	       's2id' : s2.id,
	       'chair2Id': c1.authorId,
	     };
    
    var t = new TransactionData(userData.id,
				'swapChair',
				td,
				'swapChair',
				tp);
    Transact.addTransaction(t);
	    
}

function swapWithUnscheduledChair(s1, c1, c2){
    var td = { 's1id': s1.id,
	       'chair1Id': c1.authorId,
	       'chair2Id': c2.authorId,
	     };
    var tp = { 's1id': s1.id,
	       'chair1Id': c2.authorId,
	       'chair2Id': c1.authorId,
	     };
    var t = new TransactionData(userData.id,
				'swapWithUnscheduledChair',
				td,
				'swapWithUnscheduledChair',
				tp);
    Transact.addTransaction(t);
}

//////////////// END CHAIR FUNCTIONALITY /////////


// changing the session title
function editSessionTitle(s, t){
//    console.log(editSessionTitle, s.id, t);
    var td = { 'id': s.id,
	       'title': t };
    var tp = { 'id': s.id,
	       'title': s.title};
    var t = new TransactionData(userData.id,
				'editSessionTitle',
				td,
				'editSessionTitle',
				tp);
    Transact.addTransaction(t);
}

// Unschedule a session
function unscheduleSession(s){
    var td = { 'id': s.id,
	       'date': s.date,
	       'time': s.time,
	       'room': s.room };
    var tp = { 'id': s.id,
	       'date': s.date,
	       'time': s.time,
	       'room': s.room };
    var t = new TransactionData(userData.id,
				'unschedule',
				td,
				'schedule',
				tp);
    Transact.addTransaction(t);		
}

// schedule a session
function scheduleSession(s, tdate, ttime, troom){
    if(s.id in unscheduled){
	// schedule session
	var td = { 'id': s.id,
		   'date': tdate,
		   'time': ttime,
		   'room': troom };
	var tp = { 'id': s.id,
		   'date': tdate,
		   'time': ttime,
		   'room': troom };
	var t = new TransactionData(userData.id,
				    'schedule',
				    td,
				    'unschedule', 
				    tp);
	Transact.addTransaction(t);		
    }else{
	// move session
	var td = { 'id': s.id,
		   'sdate': s.date,
		   'stime': s.time,
		   'sroom': s.room,
		   'tdate': tdate,
		   'ttime': ttime,
		   'troom': troom
		 };
	var tp = { 'id': s.id,
		   'sdate': tdate,
		   'stime': ttime,
		   'sroom': troom,
		   'tdate': s.date,
		   'ttime': s.time,
		   'troom': s.room
		 };
	var t = new TransactionData(userData.id,
				    'move',
				    td,
				    'move', 
				    tp);
	Transact.addTransaction(t);		
    }
}

// Swaps two sessions into the original schedule data structure
function swapSessions(s1, s2){
    //    console.log("swapSessions is called by frontend handler");
    //    console.log("s1 from frontend: " + JSON.stringify(s1));
    //    console.log("s2 from frontend: " + JSON.stringify(s2));
    
    var td = { 's1id': s1.id,
	       's1date': s1.date,
	       's1time': s1.time,
	       's1room': s1.room,
	       's2id': s2.id,
	       's2date': s2.date,
	       's2time': s2.time,
	       's2room': s2.room
	     };
    var tp = { 's1id': s2.id,
	       's1date': s1.date,
	       's1time': s1.time,
	       's1room': s1.room,
	       's2id': s1.id,
	       's2date': s2.date,
	       's2time': s2.time,
	       's2room': s2.room
	     };
    
    var t = new TransactionData(userData.id,
				'swap',
				td,
				'swap',
				tp);
    Transact.addTransaction(t);		
}

// Swaps two sessions where first is currently unscheduled
function swapWithUnscheduledSession(s1, s2){
    var td = { 's1id': s1.id,
	       's2id': s2.id,
	       's2date': s2.date,
	       's2time': s2.time,
	       's2room': s2.room
	     };
    var tp = { 's1id': s2.id,
	       's2id': s1.id,
	       's2date': s2.date,
	       's2time': s2.time,
	       's2room': s2.room
	     };
    
    var t = new TransactionData(userData.id,
				'swapWithUnscheduled',
				td,
				'swapWithUnscheduled',
				tp);
    Transact.addTransaction(t);		
}

///////end of functions for interacting with schedule////////////

/////// start of functions for interacting with papers in session//////
//  Operations / DB / transactions
//    reorderPapers(s, [paper.id]) ---> done
//    swapPapers(s1, p1, s2, p2) ---> done
//    unschedulePaper(s, p) --> done
//    schedulePaper(p, s) --> done, insert at front
//    movePaper(s1, p1, s2) --> done, insert at front
//    swapWithUnscheduledPaper(p1, s2, p2) --> done
//
//  checkConsistency / undo (NOT DONE YET)
//    reorder papers
//    swap papers
//    unschedule papers
//    schedule papers
//    move papers
//    swap with unscheduled papers
//
//  Proposal (DONE with no intelligence)
//    ProposePaperSessionAndSwap(p) --> done
//        handles scheduled and unscheduled papers
//    ProposePaperForSession(s) -> done
//        looks in scheduled and unscheduled papers
//  Types
///   only allow venue<->type based matches (special handle for TOCHI), leading to pn==tochi==short, case study to itself, altchi to itself



// Example: 
// flipping first two papers in Mobile keyboard / text entry
// reorderPapers(allSessions["s254"], ["pn1566","pn1376","pn1360","pn492","pn1936"], ["pn1376","pn1566","pn1360","pn492","pn1936"]);
// reorderPapers(allSessions["s254"], ["pn1376","pn1566","pn1360","pn492","pn1936"], ["pn1566","pn1376","pn1360","pn492","pn1936"]);
function reorderPapers(s, newPaperOrder, previousPaperOrder){
    var td = { 'id': s.id,
	       'paperOrder': newPaperOrder.join()
	     };
    var tp = { 'id': s.id,
	       'paperOrder': previousPaperOrder.join()
	     };
    var t = new TransactionData(userData.id,
				'reorderPapers',
				td,
				'reorderPapers',
				tp);
    Transact.addTransaction(t);		
}

// Example: 
// Swapping mobile keyboard  paper with Learning first paper (top row)
// swapPapers(allSessions['s254'], allSubmissions['pn1566'], allSessions['s288'], allSubmissions['pn2178'])
// swapPapers(allSessions['s254'], allSubmissions['pn2178'], allSessions['s288'], allSubmissions['pn1566'])
function swapPapers(s1, p1, s2, p2){
    var td = { 's1id': s1.id,
	       'p1id': p1.id,
	       's2id': s2.id,
	       'p2id': p2.id
	     };
    var tp = { 's1id': s1.id,
	       'p1id': p2.id,
	       's2id': s2.id,
	       'p2id': p1.id
	     };
    var t = new TransactionData(userData.id,
				'swapPapers',
				td,
				'swapPapers',
				tp);
    Transact.addTransaction(t);		
}

function getPaperPosition(s, p){
    return s.submissions.indexOf(p);
}

// Example:
// unscheduling improving two-thumb text entry from Mobile keyword / text
// unschedulePaper(allSessions['s254'], allSubmissions['pn1376']);
function unschedulePaper(s, p){
    var td = { 'sid': s.id,
	       'pid': p.id,
	     };
    var tp = { 'sid': s.id,
	       'pid': p.id,
	       'pos': getPaperPosition(s, p)
	     };
    var t = new TransactionData(userData.id,
				'unschedulePaper',
				td,
				'schedulePaper',
				tp);
    Transact.addTransaction(t);		
}

// Example:
// scheduling improving two-thumb text entry to Mobile keyword / text
// schedulePaper(allSessions['s254'], allSubmissions['pn1376']);
function schedulePaper(s, p){
    var td = { 'sid': s.id,
	       'pid': p.id,
	       'pos': s.submissions.length
	     };
    var tp = { 'sid': s.id,
	       'pid': p.id
	     };
    var t = new TransactionData(userData.id,
				'schedulePaper',
				td,
				'unschedulePaper',
				tp);
    Transact.addTransaction(t);		
}

// Example: 
// Moving mobile keyboard  paper into Learning (top row)
// movePaper(allSessions['s254'], allSubmissions['pn1376'], allSessions['s288']);
// movePaper(allSessions['s288'], allSubmissions['pn1376'], allSessions['s254']);
// Note: always inserts at front
function movePaper(s1, p1, s2){
    var td = { 's1id': s1.id,
	       'p1id': p1.id,
	       's2id': s2.id,
	       'pos' : s2.submissions.length
	     };
    var tp = { 's1id': s2.id,
	       'p1id': p1.id,
	       's2id': s1.id,
	       'pos' : getPaperPosition(s1, p1)
	     };
    var t = new TransactionData(userData.id,
				'movePaper',
				td,
				'movePaper',
				tp);
    Transact.addTransaction(t);		
}

// Example:
// assuming pn1376 is unscheduled, swap it with paper in Mobile keyword / text that is scheduled
// swapWithUnscheduledPaper(unscheduledSubmissions['pn1376'], allSessions['s254'], allSubmissions['pn1566']);
// swapWithUnscheduledPaper(unscheduledSubmissions['pn1566'], allSessions['s254'], allSubmissions['pn1376']);
function swapWithUnscheduledPaper(p1, s2, p2){
    var td = { 'p1id': p1.id,
	       's2id': s2.id,
	       'p2id': p2.id,
	     };
    var tp = { 'p1id': p2.id,
	       's2id': s2.id,
	       'p2id': p1.id
	     };
    var t = new TransactionData(userData.id,
				'swapWithUnscheduledPaper',
				td,
				'swapWithUnscheduledPaper',
				tp);
    Transact.addTransaction(t);		
}


//////// end of functions for interacting with papers in sessions/////////////

function arraysEqual(arr1, arr2) {
    if(arr1.length != arr2.length)
	return false;
    for(var i = 0; i < arr1.length; i++) {
	if(arr1[i] != arr2[i])
	    return false;
    }
    return true;
}

function keys(obj){
    var keys = [];
    
    for(var key in obj){
	if(obj.hasOwnProperty(key)){
	    keys.push(key);
	}
    }
    return keys;
}

if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(what, i) {
        i = i || 0;
        var L = this.length;
        while (i < L) {
            if(this[i] === what) return i;
            ++i;
        }
        return -1;
    };
}

function initialize(){
    loadUser();
    db.loadSchedule();
    db.loadUsers();
}

// Populates all of the above variables and attaches personas
// once the schedule is loaded from server 
function initAfterScheduleLoads(m){
    schedule = m['schedule'];
    unscheduled = m['unscheduled'];
    unscheduledSubmissions = m['unscheduledSubmissions'];
    scheduleSlots = m['slots'];
    transactions = m['transactions'];
    allChairs = m['chairs'];
    unscheduledChairs = {};
    for(var i in allChairs){
	if(allChairs[i].id == '')
	    unscheduledChairs[i] = allChairs[i];
    }
    allRooms = getAllRooms();
    allSessions = getAllSessions();
    allSubmissions = getAllSubmissions();
    allAuthors = getAllAuthors(); // only used for conflict display
    
    // TODO: deal with personas
    //attachPersonas();  // loads personas from a file into schedule JSON
  //    initializeAuthorConflictsAmongSessions(); // this can be loaded from a file
//    initializePersonaConflictsAmongSessions(); // this can be loaded from a file
  //    if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
//	console.log("relying on CCOps initialize");


    CCOps.initialize();
    //    }
    getAllConflicts();
    
    // Traditional polling for now...
    if(!frontEndOnly){
	db.refresh();
    }
    console.log("fully loaded on backend");
    $(document).trigger('fullyLoaded');
}

function loadUser(){
    var params = getURLParams();
    if(params.uid){
	db.loadUser(params.uid);
    }
}

function getURLParams() {
    var params = {}
    var m = window.location.href.match(/[\\?&]([^=]+)=([^&#]*)/g)
	if (m) {
	    for (var i = 0; i < m.length; i++) {
		var a = m[i].match(/.([^=]+)=(.*)/)
		params[unescapeURL(a[1])] = unescapeURL(a[2])
	    }
	}
    return params;
}

function unescapeURL(s) {
    return decodeURIComponent(s.replace(/\+/g, "%20"));
}


// record where inconsistencies occur
// change the internal data to update and bring everythign consistent
//      
//
function checkConsistent(serverSchedule, serverUnscheduled, serverUnscheduledSubmissions, serverSlots, serverTransactions){
    //    console.log(JSON.stringify(serverSchedule));
    // Compare schedule first
    // Assume same keys on day/time/room exist always, so any inconsistency is in content
    var scheduleChange = [];
    var unscheduledChange = [];
    var unscheduledSubmissionsChange = [];
    var consistent = true;
    
    // check if there are new transactions
    var newTransactionIndices = [];
    
    // for catching initial corner case
    if(transactions.length == 0 && serverTransactions.length > 0){
	consistent = false;
	for(var i = 0; i < serverTransactions.length; i++){
	    newTransactionIndices.push(transactions.length);
	    //transactions.push(serverTransactions[i]);
	    Transact.addServerTransaction(serverTransactions[i]);
	}
    }else{
	for(var i = 0; i < serverTransactions.length; i++){
	    if(parseInt(serverTransactions[i]['id']) > 
	       parseInt(transactions[transactions.length -1]['id'])){
		consistent = false;
		newTransactionIndices.push(transactions.length);
		Transact.addServerTransaction(serverTransactions[i]);
//		transactions.push(serverTransactions[i]);
	    }
	}
    }
    
//     if(!consistent){
// 	// changing the data to reflect what's different
// 	for(var day in schedule){
// 	    for(var time in schedule[day]){
// 		for(var room in schedule[day][time]){
// 		    if(!arraysEqual(keys(schedule[day][time][room]).sort(), 
// 				    keys(serverSchedule[day][time][room]).sort())){
// 			// trigger the change here
// 			$(document).trigger('slotChange', [day, time, room]);
// 		    }else{
// 			// check that papers are the same too
// 			for(var s in schedule[day][time][room]){
// 			    var subKeys = [];
// 			    for(var sub in schedule[day][time][room][s]['submissions']){
// 				subKeys.push(schedule[day][time][room][s]['submissions'][sub].id);
// 			    }
// 			    if(arraysEqual(subKeys, serverSchedule[day][time][room][s]['submissions'])){
// 				// get rid of key where same
// 				delete serverSchedule[day][time][room];			    
// 			    }else{
// 				$(document).trigger('sessionChange', [s, day, time, room]);
// 			    }
// 			}
// 		    }
// 		}
// 	    }
// 	}
	
// 	// Check for changes to locks
// 	for(var day in scheduleSlots){
// 	    for(var time in scheduleSlots[day]){
// 		for(var room in scheduleSlots[day][time]){
// 		    if(scheduleSlots[day][time][room]['locked'] !=
// 		       serverSlots[day][time][room]['locked']){
// 			$(document).trigger('lockChange', [day, time, room]);
// 		    }
// 		}
// 	    }
// 	}
	
// 	if(!arraysEqual(keys(unscheduled).sort(),  keys(serverUnscheduled).sort())){
// 	    // trigger a change in unscheduled data
// 	    $(document).trigger('unscheduledChange');
// 	}
	
// 	///// check if unscheduled papers match
// 	if(!arraysEqual(keys(unscheduledSubmissions).sort(),  keys(serverUnscheduledSubmissions).sort())){
// 	    // trigger a change in unscheduled submissions data
// 	    $(document).trigger('unscheduledSubmissionsChange');
// 	}
//     }
    
    if(!consistent){
	// all changes are in the transactions data itself,
	// at the new transactions indices. So trigger 
//	console.log("triggering serverScheduleChange with indices: ");
//	console.log(newTransactionIndices);
	$(document).trigger('serverScheduleChange', [newTransactionIndices]);    
//	for(var i = 0; i < newTransactionIndices.length; i++){
//	    $(document).trigger('transactionUpdate', transactions[newTransactionIndices[i]]);
//	}
    }
    
    return { isConsistent: consistent,
	    scheduleChange: serverSchedule,
	    unscheduledChange: serverUnscheduled,
	    unscheduledSubmissionsChange: serverUnscheduledSubmissions
	    };
}


function getAllSessions(){
    var sessions = {};
    for(var day in schedule){
	for(var time in schedule[day]){
	    for(var room in schedule[day][time]){
		for(var session in schedule[day][time][room]){
		    sessions[session] = schedule[day][time][room][session];
		}
	    }
	}
    }
    // get unscheduled sessions too
    for(var session in unscheduled){
	sessions[session] = unscheduled[session];
    }
    return sessions;
}

function getAllSubmissions(){
    var submissions = {};
    for(var s in allSessions){
	for(var submission in allSessions[s]["submissions"]){
	    var id = allSessions[s]["submissions"][submission]['id'];
	    submissions[id] = allSessions[s]["submissions"][submission];
	}
    }
    // get unscheduled submissions too
    for(var e in unscheduledSubmissions){
	submissions[e] = unscheduledSubmissions[e];
    }

    return submissions;

//     var submissions = {};
//     for(var day in schedule){
// 	for(var time in schedule[day]){
// 	    for(var room in schedule[day][time]){
// 		for(var session in schedule[day][time][room]){
// 		    for(var submission in schedule[day][time][room][session]["submissions"]){
			
			
// 			var id = schedule[day][time][room][session]["submissions"][submission]['id'];
			
// 			submissions[id] = schedule[day][time][room][session]["submissions"][submission];
// 		    }
// 		}
// 	    }
// 	}
//     }
    
//     // get submissions in unscheduled sessions
//     for(var s in unscheduled){
// 	for (var submission in unscheduled[s]["submissions"]){
// 	    var id = unscheduled[s]["submissions"][submission]['id'];
// 	    submissions[id] = unscheduled[s]["submissions"][submission];
// 	}
//     }
//     // get unscheduled submissions too
//     for(var e in unscheduledSubmissions){
// 	submissions[e] = unscheduledSubmissions[e];
//     }
//     return submissions;
}

function getAllAuthors(){
    var authors = {};
    for(var e in allSubmissions){
	for(var auth in allSubmissions[e].authors){
	    authors[auth] = allSubmissions[e].authors[auth];
	}
    }
    return authors;
}

function randomizeSchedule(){
    var sk = keys(allSessions);
    var tmp, current, top = sk.length;
    //    output = "";
    if(top) while(--top) {
	    current = Math.floor(Math.random() * (top + 1));
	    tmp = sk[current];
	    sk[current] = sk[top];
	    sk[top] = tmp;
	    swapSessions(allSessions[sk[current]], allSessions[sk[top]]);
	    //output += "swapping " + sk[current] + " with " + sk[top] + "\n";
	    //    output += "swapping " + sk[current] + " with " + sk[top] + "\n";
	}
    //    return output;
}

// update author conflicts on particular sessions 
function updateAuthorConflicts(affectedSessions){
    for(var i  = 0; i < affectedSessions.length; i++){
	var s1 = affectedSessions[i];
	for(var j = 0; j < sessionKeys.length; j++){
	    if(i != j){
		var s2 = sessionKeys[j];
		var authorConflicts = computeAuthorConflicts(allSessions[s1], allSessions[s2]);
		authorConflictsAmongSessions[s1][s2] = authorConflicts;
		authorConflictsAmongSessions[s2][s1] = authorConflicts;
	    }
	}
    }
}

// Pre-processing to fill a data structure noting a list of conflicts
// among any two sessions
function initializeAuthorConflictsAmongSessions(){
    var authorConflicts = null;
    if(allSessions == null){
	allSessions = getAllSessions();
    }
    sessionKeys = keys(allSessions);
    // initialize all conflicts to 0
    for(var i = 0; i < sessionKeys.length; i++){
	var s1 = sessionKeys[i];
	authorConflictsAmongSessions[s1] = {};
	for(var j = 0; j < sessionKeys.length; j++){
	    var s2 = sessionKeys[j];
	    authorConflictsAmongSessions[s1][s2] = [];
	}
    }    

    // add conflicts
    for(var i  = 0; i < sessionKeys.length; i++){
	var s1 = sessionKeys[i];
	for(var j = i+1; j < sessionKeys.length; j++){
	    var s2 = sessionKeys[j];
	    var authorConflicts = computeAuthorConflicts(allSessions[s1], allSessions[s2]);
	    authorConflictsAmongSessions[s1][s2] = authorConflicts;
	    authorConflictsAmongSessions[s2][s1] = authorConflicts;
	}
    }
}

// Pre-processing to fill a data structure noting a list of conflicts
// among any two sessions
function initializePersonaConflictsAmongSessions(){
    var personaConflicts = null;
    if(allSessions == null){
	allSessions = getAllSessions();
    }
    sessionKeys = keys(allSessions);
    // initialize all conflicts to 0
    for(var i = 0; i < sessionKeys.length; i++){
	var s1 = sessionKeys[i];
	personaConflictsAmongSessions[s1] = {};
	for(var j = 0; j < sessionKeys.length; j++){
	    var s2 = sessionKeys[j];
	    personaConflictsAmongSessions[s1][s2] = [];
	}
    }    

    // add conflicts
    for(var i  = 0; i < sessionKeys.length; i++){
	var s1 = sessionKeys[i];
	for(var j = i+1; j < sessionKeys.length; j++){
	    var s2 = sessionKeys[j];
	    var personaConflicts = computePersonaConflicts(allSessions[s1], allSessions[s2]);
	    personaConflictsAmongSessions[s1][s2] = personaConflicts;
	    personaConflictsAmongSessions[s2][s1] = personaConflicts;
	}
    }
}

// Computes a score for every possible session that s can swap with
// TODO: may want to limit to not be able to swap to certain places (e.g., special sessions, etc.), 
//       so may need a filtered list of possible swap locations
function proposeSwapForUnscheduled(s) {
    var swapValue = [];

    // for each item, compute: 
    // 1. number of conflicts caused by moving offending item to there
    // 2. number of conflicts mitigated by removing offeding item from there
    // 3. number of conflicts caused by moving item there to offending location
    
    // calculate number of conflicts caused by moving item into another row
    var conflictsWithRow = {};
    
    for(var day in schedule){
	conflictsWithRow[day] = {}
	for(var time in schedule[day]){
	    conflictsWithRow[day][time] = {};
	    conflictsWithRow[day][time]["sum"] = [];
	    conflictsWithRow[day][time]["session"] = {};
	    
	    for(var room in schedule[day][time]){
		// in case there are multiple sessions in a room, shouldn't be
		for(var s2 in schedule[day][time][room]){
		    var conflicts = authorConflictsAmongSessions[s.id][s2];
		    conflicts = conflicts.concat(personaConflictsAmongSessions[s.id][s2]);
		    conflictsWithRow[day][time]["session"][s2] = conflicts;
		    conflictsWithRow[day][time]["sum"] = conflictsWithRow[day][time]["sum"].concat(conflicts);
		}
	    }
	    
	    for(var room in schedule[day][time]){
		// in case there are multiple sessions in a room, shouldn't be
		for(var s2 in schedule[day][time][room]){
		    
		    // 1. number of conflicts caused by moving offending item to there
		    var conflictsCausedByOffending = [];
		    for(var i = 0; i < conflictsWithRow[day][time]["sum"].length; i++){
			var item = conflictsWithRow[day][time]["sum"][i];
			if(conflictsWithRow[day][time]["session"][s2].indexOf(item) == -1){
			    conflictsCausedByOffending.push(item);
			}
		    }

		    // 2. number of conflicts mitigated by removing offending item from there
		    var conflictsCausedByCandidate = calculateConflictsCausedBy(allSessions[s2]);
		            
		    // 3. number of conflicts caused by moving item there to offending location
		    var conflictsCausedByCandidateAtOffending = [];
		    
		    // 4. number of conflicts mitigated by moving offending items away
		    // numConflictsCausedByItem 
        
		    var conflictsResolved = conflictsCausedByCandidate.length - 
			conflictsCausedByOffending.length; 
		    swapValue.push(new swapDetails(new slot(allSessions[s2].date, allSessions[s2].time, allSessions[s2].room, s2),
						   conflictsResolved,
						   null,
						   conflictsCausedByOffending,
						   null,
						   conflictsCausedByCandidate
						   ));
		}
	    }
	}
    }
    return swapValue;
}




function proposeSwap(s) {
    // how many conflicts are caused by the offending item
    var conflictsCausedByItem = calculateConflictsCausedBy(s);
    var swapValue = [];
    
    // for each item, compute: 
    // 1. number of conflicts caused by moving offending item to there
    // 2. number of conflicts mitigated by removing offeding item from there
    // 3. number of conflicts caused by moving item there to offending location
    
    
    // calculate number of conflicts caused by moving item into another row
    var conflictsWithRow = {};
    
    for(var day in schedule){
	conflictsWithRow[day] = {}
	for(var time in schedule[day]){
	    if(day == s.date && time == s.time) {
		// todo: assume that nothing changes in terms of constraints
		for(var room in schedule[day][time]){
		    for(var s2 in schedule[day][time][room]){
			swapValue.push(new swapDetails(new slot(day, time, room, s2),
						       0,
						       null,
						       null,
						       null,
						       null));
		    }
		}
		continue;
	    }

	    conflictsWithRow[day][time] = {};
	    conflictsWithRow[day][time]["sum"] = [];
	    conflictsWithRow[day][time]["session"] = {};
	    
	    for(var room in schedule[day][time]){
		// in case there are multiple sessions in a room, shouldn't be
		for(var s2 in schedule[day][time][room]){
		    var conflicts = authorConflictsAmongSessions[s.id][s2];
		    conflicts = conflicts.concat(personaConflictsAmongSessions[s.id][s2]);
		    conflictsWithRow[day][time]["session"][s2] = conflicts;
		    conflictsWithRow[day][time]["sum"] = conflictsWithRow[day][time]["sum"].concat(conflicts);
		}
	    }
	    
	    for(var room in schedule[day][time]){
		// in case there are multiple sessions in a room, shouldn't be
		for(var s2 in schedule[day][time][room]){
//		    if(s2 == 's204'){
//			console.log(conflictsWithRow[day][time]["sum"]);
//		    }
		    // 1. number of conflicts caused by moving offending item to there
		    var conflictsCausedByOffending = [];
		    for(var i = 0; i < conflictsWithRow[day][time]["sum"].length; i++){
			var item = conflictsWithRow[day][time]["sum"][i];
			if(conflictsWithRow[day][time]["session"][s2].indexOf(item) == -1){
			    conflictsCausedByOffending.push(item);
			}
		    }

		    // 2. number of conflicts mitigated by removing offending item from there
		    var conflictsCausedByCandidate = calculateConflictsCausedBy(allSessions[s2]);
		            
		    // 3. number of conflicts caused by moving item there to offending location
		    var conflictsCausedByCandidateAtOffending = [];
		    for(var rs in schedule[s.date][s.time]){
			if(rs == s.room) continue;
			
			for(var sk in schedule[s.date][s.time][rs]){
			    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(authorConflictsAmongSessions[sk][s2]);
			    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(personaConflictsAmongSessions[sk][s2]);
			}
		    }
		    
		    // 4. number of conflicts mitigated by moving offending items away
		    // numConflictsCausedByItem 
        
		    var conflictsResolved = conflictsCausedByCandidate.length + 
			conflictsCausedByItem.length - 
			conflictsCausedByOffending.length - 
			conflictsCausedByCandidateAtOffending.length;
		    swapValue.push(new swapDetails(new slot(allSessions[s2].date, allSessions[s2].time, allSessions[s2].room, s2),
						   conflictsResolved,
						   conflictsCausedByCandidateAtOffending,
						   conflictsCausedByOffending,
						   conflictsCausedByItem,
						   conflictsCausedByCandidate
						   ));
		}
	    }
	}
    }
    
    return swapValue;
    
}



// Computes a score for every possible session that s can move into
// TODO: can currently only schedule to an empty slot
function proposeSlot(s) {
    var moveValue = [];

    // for each item, compute: 
    // number of conflicts caused by moving offending item to there (empty slot)
    
    // calculate number of conflicts caused by moving item into another row
    var conflictsWithRow = {};
    
    for(var day in schedule){
	conflictsWithRow[day] = {}
	for(var time in schedule[day]){
	    //    if(day == s.date && time == s.time) continue;
	    conflictsWithRow[day][time] = {};
	    conflictsWithRow[day][time]["sum"] = [];
	    conflictsWithRow[day][time]["session"] = {};
	    
	    for(var room in schedule[day][time]){
		// in case there are multiple sessions in a room, shouldn't be
		for(var s2 in schedule[day][time][room]){
		    var conflicts = authorConflictsAmongSessions[s.id][s2];
		    conflicts = conflicts.concat(personaConflictsAmongSessions[s.id][s2]);
		    conflictsWithRow[day][time]["session"][s2] = conflicts;
		    conflictsWithRow[day][time]["sum"] = conflictsWithRow[day][time]["sum"].concat(conflicts);
		}
	    }
	    
	    for(var room in schedule[day][time]){
		// only consider rooms that are empty
		if(keys(schedule[day][time][room]).length != 0) continue;

		var conflictsCausedByOffending = conflictsWithRow[day][time]["sum"];
		var conflictsResolved = -conflictsCausedByOffending.length;		
		if(s.id in unscheduled){
		    // 1. number of conflicts caused by moving offending item to there
		    moveValue.push(new swapDetails(new slot(day, time, room, null),
						   conflictsResolved,
						   null,
						   conflictsCausedByOffending,
						   null,
						   null));
		}else{ // session is already scheduled
		    // TODO: if same date and time, just different room, so assuming no change

		    if(s.date == day && s.time == time){
			moveValue.push(new swapDetails(new slot(day, time, room, null),
						       0,
						       null,
						       null,
						       null,
						       null));
		    }else{ // different day/time, consider conflicts removed by moving offending  
			var conflictsCausedByItem = calculateConflictsCausedBy(s);
			conflictsResolved += conflictsCausedByItem.length;
			moveValue.push(new swapDetails(new slot(day, time, room, null),
						       conflictsResolved,
						       null,
						       conflictsCausedByOffending,
						       conflictsCausedByItem,
						       null
						       ));
		    }
		}
	    }
	}
    }
    return moveValue;
}

function proposeChairSessionAndSwap(c){
    return CCOps.proposeChairSessionAndSwap(c);
}

function proposeChairForSession(s){
    // return recommendations of which chairs may be good for this session
    return CCOps.proposeChairForSession(s);
}

function proposeSlotAndSwap(s){
//    if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
//	console.log("relying on CCOps propose");
	return CCOps.proposeSlotAndSwap(s);
 //   }
}

function proposeSlotAndSwapOld(s){
    if(s.id in unscheduled){
	var slotValue = proposeSlot(s);
	var swapValue = proposeSwapForUnscheduled(s);
	return {slotValue: slotValue,
		swapValue: swapValue};
    }else {
	// todo: only works for already scheduled sessions 
	var slotValue = proposeSlot(s);
	var swapValue = proposeSwap(s);
	return {slotValue: slotValue,
		swapValue: swapValue};
    }
}

function proposeSessionForSlot(day, time, room){
//    if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
//	console.log("relying on CCOps propose");
	return CCOps.proposeSessionForSlot(day, time, room);
//    }
}

function proposeSessionForSlotOld(day, time, room){  
    var scheduleValue = proposeScheduledSessionForSlot(day,time,room);
    var unscheduleValue = proposeUnscheduledSessionForSlot(day,time,room);
    return {scheduleValue: scheduleValue,
	    unscheduleValue: unscheduleValue};
}

// Computes a score for every possible unschedule session that can move into slot
// TODO: can also think about moving scheduled session here...
function proposeUnscheduledSessionForSlot(day, time, room) {
    // ASSUME: day time room points to a currently unscheduled slot
    if(keys(schedule[day][time][room]).length != 0){
//		alert("There is already a session scheduled here.");
		return;
    }

    var moveValue = [];
    var conflictsWithSession = {};

    for(var s in unscheduled){
	conflictsWithSession[s] = [];
	// what conflicts does the session have with other sessions at this day and time
	for(var r2 in schedule[day][time]){
	    // in case there are multiple sessions in a room, shouldn't be
	    for(var s2 in schedule[day][time][r2]){
		var conflicts = authorConflictsAmongSessions[s][s2];
		conflicts = conflicts.concat(personaConflictsAmongSessions[s][s2]);
		conflictsWithSession[s] = conflictsWithSession[s].concat(conflicts);
	    }
	}
	
	moveValue.push(new swapDetails(new slot(null, null, null, s),
				       -conflictsWithSession[s].length,
				       null,
				       conflictsWithSession[s],
				       null,
				       null));
    }
    return moveValue;
}

// Computes a score for every possible schedule session that can move into slot
function proposeScheduledSessionForSlot(sdate, stime, sroom) {
      var swapValue = [];

      // for each item, compute: 
      // 2. number of conflicts mitigated by removing offending item from there
      // 3. number of conflicts caused by moving item there to offending location
      
      for(var day in schedule){
	  for(var time in schedule[day]){
	      if(day == sdate && time == stime) {
		  // todo: assume that nothing changes in terms of constraints
		  for(var room in schedule[day][time]){
		      for(var s2 in schedule[day][time][room]){
			  swapValue.push(new swapDetails(new slot(day, time, room, s2),
							 0,
							 null,
							 null,
							 null,
							 null));
		      }
		  }
		  continue;
	      }
	      
	      for(var room in schedule[day][time]){
		  // in case there are multiple sessions in a room, shouldn't be
		  for(var s2 in schedule[day][time][room]){
		      
		      // 2. number of conflicts mitigated by removing offending item from there
		      var conflictsCausedByCandidate = calculateConflictsCausedBy(allSessions[s2]);
		            
		      // 3. number of conflicts caused by moving item there to offending location
		      var conflictsCausedByCandidateAtOffending = [];
		      for(var rs in schedule[sdate][stime]){
			  if(rs == sroom) continue;
			  
			  for(var sk in schedule[sdate][stime][rs]){
			      conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(authorConflictsAmongSessions[sk][s2]);
			      conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(personaConflictsAmongSessions[sk][s2]);
			  }
		      }
		      
		      // 4. number of conflicts mitigated by moving offending items away
		      // numConflictsCausedByItem 
		      
		      var conflictsResolved = conflictsCausedByCandidate.length - 
			  conflictsCausedByCandidateAtOffending.length;
		      swapValue.push(new swapDetails(new slot(allSessions[s2].date, allSessions[s2].time, allSessions[s2].room, s2),
						     conflictsResolved,
						     conflictsCausedByCandidateAtOffending,
						     null,
						     null,
						     conflictsCausedByCandidate
						    ));
		  }
	      }
	  }
      }
    
    return swapValue;
}


function calculateConflictsCausedBy(s){

    var conflicts = [];
    // todo: add an error check if s is empty
      
    // assume conflicts already initialized
    // assume allRooms initialized

    // look for conflicts at same date and time
    var day = s.date;
    var time = s.time;
    
    for(var room in schedule[day][time]){
	// in case there are multiple sessions in a room, shouldn't be
	for(var s2 in schedule[day][time][room]){
	    if(allSessions[s2] != s){
		var authorConflicts = computeAuthorConflicts(s, allSessions[s2]);
		var personaConflicts = computePersonaConflicts(s, allSessions[s2]); 
		// write into conflicts at day, time, room
		conflicts = conflicts.concat(authorConflicts);
		conflicts = conflicts.concat(personaConflicts);
	    }
	}
    }
    return conflicts;
}


// // Computes a score for every possible session that s can swap with
// // TODO: may want to limit to not be able to swap to certain places (e.g., special sessions, etc.), 
// //       so may need a filtered list of possible swap locations
// function proposeSwapValues(s) {
//     // how many conflicts are caused by the offending item
//     var numConflictsCausedByItem = calculateNumConflictsCausedBy(s);
//     var swapValue = {};

//     // for each item, compute: 
//     // 1. number of conflicts caused by moving offending item to there
//     // 2. number of conflicts mitigated by removing offeding item from there
//     // 3. number of conflicts caused by moving item there to offending location
  
    
//     // calculate number of conflicts caused by moving item into another row
//     var conflictsWithRow = {};
    
//     for(var day in schedule){
// 	conflictsWithRow[day] = {}
// 	for(var time in schedule[day]){
// 	    if(day == s.date && time == s.time) continue;
// 	    conflictsWithRow[day][time] = {};
// 	    conflictsWithRow[day][time]["sum"] = 0;
// 	    conflictsWithRow[day][time]["session"] = {};
	    
// 	    for(var room in schedule[day][time]){
// 		// in case there are multiple sessions in a room, shouldn't be
// 		for(var s2 in schedule[day][time][room]){
// 		    var numConflicts = authorConflictsAmongSessions[s.id][s2].length + 
// 			personaConflictsAmongSessions[s.id][s2].length;
// 		    conflictsWithRow[day][time]["session"][s2] = numConflicts;
// 		    conflictsWithRow[day][time]["sum"] += numConflicts;
// 		}
// 	    }
	    
// 	    for(var room in schedule[day][time]){
// 		// in case there are multiple sessions in a room, shouldn't be
// 		for(var s2 in schedule[day][time][room]){
		    
// 		    // 1. number of conflicts caused by moving offending item to there
// 		    var numConflictsCausedByOffending = conflictsWithRow[day][time]["sum"] - 
// 			conflictsWithRow[day][time]["session"][s2];
		    
// 		    // 2. number of conflicts mitigated by removing offending item from there
// 		    var numConflictsCausedByCandidate = calculateNumConflictsCausedBy(allSessions[s2]);
		            
// 		    // 3. number of conflicts caused by moving item there to offending location
// 		    var numConflictsCausedByCandidateAtOffending = 0;
// 		    for(var rs in schedule[s.date][s.time]){
// 			if(rs == s.room) continue;
			
// 			for(var sk in schedule[s.date][s.time][rs]){
// 			    numConflictsCausedByCandidateAtOffending += authorConflictsAmongSessions[sk][s2].length;
// 			    numConflictsCausedByCandidateAtOffending += personaConflictsAmongSessions[sk][s2].length;
// 			}
// 		    }
		    
// 		    // 4. number of conflicts mitigated by moving offending items away
// 		    // numConflictsCausedByItem 
        
// 		    var conflictsResolved = numConflictsCausedByCandidate + 
// 			numConflictsCausedByItem - 
// 			numConflictsCausedByOffending - 
// 			numConflictsCausedByCandidateAtOffending;
// 		    swapValue[s2] = conflictsResolved;
// 		}
// 	    }
// 	}
//     }
    
//     return swapValue;

// }

function calculateNumConflictsCausedBy(s){

    var numConflicts = 0;
    // todo: add an error check if s is empty
      
    // assume conflicts already initialized
    // assume allRooms initialized

    // look for conflicts at same date and time
    var day = s.date;
    var time = s.time;
    
    for(var room in schedule[day][time]){
	// in case there are multiple sessions in a room, shouldn't be
	for(var s2 in schedule[day][time][room]){
	    if(allSessions[s2] != s){
		var authorConflicts = computeAuthorConflicts(s, allSessions[s2]);
		var personaConflicts = computePersonaConflicts(s, allSessions[s2]); 
		// write into conflicts at day, time, room
		numConflicts += authorConflicts.length;
		numConflicts += personaConflicts.length;
	    }
	}
    }
    return numConflicts;
}

function getAllConflicts(){
//    if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
//	console.log("starting getAllConflicts");
    conflictsBySession = CCOps.getAllConflicts().sessions;
    //	console.log("get all conflicts just got called");
    return;    
}

function getAllConflictsOld(){
    var conflicts = {}
    // assume conflicts already initialized
    // assume allRooms initialized
    conflicts["datetime"] = {};
    conflicts["sessions"] = {};
    for(var session in allSessions){
	conflicts["sessions"][session] = [];
    }

    for(var day in schedule){
	conflicts["datetime"][day] = {}
	for(var time in schedule[day]){
	    conflicts["datetime"][day][time] = [];
	    var roomKeys = keys(schedule[day][time]);
	    for(var i = 0; i < roomKeys.length; i++){
		// in case there are multiple sessions in a room, shouldn't be
		for(var s1 in schedule[day][time][roomKeys[i]]){
		    for(var j = i+1; j < roomKeys.length; j++){
			// in case there are multiple sessions in a room, shouldn't be
			for(var s2 in schedule[day][time][roomKeys[j]]){
			    // no author should be in two rooms at once
			    			    
			    var authorConflicts = computeAuthorConflicts(allSessions[s1], allSessions[s2]);
			    var personaConflicts = computePersonaConflicts(allSessions[s1], allSessions[s2]); 
			
			    // write into conflicts at day, time, room
			    if(authorConflicts.length > 0){
				conflicts["datetime"][day][time] = 
				    conflicts["datetime"][day][time].concat(authorConflicts);
				conflicts["sessions"][s1] = conflicts["sessions"][s1].concat(authorConflicts);
				conflicts["sessions"][s2] = conflicts["sessions"][s2].concat(authorConflicts);
			    }
			    if(personaConflicts.length > 0){
				conflicts["datetime"][day][time] = 
				    conflicts["datetime"][day][time].concat(personaConflicts);
				conflicts["sessions"][s1] = conflicts["sessions"][s1].concat(personaConflicts);
				conflicts["sessions"][s2] = conflicts["sessions"][s2].concat(personaConflicts);
			    }
			}
		    }
		}
	    }
	}
    }
    conflictsByTime = conflicts["datetime"];
    conflictsBySession = conflicts["sessions"];
    //    return conflicts;
}

/////////// start paper propose functions
function proposePaperSessionAndSwap(p){
//    if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
//	console.log("relying on CCOps propose");
	return CCOps.proposePaperSessionAndSwap(p);
//    }
}  

function proposePaperSessionAndSwapOld(p){
    if(p.id in unscheduledSubmissions){
	var sessionValue = proposeSessionForPaper(p);
	var swapValue = proposeSwapForUnscheduledPaper(p);
	return {sessionValue: sessionValue,
		swapValue: swapValue};
    }else {
	// todo: only works for already scheduled sessions 
	var sessionValue = proposeSessionForPaper(p);
	var swapValue = proposeSwapForPaper(p);
	return {sessionValue: sessionValue,
		swapValue: swapValue};
    }
}

function proposePaperForSession(s){
//    if(userData.id == '49c8fe6872457b891aaca167dbffcead'){
	//console.log("relying on CCOps propose");
	return CCOps.proposePaperForSession(s);
//    }
}

function proposePaperForSessionOld(s){    
    var scheduleValue = proposeScheduledPaperForSession(s);
    var unscheduleValue = proposeUnscheduledPaperForSession(s);
    return {scheduleValue: scheduleValue,
	    unscheduleValue: unscheduleValue};
}

// TODO: not providing any intelligence, just listing legal slots
function proposeSessionForPaper(p){
    var swapValue = [];
    for(var day in schedule){
	for(var time in schedule[day]){
	    for(var room in schedule[day][time]){
		for(var session in schedule[day][time][room]){
		    if ((schedule[day][time][room][session]["venue"] == p.type ||
			 (p.type == "TOCHI" && schedule[day][time][room][session]["venue"] == "paper")) && 
			(p.id in unscheduledSubmissions || p.session != session)){
			swapValue.push(new swapDetails(new sessionPaper(session, null),
						       0,
						       null,
						       null,
						       null,
						       null));
		    }
		}
	    }
	}
    }
    
    for(var session in unscheduled){
	if ((unscheduled[session]["venue"] == p.type ||
	     (p.type == "TOCHI" && unscheduled[session]["venue"] == "paper")) && 
	    (p.id in unscheduledSubmissions || p.session != session)){
	    	swapValue.push(new swapDetails(new sessionPaper(session, null),
					       0,
					       null,
					       null,
					       null,
					       null));
	}
    }
    return swapValue;
}

function proposeSwapForUnscheduledPaper(p){
    var swapValue = [];
    for(var day in schedule){
	for(var time in schedule[day]){
	    for(var room in schedule[day][time]){
		for(var session in schedule[day][time][room]){

		    if ((schedule[day][time][room][session]["venue"] == p.type ||
			 (p.type == "TOCHI" && schedule[day][time][room][session]["venue"] == "paper"))){
			for(var submission in schedule[day][time][room][session]['submissions']){
			    swapValue.push(new swapDetails(new sessionPaper(session, 
									    schedule[day][time][room][session]['submissions'][submission]['id']),
							   0,
							   null,
							   null,
							   null,
							   null));
			}
		    }
		}
	    }
	}
    }


		    if ((schedule[day][time][room][session]["venue"] == p.type ||
			 (p.type == "TOCHI" && schedule[day][time][room][session]["venue"] == "paper"))){
			for(var submission in schedule[day][time][room][session]['submissions']){
			    swapValue.push(new swapDetails(new sessionPaper(session, 
									    schedule[day][time][room][session]['submissions'][submission]['id']),
							   0,
							   null,
							   null,
							   null,
							   null));
			}
		    }


    for(var session in unscheduled){
	if ((unscheduled[session]["venue"] == p.type ||
	     (p.type == "TOCHI" && unscheduled[session]["venue"] == "paper"))){
	    for(var submission in unscheduled[session]["submissions"]){
	    	swapValue.push(new swapDetails(new sessionPaper(session, 
								unscheduled[session]["submissions"][submission]['id']),
					       0,
					       null,
					       null,
					       null,
					       null));
	    }
	}
    }

    return swapValue;
}

function proposeSwapForPaper(p){
    var swapValue = [];
    for(var day in schedule){
	for(var time in schedule[day]){
	    for(var room in schedule[day][time]){
		for(var session in schedule[day][time][room]){

		    if ((schedule[day][time][room][session]["venue"] == p.type ||
			 (p.type == "TOCHI" && schedule[day][time][room][session]["venue"] == "paper")) 
			&& (p.session != session)){
			for(var submission in schedule[day][time][room][session]['submissions']){
			    //    console.log(session,    schedule[day][time][room][session]['submissions'][submission]['id']);
			    swapValue.push(new swapDetails(new sessionPaper(session,     schedule[day][time][room][session]['submissions'][submission]['id']),
							   0,
							   null,
							   null,
							   null,
							   null));
			}
		    }else{
			//if(schedule[day][time][room][session]["venue"] == "paper"){
			    //   console.log(session + " didn't pass the check");
			//}
		    }
		}
	    }
	}
    }

    for(var session in unscheduled){
	if ((unscheduled[session]["venue"] == p.type ||
	     (p.type == "TOCHI" && unscheduled[session]["venue"] == "paper"))){
	    for(var submission in unscheduled[session]["submissions"]){
	    	swapValue.push(new swapDetails(new sessionPaper(session, 
								unscheduled[session]["submissions"][submission]['id']),
					       0,
					       null,
					       null,
					       null,
					       null));
	    }
	}
    }
    

    return swapValue;
}

function proposeScheduledPaperForSession(s){
    var swapValue = [];
    for(var day in schedule){
	for(var time in schedule[day]){
	    for(var room in schedule[day][time]){
		for(var session in schedule[day][time][room]){
		    if (schedule[day][time][room][session]["venue"] == s["venue"] &&
			s.id != session){
			for(var submission in schedule[day][time][room][session]['submissions']){
			    swapValue.push(new swapDetails(new sessionPaper(session,
									    schedule[day][time][room][session]['submissions'][submission]['id']),
							   0,
							   null,
							   null,
							   null,
							   null));
			}
		    }
		}
	    }
	}
    }
    return swapValue;
}

function proposeUnscheduledPaperForSession(s){
    var swapValue = [];
    for (var p in unscheduledSubmissions){
	if (unscheduledSubmissions[p].type == s.venue || 
	    (unscheduledSubmissions[p].type == "TOCHI" && s.venue == "paper")){ 

	    swapValue.push(new swapDetails(new sessionPaper(null, p),
					   0,
					   null,
					   null,
					   null,
					   null));
	}
    }
    return swapValue;
}






//////// end paper propose functions



function isEmpty(map) {
    for(var key in map) {
	if (map.hasOwnProperty(key)) {
	    return false;
	}
	return true;
    }
}

function getSessionAuthors(s){
    var authors = {};
    for(var submission in s["submissions"]){
	for(var author in s["submissions"][submission]["authors"]){
	    // Let's return the name of the author
	    if(!(author in authors)){
		authors[author] = s["submissions"][submission]["authors"][author]['firstName'] + " " + 
		    s["submissions"][submission]["authors"][author]['lastName'];
		    //1;
	    }else{
		authors[author] = s["submissions"][submission]["authors"][author]['firstName'] + " " + 
		    s["submissions"][submission]["authors"][author]['lastName'];
		//+= 1;
	    }
	}
    }
    return authors;
}

function getSessionPersonas(s){
    //    console.log(s["personas"]);
    if(s["personas"] == ""){
	return null;
    }
    return s["personas"];
}

function userInfo(id, name, email, type){
    this.id = id;
    this.name = name;
    this.email = email;
    this.type = type;
}

function swapDetails(target, value, addedSrc, addedDest, removedSrc, removedDest){
    this.target = target;
    this.value = value;
    this.addedSrc = addedSrc;
    this.addedDest = addedDest;
    this.removedSrc = removedSrc;
    this.removedDest = removedDest;
}

function slot(date, time, room, session){
    this.date = date;
    this.time = time;
    this.room = room;
    this.session = session;
}

function sessionPaper(session, paper){
    this.session = session;
    this.paper = paper;
}

function sessionChair(session, chair){
    this.session = session;
    this.chair = chair;
}

function conflictObject(entities, type, conflict, description){
    this.entities = entities;
    this.conflict = conflict;
    this.type = type;
    this.description = description;
}

function computeAuthorConflicts(s1, s2){
    var conflicts = [];
    var s1authors = getSessionAuthors(s1);
    var s2authors = getSessionAuthors(s2);
  
    for(var s1author in s1authors){
	for(var s2author in s2authors){
	    if(s1author == s2author){
		conflicts.push(new conflictObject([s1.id, s2.id], 
						  "authorInTwoSessions", 
						  s1author, 
						  s1authors[s1author] + " is in both '" + s1.title + 
						  "' and '" + s2.title + "'\n"));
	    }
	}
    }
    return conflicts;
}

function computePersonaConflicts(s1, s2){
    var conflicts = [];
    var s1personas = getSessionPersonas(s1);
    var s2personas = getSessionPersonas(s2);
  
    if(s1personas == s2personas && s1personas != null){
	// for handling misc persona
	if(s1personas != 'Misc'){
	    conflicts.push(new conflictObject([s1.id, s2.id], 
					      "personaInTwoSessions", 
					      s1personas,
					      "Someone interested in '" + s1personas + "' may want to see both '" + s1.title + 
					      "' and '" + s2.title + "'"));
	}
    }
    //    for(var s1persona in s1personas){
    //	for(var s2persona in s2personas){
    //	    if(s1persona == s2persona){
    //	conflicts.push(new conflictObject([s1.id, s2.id], 
    // 					  "personaInTwoSessions", 
    // 						  personaHash[s1persona],
    // 						  "Someone interested in " + personaHash[s1persona] + " may want to see both '" + s1.title + 
    // 						  "' and '" + s2.title + "'"));
// 	    }
// 	}
//     }
    return conflicts;
}



function getAllRooms(){
    var rooms = {};
    var index = 0;
    for(var day in schedule){
	for(var time in schedule[day]){
	    for(var room in schedule[day][time]){
		if(room in rooms){
		}else{
		    rooms[room] = index;
		    index++;
		}
	    }
	}
    }
    return rooms;
}





// Attach persona information to the JSON data structure
function attachPersonas(){
    // assume have allSessions
    for(var s in allSessions){
	allSessions[s]["personas"] = {};
	for(var submission in allSessions[s]["submissions"]){
	    allSessions[s]["submissions"][submission]["peorsonas"] = {};
	    for(var persona in personas){
		if(personas[persona].indexOf(submission) != -1){
		    allSessions[s]["personas"][persona] = true;
		    allSessions[s]["submissions"][submission]["personas"][persona] = true;
		}
	    }
	}
    }
}

//Reads the program into a schedule matrix (timeslots x rooms) and prints out a table
     function makeProgram(){
	 var scheduleMatrix = [];
	 var rooms = allRooms;
	 var numRooms = keys(rooms).length;
	 
	 var days = keys(schedule).sort(function(a,b) {
		 return parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1])
	     });
	 for(var i = 0; i < days.length; i++) {
	     var day = days[i];
	     for(var time in schedule[day]){
		 var scheduleAtTime = [day, time];
		 for(var j = 0; j < numRooms; j++){
		     scheduleAtTime.push("");
		 }   
		 for(var room in schedule[day][time]){
		     if(keys(schedule[day][time][room]).length == 0){
			 scheduleAtTime[rooms[room]+2] = -1;
		     }else{
			 for(var ses in schedule[day][time][room]){
			     scheduleAtTime[rooms[room]+2] = schedule[day][time][room][ses];
			 }
		     }
		 }
		 scheduleMatrix.push(scheduleAtTime);
	     }
	 }
	 return scheduleMatrix;
     }

function displayProgram(sm){
    var table = document.createElement('table');
    
    var orderedRooms = keys(allRooms).sort(function(a,b) { return allRooms[a] - allRooms[b];});
    
    var header = document.createElement('tr');
    // leave one empty for 1st column
    var firstcell = document.createElement('td');
    $(header).append(firstcell);
    for(var i = 0; i < orderedRooms.length; i++){
	var cell = document.createElement('td');
	$(cell).append(orderedRooms[i]);
	$(header).append(cell);
    }
    $(table).append(header);
    
    for(var i = 0; i < sm.length; i++){
	var row = document.createElement('tr');
	
	// add the conflicts
	var conflict = document.createElement('td');
	$(conflict).append(conflictsByTime[sm[i][0]][sm[i][1]].map(function(co) {return co.description}).join("<br/><br/>"));
	
	$(row).append(conflict);
	

	var slot = document.createElement('td');
	$(slot).append(sm[i][0] + ", " + sm[i][1]);
	$(row).append(slot);
	
	for(var j = 2; j < sm[i].length; j++){
	    var cell = document.createElement('td');
	    if(sm[i][j] != ""){
		     $(cell).append(sm[i][j].title);
	    }
	    $(row).append(cell);
	}
	$(table).append(row);
    }
    $('#program').append(table);
}


