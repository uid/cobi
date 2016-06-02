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
function SingleEntityConstraint(type, description, descriptionFunc, importance, rationale, entityRules, constraintObjectRules){
    this.type = type;
    this.importance = importance;
    this.rationale = rationale;
    this.entityRules = entityRules;
    if(!(type in CCOps.protoConstraints) && !(type in CCOps.chairConstraints)){
	console.log("non-prototype constraint, may be slow.");
	this.entities = CCOps.belongs(entityRules);
    }else{
	this.entities = null;
    }
    this.constraintObjectRules = constraintObjectRules;
    this.description = description;
    this.descriptionFunc = descriptionFunc;
    this.constraintType = "single";
}

function EntityPairConstraint(type, description, descriptionFunc, importance, rationale, entity1Rules, entity2Rules, relationRules){
    this.type = type;
    this.importance = importance;
    this.rationale = rationale;
    this.entity1Rules = entity1Rules;
    this.entity2Rules = entity2Rules;
    this.isSymmetric = true;
    if(entity1Rules.length != entity1Rules.length){
	this.isSymmetric = false;
    }else{
	for(var i in entity1Rules){
	    if(!(entity1Rules[i].level == entity2Rules[i].level && 
		 entity1Rules[i].comp + '' == entity2Rules[i].comp + '')){
		this.isSymmetric = false;
		break;
	    }
	}
    }
    if(!(type in CCOps.protoConstraints) && !(type in CCOps.chairConstraints)){
	console.log("non-prototype constraint, may be slow.");
	this.entities1 = CCOps.belongs(entity1Rules);
	this.entities2 = CCOps.belongs(entity2Rules);
    }else{
	this.entities1 = null;
	this.entities2 = null;
    }
    this.relationRules = relationRules;
    this.description = description;
    this.descriptionFunc = descriptionFunc;
    this.constraintType = "pair";
}

function EntityFilterPairConstraint(type, description, descriptionFunc, importance, rationale, entity1Rules, entity2Rules, filterRules, relationRules){
    this.type = type;
    this.importance = importance;
    this.rationale = rationale;
    this.entity1Rules = entity1Rules;
    this.entity2Rules = entity2Rules;
    if(!(type in CCOps.protoConstraints) && !(type in CCOps.chairConstraints)){
	console.log("non-prototype constraint, may be slow.");
	this.entities1 = CCOps.belongs(entity1Rules);
	this.entities2 = CCOps.belongs(entity2Rules);
    }else{
	this.entities1 = null;
	this.entities2 = null;
    }
    this.isSymmetric = true;
    this.filterRules = filterRules;
    if(!(type in CCOps.protoConstraints) && !(type in CCOps.chairConstraints)){
	this.entityPairs = CCOps.legalPathPairs(filterRules, 
						this.entities1,
						this.entities2);
    }else{
	this.entityPairs = null;
    }
    this.relationRules = relationRules;
    this.description = description;
    this.descriptionFunc = descriptionFunc;
    this.constraintType = "pairFiltered";
}

function entityTrace(session, submission, author){
    this.session = session;
    this.submission = submission;
    this.author = author;
}

function Rule(level, comp){
    this.level = level;
    this.comp = comp;
}

var CCOps = function(){
    var allConstraints = [];
    var allConflicts = [];
    var authorsourcingData = null;
    var authorsourcingAuthor = null;
    var scoreThreshold = 10;
    var goodThreshold = 9;
    var fitMat = {}; // paper to paper fit
    var notokMat = {};
    var intMat = {}; // paper to paper interest
    //    var relMat = {}; // paper to paper relevant
    var authorMat = {}; // paper to paper author 
    var personaMat = {}; // session to session persona
    var chairNotokMat = {}; // chair fit with session
    var chairFitMat = {}; // chair fit with session
    var chairAuthorMat = {}; // chair to submission
    var chairIntMat = {}; // chair to submission
    
    var chairConstraints = {
	'chairNotok': -1,
	'chairGreat': 1,
	'chairInAnother' : -1,
	'chairInterested':-1,
	'chairInOwn' : -1
    }
    var chairSelfConstraints = {
	'chairGreat' : null,
	'chairNotok' : null,
	'chairInOwn' : null
    }

    var protoConstraints = {
	'great': 1,
	'notok': -1,
	'authorInTwoSessions': -1,
	'personaInTwoSessions': -1,
	'interested': -1
    }
    var protoSelfConstraints = {
	'great' : null,
	'notok': null
    }

    function createSingleConflict(violation, constraint){
	var session = allSessions[violation.session];
	return new conflictObject([violation.session],
				  constraint.type,
				  [violation],
				  constraint.descriptionFunc(session, violation));
    }
    function createPairConflict(violationA, violationB, constraint){
	var sessionA = allSessions[violationA.session];
	var sessionB = allSessions[violationB.session];
	return new conflictObject([violationA.session, violationB.session],
				  constraint.type,
				  [violationA, violationB],
				  constraint.descriptionFunc(sessionA, violationA, sessionB, violationB));
    }
    function createSingleHypConflict(violation, constraint, hypSessions){
	var session = allSessions[violation.session];
	if(violation.session in hypSessions){
	    session = hypSessions[violation.session];
	}
	return new conflictObject([violation.session],
				  constraint.type,
				  [violation],
				  constraint.descriptionFunc(session, violation));
    }
    function createPairHypConflict(violationA, violationB, constraint, hypSessions){
	var sessionA = allSessions[violationA.session];
	var sessionB = allSessions[violationB.session];
	if(violationA.session in hypSessions){
	    sessionA = hypSessions[violationA.session];
	}
	if(violationB.session in hypSessions){
	    sessionB = hypSessions[violationB.session];
	}
	return new conflictObject([violationA.session, violationB.session],
				  constraint.type,
				  [violationA, violationB],
				  constraint.descriptionFunc(sessionA, violationA, sessionB, violationB));
    }

    function loadAuthorsourcingData(){
	$.ajax({
 	    async: false,
	    type: 'GET',
	    url: "./php/loadAuthorsourcing.php",
	    success: function(m){	
		if(m != null){
		    CCOps.authorsourcingAuthor = m['authorsession'];
		    CCOps.authorsourcingData = m['sessionauthor'];;
		}
	    },
	    error : function(m){
		console.log("error: " + JSON.stringify(m));
	    },
	    dataType: "json"
	});
    }
    
    function generateSubmissionNotTogetherConstraint(e1, e2, score){

	var constraint = new EntityPairConstraint("interested",
						  "papers of mutual interests in opposing sessions",
						  function (sessionA, violationA, sessionB, violationB){
						      return "'" + sessionA.submissions[violationA.submission].title + "' and '" + 
							  sessionB.submissions[violationB.submission].title + "'" + " should be at different times.";
						  },
 						  score, 
 						  "this is what an author said",
 						  [new Rule('submission', 
 							    function(x){ 
 								return x.id == e1;
  							    }),
  						  ],
 						  [new Rule('submission',
 							    function (x){
 								return x.id == e2;
							    }),
						      ],
						  [new Rule('session', function(a,b){
						      return !((a.time == b.time) &&
							       (a.date == b.date) &&
							       (a.room != b.room));
						  })]);
//	console.log(constraint);
	return constraint;
    }


    function generateFitInSessionConstraint(e1, e2, score){

	var text = {'great': 'papers that are good in the same session',
		    'notok': "papers that don't fit well in the same session"};
	var type = 'great';
	if(score < 0) type = 'notok';
	if(score < 0) score = -10; // TODO: hack to show as lower priority
	var filler = {'great' : ' are good ',
		      'notok': ' should not be '};
	
	
	var constraint = new EntityPairConstraint(type,
						  text[type],
						  function (sessionA, violationA, sessionB, violationB){
						      return "'" + allSessions[violationA.session].submissions[violationA.submission].title + "' and '" + 
							  allSessions[violationA.session].submissions[violationB.submission].title + "'" + filler[type] + "in the same session.";
						  },
 						  score, 
 						  "this is what an author said",
 						  [new Rule('submission', 
 							    function(x){ 
 								return x.id == e1;
  							    }),
  						  ],
 						  [new Rule('submission',
 							    function (x){
 								return x.id == e2;
							    }),
						      ],
						  [new Rule('session', function(a,b){
						      return !(a.id == b.id);
						  })]);
	return constraint;
    }
    
    // pairwise constraint matrix lookup
    function matfind(m, a, b){
	if(a in m && b in m[a]) return m[a][b];
	return null;
    }
    function matinsert(m, a, b, v){
	if(!(a in m)) m[a] = {};
	m[a][b] = v;
    }

    // Closure on messages for conflict detection
    function protoMessage(type, e1, e2){
	var ret = null;
	if(type == 'authorInTwoSessions'){
	    ret = function (s1, s2) {
		var names = e1.map(function(x) {return allAuthors[x].firstName + " " + allAuthors[x].lastName}).join(', ');
		var fill = " has a paper ";
		var prefill = "Author ";
		if(e1.length > 1) {
		    fill = " have a paper ";
		    prefill = "Authors "
		}
		if(s1 == null  || s1 == "null"){
		    return abbrItem(names, 'author-msg') + " also" + fill +  "in '" + 
			formatTitle(allSessions[s2].title, s2, null) + "'.";
		}
		if(s2 == null || s2 == "null"){
		    console.log("s2 null, should never happen");
		    return abbrItem(names, 'author-msg') +  fill +  "in simultaneous sessions";
		}
		return abbrItem(names, 'author-msg') + fill +  "in both '" + 
		    formatTitle(allSessions[s1].title, s1, null) + "' and '" + formatTitle(allSessions[s2].title, s2, null) + "'.";
	    }
	}else if(type == 'personaInTwoSessions'){
	    ret = function (s1, s2) {
		return "Someone interested in '" + abbrItem(allSessions[s1].personas, 'persona-msg') + "' may want to see both '" + 
		    formatTitle(allSessions[s1].title, s1, null) + "' and '" + formatTitle(allSessions[s2].title, s2, null) + "'.";
	    }
	}else if(type == 'great'){
	    ret = function (s1, s2) {

		return "Authors noted that '" + formatTitle(allSubmissions[e1].title, allSubmissions[e1].session, e1) + "' and '" + formatTitle(allSubmissions[e2].title, allSubmissions[e2].session, e2) + "' fit well in the same session.";
	    }
	}else if(type == 'notok'){
	    ret = function (s1, s2) {
		return "Authors noted that '" + formatTitle(allSubmissions[e1].title, allSubmissions[e1].session, e1) + "' and '" + 
		    formatTitle(allSubmissions[e2].title, allSubmissions[e2].session, e2) + "' do not fit in the same session.";
	    }
	}else if(type == 'interested'){
	    ret = function (s1, s2) {
		return "Authors noted that '" + formatTitle(allSubmissions[e1].title, allSubmissions[e1].session, e1) + "' and '" + 
		    formatTitle(allSubmissions[e2].title, allSubmissions[e2].session, e2) + "' are of mutual interest and should not be in opposing sessions.";
	    }
	}else if(type == 'chairNotok'){
	    ret = function (s1, s2){
		var name = allChairs[e1].givenName + " " + allChairs[e1].familyName;
		return "Affinity data suggests that " + abbrItem(name, 'author-msg') +  " is not a good fit for chairing " +formatTitle(allSessions[s1].title, s1, null) + ".";
	    }
	}else if(type == 'chairGreat'){
	    ret = function(s1, s2){
		var name = allChairs[e1].givenName + " " + allChairs[e1].familyName;
		return "Affinity data suggests that " + abbrItem(name, 'author-msg') + " is a good fit for chairing " +formatTitle(allSessions[s1].title, s1, null) + ".";
	    }
	}else if(type == 'chairInAnother'){
	    ret = function(s1, s2){
		if(s1 == null || s1 == 'null' || s1 == ""){
		    var name = allChairs[e1].givenName + " " + allChairs[e1].familyName;
		    return abbrItem(name, 'author-msg') + " is chairing but has a paper in " + 	formatTitle(allSessions[s2].title, s2, null) + ".";
		}else{
		    var name = allChairs[e1].givenName + " " + allChairs[e1].familyName;
		    return abbrItem(name, 'author-msg') + " is chairing " + formatTitle(allSessions[s1].title, s1, null) + " but has a paper in " + 
			formatTitle(allSessions[s2].title, s2, null) + ".";
		}
	    }
	}else if(type =='chairInOwn'){
	    ret = function(s1, s2){
		if(s1 == null || s1 == 'null' || s1 == ""){
		    var name = allChairs[e1].givenName + " " + allChairs[e1].familyName;
		    return abbrItem(name, 'author-msg') + " is chairing but has a paper in " + 	formatTitle(allSessions[s2].title, s2, null) + ".";
		}else{
		    var name = allChairs[e1].givenName + " " + allChairs[e1].familyName;
		    return abbrItem(name, 'author-msg') + " is chairing but has a paper in " + 	formatTitle(allSessions[s2].title, s2, null) + ".";
		}
	    }
	}else if(type == 'chairInterested'){
	    ret = function(s1, s2){
		if(s1 == null || s1 == 'null' || s1 == ""){
		    var name = allChairs[e1].givenName + " " + allChairs[e1].familyName;
		    return abbrItem(name, 'author-msg') + " is chairing but is interested in " + formatTitle(allSubmissions[e2].title, s2, e2) + ".";
		}else{
		    var name = allChairs[e1].givenName + " " + allChairs[e1].familyName;
		    return abbrItem(name, 'author-msg') + " is chairing but is interested in " + formatTitle(allSubmissions[e2].title, s2, e2) + ".";
//		    return abbrItem(name, 'author-msg') +  " is chairing " + formatTitle(allSessions[s1].title, s1, null) + " but is interested in " + 
	//		formatTitle(allSubmissions[e2].title, s2, e2) + ".";
		
		}
	    }
	}
	return ret;
    }

    function abbrItem(item, classname){
	var ft = abbr(item);
	ft = "<span class='" + classname + "'>" + ft + "</span>";
	return ft;
    }

    function abbr(title){
	var maxLength = 35;
	if(title.length < maxLength){
	    return title;
	}
	var titlesplit = title.split(' ');
	var len = 0;
	var abbr = "";
	var i = 0;
	
	for(var i = 0; i < titlesplit.length; i++){
	    if(len + titlesplit[i].length < maxLength){
		abbr += titlesplit[i];
		abbr += " ";
		len += titlesplit[i].length;
	    }else{
		return abbr.trim() + "...";
	    }
	}
	return abbr.trim() + "...";
    }

    
    function formatTitle(title, sessionId, paperId){
	var ft = abbr(title);
	if(paperId == null || paperId == ""){
	    ft = "<a href='#' class='title-msg session-link' data-session-id='" + sessionId + "' data-submission-id='" + paperId + "'>" + ft + "</a>";

	}else{
	    ft = "<a href='#' class='title-msg submission-link' data-session-id='" + sessionId + "' data-submission-id='" + paperId + "'>" + ft + "</a>";
	}
	return ft;
    }

    function generateChairInterestedConstraint(e1, e2, score){
	var constraint = new EntityPairConstraint("chairInterested",
						  "chairs and their papers of interest in opposing sessions",
						  function (sessionA, violationA, sessionB, violationB){
						      return "'" + sessionA.submissions[violationA.submission].title + "' and '" + 
							  sessionB.submissions[violationB.submission].title + "'" + " should be at different times.";
						  },
 						  score, 
 						  "this is what a chair said",
 						  [new Rule('submission', 
 							    function(x){ 
 								return x.id == e1;
  							    }),
  						  ],
 						  [new Rule('submission',
 							    function (x){
 								return x.id == e2;
							    }),
						      ],
						  [new Rule('session', function(a,b){
						      return !((a.time == b.time) &&
							       (a.date == b.date) &&
							       (a.room != b.room));
						  })]);
	return constraint;
    }

    function generateChairAuthorConstraint(){
	var chairauthorconstraint = new EntityFilterPairConstraint("chairInAnother", 
								   "chairs with papers in opposing sessions", 
								   function (sessionA, violationA, sessionB, violationB){
								       return sessionA.submissions[violationA.submission].authors[violationA.author].firstName + " " + 
									   sessionA.submissions[violationA.submission].authors[violationA.author].lastName + 
									   " is a chair that is in both '" + 
									   sessionA.title + "' and '" + sessionB.title + "'.";
								   },
								   -100,
								   "because chairs should only have to be at one place at any given time",
								   [new Rule('author', function(x){ return true})],
								   [new Rule('author', function(x){ return true})],
								   [new Rule('author', function(a, b){ return a.chairs == b.authorId }),
								    new Rule('session', function(a, b) { return a.id != b.id})], 
								   [new Rule('session', function(a, b){ // assume paths, check not opposing sessions
								       return !((a.time == b.time) &&
										(a.date == b.date) &&
										(a.room != b.room));
								   })]);

	var chairauthorinownconstraint = new EntityFilterPairConstraint("chairInOwn", 
								   "chairs with papers in their own sessions", 
								   function (sessionA, violationA, sessionB, violationB){
								       return sessionA.submissions[violationA.submission].authors[violationA.author].firstName + " " + 
									   sessionA.submissions[violationA.submission].authors[violationA.author].lastName + 
									   " is a chair that is in '" + 
									   sessionA.title + "'.";
								   },
								   -100,
								   "because chairs should only have to be at one place at any given time",
								   [new Rule('author', function(x){ return true})],
								   [new Rule('author', function(x){ return true})],
								   [new Rule('author', function(a, b){ return a.chairs == b.authorId }),
								    new Rule('session', function(a, b) { return a.id != b.id})], 
								   [new Rule('session', function(a, b){ // assume paths, check not opposing sessions
								       return !((a.time == b.time) &&
										(a.date == b.date) &&
										(a.room == b.room));
								   })]);
	CCOps.allConstraints.push(chairauthorconstraint);	
	CCOps.allConstraints.push(chairauthorinownconstraint);	
	
	for(var i in allChairs){
	    for(var j in allSubmissions){
		var matches = [];
		if(i in allSubmissions[j].authors)
		    matches.push(j);
		if(matches.length > 0){
		    var msg = protoMessage('chairInAnother', i, matches);
		    matinsert(CCOps.chairAuthorMat, i, j, {'score':matches.length, 'msg':msg});
		}
	    }
	}
    }
    
    function generateChairFitConstraint(i, j, score){
	var text = {'chairGreat': 'chairs who fit well in their session',
		    'chairNotok': "chairs who don't fit well in their session"};
	var type = 'chairGreat';
	if(score < 0) type = 'chairNotok';
	var filler = {'great' : ' are good ',
		      'notok': ' should not be '};
	
	var constraint = new EntityPairConstraint(type,
						  text[type],
						  function (sessionA, violationA, sessionB, violationB){
						      return "'" + allSessions[violationA.session].submissions[violationA.submission].title + "' and '" + 
							  allSessions[violationA.session].submissions[violationB.submission].title + "'" + filler[type] + "is chair should not be in the same session.";
						  },
 						  score, 
 						  "this is what a chair said",
 						  [new Rule('submission', 
 							    function(x){ 
 								return x.id == e1;
  							    }),
  						  ],
 						  [new Rule('submission',
 							    function (x){
 								return x.id == e2;
							    }),
						      ],
						  [new Rule('session', function(a,b){
						      return !(a.id == b.id);
						  })]);
	return constraint;
    }
    
    
    function generateChairConstraints(){
	var top = 5;
	var next = 25;
	var sessions = {};
	for(var i in allChairs){// get list of sessions mentioned
	    for(var j in allChairs[i].affinity){
		sessions[j] = [];
	    }
	    break;
	}
	for(var s in sessions){
	    for(var i in allChairs){
		if(s in allChairs[i].affinity){
		    sessions[s].push({'chair':i, 'score':allChairs[i].affinity[s]});
		}
	    }
	}
	for(var s in sessions){
	    sessions[s].sort(function(a, b) { return b.score - a.score});
	}

	for(var s in sessions){
	    for(var k = 0; k < top; k++){
		if(k >= sessions[s].length) break;
		CCOps.allConstraints.push(generateChairFitConstraint(sessions[s][k].chair, s, 5));
		var msg = protoMessage('chairGreat', sessions[s][k].chair, s);
		matinsert(CCOps.chairFitMat, sessions[s][k].chair, s, {'score': 5, 'msg': msg});
	    }
	}

	// how 	fit chair is for each session constraints
	for(var i in allChairs){
	    // find best matches of chairs to session
	    var aff = [];
	    for(var s in allChairs[i].affinity){
		aff.push({'session':s, 'score':allChairs[i].affinity[s]});
	    }
	    aff.sort(function(a, b) {return b.score - a.score});
	    
	    // best
	    for(var k = 0; k < top; k++){
		if(k >= aff.length) break;
		if(matfind(CCOps.chairFitMat, i, aff[k].session) == null){
		    CCOps.allConstraints.push(generateChairFitConstraint(i, aff[k].session, 5));
		    var msg = protoMessage('chairGreat', i, aff[k].session);
		    matinsert(CCOps.chairFitMat, i, aff[k].session, {'score': 5, 'msg': msg});
		}
	    }
	    // worst
	    for(var k = next; k < aff.length; k++){
		var chairBadForSession = false;
		//console.log(k, aff[k], aff[k].session, sessions, sessions[aff[k].session]);
		var s = sessions[aff[k].session];
		for(var l = next; l < s.length; l++){
		    if(s[l].chair == i){ // chair in bottom of session
			chairBadForSession = true;
			break;
		    }
		}
		if(chairBadForSession){
		    CCOps.allConstraints.push(generateChairFitConstraint(i, aff[k].session, -5));
		    var msg = protoMessage('chairNotok', i, aff[k].session);
		    matinsert(CCOps.chairNotokMat, i, aff[k].session, {'score': -5, 'msg': msg});
		}
	    }
	}
	
	
	// whether chair has an author conflict with a paper constraints
	generateChairAuthorConstraint();
	
	// whether chair may like another paper constraint
	for(var i in allChairs){
	    if(i in CCOps.authorsourcingAuthor){
		var interestedList = {};
		for(var j in CCOps.authorsourcingAuthor[i]){
		   // console.log(i, CCOps.authorsourcingAuthor[i][j][0].interested);
		    var interested = CCOps.authorsourcingAuthor[i][j][0].interested;
		    if(interested != ""){
			interested = interested.split(',');
			for(var k in interested){
			    interestedList[interested[k]] = true;
			}
		    }
		}
		interestedList = keys(interestedList);
		for(var it in interestedList){
		    CCOps.allConstraints.push(generateChairInterestedConstraint(i, interestedList[it], -5));
		    var msg = protoMessage('chairInterested', i, interestedList[it]);
		    matinsert(CCOps.chairIntMat, i, interestedList[it], {'score': -5, 'msg': msg});
		}
	    }
	}
    }
    
    function generateAuthorsourcingConstraints(){
	var cases = {'great': [], 'ok':[], 'notsure':[],'notok':[]};
	var scores = {'great': 10,
		      'ok': 5,
		      'notsure': -5,
		      'notok' : -10};
	var fitconstraints = {};
	var interestedconstraints = {};
	var relevantconstraints = {};
	
	for(var i in allSubmissions){
	    fitconstraints[i] = {};
	    interestedconstraints[i] = {};
	    relevantconstraints[i] = {};
	}
	
	for(var submission in CCOps.authorsourcingData){
	    // generate cohesiveness constraints
	    for(var auth in CCOps.authorsourcingData[submission]){
		var i = CCOps.authorsourcingData[submission][auth].length -1; // ignore dups from same author
		for(var j in cases){
		    var results = CCOps.authorsourcingData[submission][auth][i][j];
		    if(results == "") results = [];
		    else results = results.split(',');
		
		    for(var k in results){
			var pair = [submission, results[k]].sort();
			if((pair[1] in fitconstraints) &&
			   (pair[0] in fitconstraints[pair[1]])){
			    fitconstraints[pair[1]][pair[0]].push(j);
			}else{
			    if(pair[1] in fitconstraints){
				fitconstraints[pair[1]][pair[0]] = [j];
			    }else{
				fitconstraints[pair[1]] = {};
				fitconstraints[pair[1]][pair[0]] = [j];
			    }
			}
		    }
		}
		var interestedList = CCOps.authorsourcingData[submission][auth][i]['interested'];
		if(interestedList =="") interestedList = [];
		else {
		    interestedList = interestedList.split(',');		
		    interestedList.push(submission);
		    interestedList.sort();
		}
		
		for(var j = 0; j < interestedList.length - 1; j++){
		    for(var k = j+1; k < interestedList.length; k++){
			if((interestedList[j] in interestedconstraints) &&
			   (interestedList[k] in interestedconstraints[interestedList[j]])){
			    interestedconstraints[interestedList[j]][interestedList[k]] += 1;
			}else{
			    if(interestedList[j] in interestedconstraints) {
				interestedconstraints[interestedList[j]][interestedList[k]] = 1;
			    }else{
				interestedconstraints[interestedList[j]] = {};	
				interestedconstraints[interestedList[j]][interestedList[k]] = 1;
			    }
			}
 		    }
 		}
		
		var relevantList = CCOps.authorsourcingData[submission][auth][i]['relevant'];
		if(relevantList == ""){
		    relevantList = [];
		}else{
		    relevantList = relevantList.split(',');
		    relevantList.sort();
		}
		for(var j = 0; j < relevantList.length; j++){
		    var pair = [submission, relevantList[j]].sort();
		    if((pair[1] in interestedconstraints) && 
		       (pair[0] in interestedconstraints[pair[1]])){
			interestedconstraints[pair[1]][pair[0]] += 1;
		    }else{
			if(pair[1] in interestedconstraints){
			    interestedconstraints[pair[1]][pair[0]] = 1;
			}else{
			    interestedconstraints[pair[1]] = {};
			    interestedconstraints[pair[1]][pair[0]] = 1;
			}
		    }
		}
	    }
	}

	// Adding the constraints
	for(var i in fitconstraints){
	    for(var j in fitconstraints[i]){
		var score = fitconstraints[i][j].map(function(x){return scores[x]}).reduce(function(p,c,i,a) {return p + c;});
		if(score > CCOps.goodThreshold || score < (-1 * CCOps.scoreThreshold)){
		    var constraint = generateFitInSessionConstraint(i, j, score);
		    CCOps.allConstraints.push(constraint);
		    if(score > 0){
			var msg = protoMessage('great', i, j);
			matinsert(CCOps.fitMat, i, j, {'score':score, 'msg':msg});
			matinsert(CCOps.fitMat, j, i, {'score':score, 'msg':msg});
		    }else{
			var msg = protoMessage('notok', i, j);
			matinsert(CCOps.notokMat, i, j, {'score':score, 'msg':msg});
			matinsert(CCOps.notokMat, j, i, {'score':score, 'msg':msg});
		    }
		}
	    }
	}
	
	for(var i in interestedconstraints){
	    for(var j in interestedconstraints[i]){
		var score = -5 * interestedconstraints[i][j];
		if(score < (-1 * CCOps.scoreThreshold)){
		    CCOps.allConstraints.push(generateSubmissionNotTogetherConstraint(i, j, score));
		    var msg = protoMessage('interested', i, j);
		    matinsert(CCOps.intMat, i, j, {'score':score,'msg':msg});
		    matinsert(CCOps.intMat, j, i, {'score':score,'msg':msg});
		}
	    }
	}
	// 	for(var i in relevantconstraints){
	// 	    for(var j in relevantconstraints[i]){
	// 		var score = -5 * relevantconstraints[i][j];
	// 		if(score < (-1 * CCOps.scoreThreshold)){
	// 		    CCOps.allConstraints.push(generateSubmissionNotTogetherConstraint(i, j, score));
	// 		    matinsert(CCOps.relMat, i, j, score);
	// 		    matinsert(CCOps.relMat, j, i, score);
	// 		}
	// 	    }
	// 	}
    }
    
    function generatePersonaConstraints(){
	var personaconstraint = new EntityFilterPairConstraint("personaInTwoSessions", 
							       "topics of interest to a persona in opposing sessions", 
							       function (sessionA, violationA, sessionB, violationB){
								   return "Someone interested in '" + sessionA.personas + "' may want to see both '" + 
								       sessionA.title + "' and '" + sessionB.title + "'.";
							       },
							       -5,
							       "because someone interested in one may be interested in the other",
							       [new Rule('session', function(x){ return true})],
							       [new Rule('session', function(x){ return true})],
							       [new Rule('session', function(a, b){ return a.personas != "" && 
												    a.personas != "Misc" 
												    && a.personas == b.personas }),
								new Rule('session', function(a, b){ return a.id != b.id})], 
							       [new Rule('session', function(a, b){ // assume paths, check not opposing sessions
								   return !((a.time == b.time) &&
									    (a.date == b.date) &&
 									    (a.room != b.room));
							       })]);
	CCOps.allConstraints.push(personaconstraint);
	
	for(var i in allSessions){
	    for(var j in allSessions){
		if(allSessions[i].personas != "" && 
		   allSessions[i].personas == allSessions[j].personas && 
		   allSessions[i].personas != "Misc" && 
		   i != j){
		    var msg = protoMessage('personaInTwoSessions', i, j);
		    matinsert(CCOps.personaMat, i, j, {'score':true,'msg':msg});
		    matinsert(CCOps.personaMat, j, i, {'score':true,'msg':msg});
		}
	    }
	}
    }
    
    function generateAuthorConstraints(){
	var authorconstraint = new EntityFilterPairConstraint("authorInTwoSessions", 
							      "authors with papers in opposing sessions", 
							      function (sessionA, violationA, sessionB, violationB){
								  return sessionA.submissions[violationA.submission].authors[violationA.author].firstName + " " + 
								      sessionA.submissions[violationA.submission].authors[violationA.author].lastName + 
								      " is in both '" + 
								      sessionA.title + "' and '" + sessionB.title + "'.";
							      },
							      -100,
							      "because authors should only have to be at one place at any given time",
							      [new Rule('author', function(x){ return true})],
							      [new Rule('author', function(x){ return true})],
							      [new Rule('author', function(a, b){ return a.authorId == b.authorId }),
							       new Rule('session', function(a, b) { return a.id != b.id})], 
							      [new Rule('session', function(a, b){ // assume paths, check not opposing sessions
								  return !((a.time == b.time) &&
									   (a.date == b.date) &&
									   (a.room != b.room));
							      })]);
	
	CCOps.allConstraints.push(authorconstraint);	

	for(var i in allSubmissions){
	    for(var j in allSubmissions){
		if(i != j){
		    var matches = [];
		    for(var k in allSubmissions[i].authors){
			if(k in allSubmissions[j].authors){
			    matches.push(k);
			}
		    }
		    if(matches.length > 0){
			var msg = protoMessage('authorInTwoSessions', matches, matches);
			matinsert(CCOps.authorMat, i, j, {'score': matches.length, 'msg':msg});
			matinsert(CCOps.authorMat, j, i, {'score': matches.length, 'msg':msg});
		    }
		}
	    }
	}
    }
    
    function initialize(){
	loadAuthorsourcingData();
	generateAuthorsourcingConstraints();
	generatePersonaConstraints();
	generateAuthorConstraints();
	generateChairConstraints();
    }

    // session level conflict
    function checkSesConstraint(m, s1, s2, type){
	var ret = matfind(m, s1.id, s2.id);
	if(ret != null){
	    var conflict = new conflictObject([s1.id, s2.id],
					      type,
					      [s1.id, s2.id],
					      ret.msg(s1.id, s2.id));
	    return [conflict];
	}
	return [];
    }
    
    // check conflict between submissions. Note that 
    // error message and conflicting sessions not fully
    // instantiated yet
    function checkSubSubConstraint(m, p1, p2, s2, type){
	var ret = matfind(m, p1, p2);
	if(ret != null){
	    return new conflictObject([s2.id],
				      type,
				      [p1, p2],
				      ret.msg);
	}else{
	    return null;
	}
    }
    
    function instantiateConflict(s1id, conflict){
	if(conflict.entities.length > 2){
	    console.log("Instantiate: shouldn't be here");
	}
	// adds session information to conflict once known
	var newConflict = new conflictObject([s1id, conflict.entities[0]],
					     conflict.type,
					     conflict.conflict,
					     conflict.description(s1id, conflict.entities[0]));
	return newConflict;
    }
    
    function checkChairSesConstraint(m, s1, c1, type){
	var ret = matfind(m, c1.authorId, s1.id);
	if(ret != null){
	    return new conflictObject([s1.id, s1.id],
				      type,
				      [c1.authorId, s1.id],
				      ret.msg(s1.id, s1.id)
				     );
	}else{
	    return null;
	}
    }
    
    function checkChairSubSesConstraint(m, s1, c1, type){
	var conflicts = [];
	var subs = s1.submissions;
	
	for(var i = 0, len1 = subs.length; i < len1; i++){
	    var p2 = subs[i].id;
	    var ret = checkChairSubConstraint(m, p2, s1, c1, type);
	    if(ret != null){
		conflicts.push(ret);
	    }
	}
	return conflicts; 
    }

    function checkChairSubConstraint(m, p1, s1, c2, type){

	var ret = matfind(m, c2.authorId, p1);
	if(ret != null){
	    return new conflictObject([c2.id, s1.id],
				      type,
				      [c2.authorId, p1],
				      ret.msg(c2.id, s1.id)
				     );
	}else{
	    return null;
	}
    }
    
    function checkSubSesConstraint(m, p1, s2, type){
	var conflicts = [];
	var subs = s2.submissions;
	for(var i = 0, len1 = subs.length; i < len1; i++){
	    var p2 = subs[i].id;
	    if(p1 == p2) continue;
	    var ret = checkSubSubConstraint(m, p1, p2, s2, type);
	    if(ret != null){
		conflicts.push(ret);
	    }
	}
	return conflicts;
    }
    
    function checkSubConstraint(m, s1, s2, type){
	var conflicts = [];
	for(var i = 0, len1 = s1.submissions.length; i < len1; i++){
	    var start = 0;
	    if(s1.id == s2.id)  // avoid duplicates
		start = i+1;
	    for(var j = start, len2= s2.submissions.length; j < len2; j++){
		var ret = matfind(m, s1.submissions[i].id, s2.submissions[j].id);
		if(ret != null){
		    var conflict = new conflictObject([s1.id, s2.id],
						      type,
						      [s1.submissions[i].id,
						       s2.submissions[j].id],
						      ret.msg(s1.id, s2.id));
		    conflicts.push(conflict);
		}
	    }
	}
	return conflicts;
    }
    
    function getAllConflicts(){
	var conflicts = {};
	conflicts["sessions"] = {};
	conflicts["all"] = [];
	for(var session in allSessions)
	    conflicts["sessions"][session] = [];
	
	for(var day in schedule){
	    for(var time in schedule[day]){
		var roomKeys = keys(schedule[day][time]);
		for(var i = 0; i < roomKeys.length; i++){
		    for(var s1 in schedule[day][time][roomKeys[i]]){
			for(var j = i; j < roomKeys.length; j++){
			    for(var s2 in schedule[day][time][roomKeys[j]]){
				if(i == j){ 
				    var cs = computeSessionInnerConflicts(allSessions[s1]);
				    if(hasChair(s1)){
					cs = cs.concat(computeChairInnerConflicts(allSessions[s1], allChairs[allSessions[s1].chairs]));
				    }
				    
				    conflicts["all"] = conflicts["all"].concat(cs);
				    conflicts["sessions"][s1] = conflicts["sessions"][s1].concat(cs);
				    
				}else{
				    // interested
				    var cs = checkSubConstraint(intMat, allSessions[s1], allSessions[s2], 'interested');
				    // author
				    cs = cs.concat(checkSubConstraint(authorMat, allSessions[s1], allSessions[s2], 'authorInTwoSessions'));
				    // persona
				    cs = cs.concat(checkSesConstraint(personaMat, allSessions[s1], allSessions[s2], 'personaInTwoSessions'));
				    
				    conflicts["all"] = conflicts["all"].concat(cs);
				    conflicts["sessions"][s1] = conflicts["sessions"][s1].concat(cs);
				    conflicts["sessions"][s2] = conflicts["sessions"][s2].concat(cs);
				}
			    }
			}
			for(var j = 0; j < roomKeys.length; j++){
			    for(var s2 in schedule[day][time][roomKeys[j]]){
				if(i != j){
				    if(hasChair(s1)){
					var cs = computeChairOuterConflicts(allSessions[s2], allChairs[allSessions[s1].chairs]);
					conflicts["all"] = conflicts["all"].concat(cs);
					conflicts['sessions'][s1] = conflicts["sessions"][s1].concat(cs);
				    }
				}
			    }
			}			       
		    }
		}
	    }
	}
	
	for(var i in CCOps.allConstraints){
	    if(!(CCOps.allConstraints[i].type in protoConstraints) &&
	       !(CCOps.allConstraints[i].type in chairConstraints)){
		console.log("shouldn't be here");
//		console.log(CCOps.allConstraints[i].type);
//		console.log(CCOps.allConstraints[i]);
		
		var constraintConflicts;
		if(CCOps.allConstraints[i].constraintType == 'single'){
		    constraintConflicts = checkSingleConflicts(CCOps.allConstraints[i]);
		}else if(CCOps.allConstraints[i].constraintType == 'pair'){
		    constraintConflicts = checkPairConflicts(CCOps.allConstraints[i]);
		}else{// pairFiltered
		    constraintConflicts = checkFilteredPairConflicts(CCOps.allConstraints[i]);
		}
		conflicts["all"] = conflicts["all"].concat(constraintConflicts);
		
		for(var j in constraintConflicts){
		    if(constraintConflicts[j].entities.length == 2 && // special case for same session in pair constraint
		       constraintConflicts[j].entities[0] == constraintConflicts[j].entities[1]){
			var s = constraintConflicts[j].entities[0];
			conflicts["sessions"][s].push(constraintConflicts[j]);
		    }else{
			for(var k in constraintConflicts[j].entities){
			    var s = constraintConflicts[j].entities[k];
			    conflicts["sessions"][s].push(constraintConflicts[j]);
			}
		    }
		}
	    }
	}
//	console.log(conflicts);
	CCOps.allConflicts = conflicts;
	return conflicts;
    }

    function getAllConflictsOld(){
	var conflicts = {};
	conflicts["sessions"] = {};
	conflicts["all"] = [];
	for(var session in allSessions)
	    conflicts["sessions"][session] = [];
	
	for(var i in CCOps.allConstraints){
	    var constraintConflicts;
	    if(CCOps.allConstraints[i].constraintType == 'single'){
		constraintConflicts = checkSingleConflicts(CCOps.allConstraints[i]);
	    }else if(CCOps.allConstraints[i].constraintType == 'pair'){
		constraintConflicts = checkPairConflicts(CCOps.allConstraints[i]);
	    }else{// pairFiltered
		constraintConflicts = checkFilteredPairConflicts(CCOps.allConstraints[i]);
	    }
	    conflicts["all"] = conflicts["all"].concat(constraintConflicts);
	    
	    for(var j in constraintConflicts){
		if(constraintConflicts[j].entities.length == 2 && // special case for same session in pair constraint
		   constraintConflicts[j].entities[0] == constraintConflicts[j].entities[1]){
		    var s = constraintConflicts[j].entities[0];
		    conflicts["sessions"][s].push(constraintConflicts[j]);
		}else{
		    for(var k in constraintConflicts[j].entities){
			var s = constraintConflicts[j].entities[k];
			conflicts["sessions"][s].push(constraintConflicts[j]);
		    }
		}
	    }
	}
	CCOps.allConflicts = conflicts;
	return conflicts;
    }
    
    function computeConflictsWithRowAtTimeSlot(s, date, time){
	var ret = {};
	ret["sum"] = [];
	ret["session"] = {};
	for(var room in schedule[date][time]){
	    for(var s2 in schedule[date][time][room]){
		var conflicts = computeNewPairConflicts(s.id, s2, allSessions);
		conflicts = conflicts.concat(computeNewFilteredPairConflicts(s.id, s2, allSessions));
		ret["session"][s2] = conflicts;
		ret["sum"] = ret["sum"].concat(conflicts);
	    }
	}
	return ret;
    }
    
    function computeConflictsWithRow(s){
	var conflictsWithRow = {};
	for(var date in schedule){
	    conflictsWithRow[date] = {}
	    for(var time in schedule[date]){
		conflictsWithRow[date][time] = computeConflictsWithRowAtTimeSlot(s, date, time);
	    }
	}
	return conflictsWithRow;
    }


    function computeProtoPaperWithinSession(s, p){
	// Find proto conflicts between p and submissions in s if they were in same session
	var ret = {};
	ret["sum"] = [];
	ret["paper"] = {};
	var subs = s.submissions;
	
	for(var i = 0, len = subs.length; i < len; i++){
	    var conflicts = [];
	    var p2 = subs[i].id;
	    var great = checkSubSubConstraint(fitMat, p, p2, s, 'great');
	    if(great != null) conflicts.push(great);
	    var notok = checkSubSubConstraint(notokMat, p, p2, s, 'notok');
	    if(notok != null) conflicts.push(notok);
	    ret["paper"][p2] = conflicts;
	    ret["sum"] = ret["sum"].concat(conflicts);
	}
	return ret;
    }

    
    function computeProtoPaperWithRow(p){
	// Find all proto conflicts between p and papers in sessions across the schedule
	var conflictsWithRow = {};
	for(var date in schedule){
	    conflictsWithRow[date] = {}
	    for(var time in schedule[date]){
		conflictsWithRow[date][time] = computeProtoPaperWithRowAtTimeSlot(p, date, time);
	    }
	}
	return conflictsWithRow;
    }

    function computeProtoPaperWithRowAtTimeSlot(p, date, time){ 
	// compute all conflicts between p and papers in sessions at date-time
	var ret = {};
	ret["sum"] = [];
	ret["session"] = {};
	for(var room in schedule[date][time]){
	    for(var s2 in schedule[date][time][room]){
		var conflicts = computeProtoPaperAcrossSession(allSessions[s2], p);
		ret["session"][s2] = conflicts;
		ret["sum"] = ret["sum"].concat(conflicts);
	    }
	}
	return ret;
    }
    
    function computeProtoPaperAcrossSession(s, p){
	// Find all proto conflicts between p and submissions in s 
	var conflicts = checkSubSesConstraint(intMat, p, s, 'interested');
	conflicts = conflicts.concat(checkSubSesConstraint(authorMat, p, s, 'authorInTwoSessions'));
	return conflicts;
    }
    
    function computeChairConflictsAtRowWithSession(s){
	var conflictsAtRow = {};
	for(var date in schedule){
	    conflictsAtRow[date] = {}
	    for(var time in schedule[date]){
		conflictsAtRow[date][time] = computeChairConflictsAtRowWithSessionAtTimeSlot(s, date, time);
	    }
	}
	return conflictsAtRow;
    }

    function computeChairConflictsAtRowWithSessionAtTimeSlot(s, date, time){
	var ret = {};
	ret["sum"] = [];
	ret["session"] = {};
	for(var room in schedule[date][time]){
	    for(var s2 in schedule[date][time][room]){
		var conflicts = []
		if(hasChair(s2)){
		    conflicts = computeChairOuterConflicts(s, allChairs[allSessions[s2].chairs]);
		}
		ret["session"][s2] = conflicts;
		ret["sum"] = ret["sum"].concat(conflicts);
	    }
	}
	return ret;
    }
    
    function computeChairConflictsWithRow(c){
	var conflictsWithRow = {};
	for(var date in schedule){
	    conflictsWithRow[date] = {}
	    for(var time in schedule[date]){
		conflictsWithRow[date][time] = computeChairConflictsWithRowAtTimeSlot(c, date, time);
	    }
	}
	return conflictsWithRow;
    }
    
    // These constraints are fully filled out, don't require instantiation?
    function computeChairConflictsWithRowAtTimeSlot(c, date, time){
	var ret = {};
	ret["sum"] = [];
	ret["session"] = {};
	for(var room in schedule[date][time]){
	    for(var s2 in schedule[date][time][room]){
		var conflicts = computeChairOuterConflicts(allSessions[s2], c);
		ret["session"][s2] = conflicts;
		ret["sum"] = ret["sum"].concat(conflicts);
	    }
	}
	return ret;
    }
    
    function computeSessionInnerConflicts(s){
	var cs = checkSubConstraint(fitMat, s, s, 'great');
	cs = cs.concat(checkSubConstraint(notokMat, s, s, 'notok'));
	return cs;
    }
    
    function computeChairOuterConflicts(s, c){
	var cs = checkChairSubSesConstraint(chairAuthorMat, s, c, 'chairInAnother');
	cs = cs.concat(checkChairSubSesConstraint(chairIntMat, s, c, 'chairInterested'));
	return cs;
    }
    
    function computeChairInnerConflicts(s, c){
	var conflicts = checkChairSubSesConstraint(chairAuthorMat, s, c, 'chairInOwn');
	var chairng = checkChairSesConstraint(chairNotokMat, s, c, 'chairNotok');
	if(chairng != null) conflicts.push(chairng);
	var chairg = checkChairSesConstraint(chairFitMat, s, c, 'chairGreat');
	if(chairg != null) conflicts.push(chairg);
	return conflicts;
    }

    // These constraints are fully filled out, don't require instantiation?
    function computeProtoConflictsWithRowAtTimeSlot(s, date, time){
	var ret = {};
	ret["sum"] = [];
	ret["session"] = {};
	for(var room in schedule[date][time]){
	    for(var s2 in schedule[date][time][room]){
		var conflicts = checkSubConstraint(intMat, s, allSessions[s2], 'interested');
		conflicts = conflicts.concat(checkSubConstraint(authorMat, s, allSessions[s2], 'authorInTwoSessions'));
		conflicts = conflicts.concat(checkSesConstraint(personaMat, s, allSessions[s2], 'personaInTwoSessions'));
		ret["session"][s2] = conflicts;
		ret["sum"] = ret["sum"].concat(conflicts);
	    }
	}
	return ret;
    }
    

    
    function computeProtoConflictsWithRow(s){
	var conflictsWithRow = {};
	for(var date in schedule){
	    conflictsWithRow[date] = {}
	    for(var time in schedule[date]){
		conflictsWithRow[date][time] = computeProtoConflictsWithRowAtTimeSlot(s, date, time);
	    }
	}
	return conflictsWithRow;
    }

    function computeAllSingleConflicts(s1, s2){
	var singleConflictsCausedByItem = [];
	if(!(s1 in unscheduled)){
	    for(var i in CCOps.allConflicts["sessions"][s1]){
		if(CCOps.allConflicts["sessions"][s1][i].type in protoConstraints) continue;
		if(CCOps.allConflicts["sessions"][s1][i].conflict.length == 1){
		    singleConflictsCausedByItem.push(CCOps.allConflicts["sessions"][s1][i]);
		}
	    }
	}
	var singleConflictsCausedByCandidate = [];
	for(var i in CCOps.allConflicts["sessions"][s2]){
	    if(CCOps.allConflicts["sessions"][s2][i].type in protoConstraints) continue;
	    if(CCOps.allConflicts["sessions"][s2][i].conflict.length == 1){
		singleConflictsCausedByCandidate.push(CCOps.allConflicts["sessions"][s2][i]);
	    }
	}
	var hypSessions = {};
	var hypS = createHypSessionLoc(allSessions[s1], 
				       allSessions[s2].date, 
				       allSessions[s2].time,
				       allSessions[s2].room);
	var hypS2 = createHypSessionLoc(allSessions[s2], 
					allSessions[s1].date,
					allSessions[s1].time,
					allSessions[s1].room);
	hypSessions[s1] = hypS;
	hypSessions[s2] = hypS2;
	
	var singleConflictsCausedByOffending = computeNewSingleConflicts(s1, hypSessions);
	var singleConflictsCausedByCandidateAtOffending = [];
	if(!(s1 in unscheduled)){
	    singleConflictsCausedByCandidateAtOffending = computeNewSingleConflicts(s2, hypSessions);
	}
	return {conflictsCausedByItem: singleConflictsCausedByItem,
		conflictsCausedByCandidate: singleConflictsCausedByCandidate,
		conflictsCausedByOffending: singleConflictsCausedByOffending,
		conflictsCausedByCandidateAtOffending: singleConflictsCausedByCandidateAtOffending};
    }

    function computeAllSingleConflictsSlot(s1, space){
	var singleConflictsCausedByItem = [];
	if(!(s1 in unscheduled)){
	    for(var i in CCOps.allConflicts["sessions"][s1]){
		if(CCOps.allConflicts["sessions"][s1][i].type in protoConstraints) continue;
		
		if(CCOps.allConflicts["sessions"][s1][i].conflict.length == 1){
		    singleConflictsCausedByItem.push(CCOps.allConflicts["sessions"][s1][i]);
		}
	    }
	}
	var hypSessions = {};
	var hypS = createHypSessionLoc(allSessions[s1], 
				       space.date,
				       space.time,
				       space.room);
	hypSessions[s1] = hypS;
	
	var singleConflictsCausedByOffending = computeNewSingleConflicts(s1, hypSessions);

	return {conflictsCausedByItem: singleConflictsCausedByItem,
		conflictsCausedByCandidate: [],
		conflictsCausedByOffending: singleConflictsCausedByOffending,
		conflictsCausedByCandidateAtOffending: []};
    }


    function computeAllConflictsSlot(s1, space, conflictsWithRow){
	var hypSessions = {};
	var hypS = createHypSessionLoc(allSessions[s1], 
				       space.date,
				       space.time,
				       space.room);
	hypSessions[s1] = hypS;
	var conflictsCausedByOffending = computeNewSingleConflicts(s1, hypSessions);
	
	var conflictsCausedByItem = [];
	if(!(s1 in unscheduled)){
	    for(var i in CCOps.allConflicts["sessions"][s1]){
		if(CCOps.allConflicts["sessions"][s1][i].type in protoConstraints) continue;
		// self conflicts do not matter when we swap sessions
		if(CCOps.allConflicts["sessions"][s1][i].entities.length == 2 &&
		   CCOps.allConflicts["sessions"][s1][i].entities[0] == 
		   CCOps.allConflicts["sessions"][s1][i].entities[1]){
		}else{
		    conflictsCausedByItem.push(CCOps.allConflicts["sessions"][s1][i]);
		}
	    }
	}
	
	
	var s = allSessions[s1];
	var date = space.date;
	var time = space.time;

	for(var i = 0; i < conflictsWithRow[date][time]["sum"].length; i++){
	    var item = conflictsWithRow[date][time]["sum"][i];
	    conflictsCausedByOffending.push(item);
	}
		
	return {conflictsCausedByItem: conflictsCausedByItem,
		conflictsCausedByCandidate: [],
		conflictsCausedByOffending: conflictsCausedByOffending,
		conflictsCausedByCandidateAtOffending: []};
    }

    function computeAllConflicts(s1, s2, conflictsWithRow){
	var conflictsCausedByCandidate = [];
	if(!(s2 in unscheduled)){
	    for(var i in CCOps.allConflicts["sessions"][s2]){
		// self conflicts do not matter when we swap sessions
		if(CCOps.allConflicts["sessions"][s2][i].type in protoConstraints) continue;
		if(CCOps.allConflicts["sessions"][s2][i].entities.length == 2 &&
		   CCOps.allConflicts["sessions"][s2][i].entities[0] == 
		   CCOps.allConflicts["sessions"][s2][i].entities[1]){
		}else{
		    conflictsCausedByCandidate.push(CCOps.allConflicts["sessions"][s2][i]);
		}
	    }
	}
	var conflictsCausedByItem = [];
	if(!(s1 in unscheduled)){
	    for(var i in CCOps.allConflicts["sessions"][s1]){
		if(CCOps.allConflicts["sessions"][s1][i].type in protoConstraints) continue;
		// self conflicts do not matter when we swap sessions
		if(CCOps.allConflicts["sessions"][s1][i].entities.length == 2 &&
		   CCOps.allConflicts["sessions"][s1][i].entities[0] == 
		   CCOps.allConflicts["sessions"][s1][i].entities[1]){
		}else{
		    conflictsCausedByItem.push(CCOps.allConflicts["sessions"][s1][i]);
		}
	    }
	}
	var hypSessions = {};
	var hypS = createHypSessionLoc(allSessions[s1], 
				       allSessions[s2].date, 
				       allSessions[s2].time,
				       allSessions[s2].room);
	var hypS2 = createHypSessionLoc(allSessions[s2], 
					allSessions[s1].date,
					allSessions[s1].time,
					allSessions[s1].room);
	hypSessions[s1] = hypS;
	hypSessions[s2] = hypS2;
	
	var conflictsCausedByOffending = computeNewSingleConflicts(s1, hypSessions);
	var conflictsCausedByCandidateAtOffending = [];
	if(!(s1 in unscheduled)){
	    conflictsCausedByCandidateAtOffending = computeNewSingleConflicts(s2, hypSessions);
	}
	var s = allSessions[s1];
	var date = allSessions[s2].date;
	var time = allSessions[s2].time;

	for(var i = 0; i < conflictsWithRow[date][time]["sum"].length; i++){
	    var item = conflictsWithRow[date][time]["sum"][i];
	    if(conflictsWithRow[date][time]["session"][s2].indexOf(item) == -1){
		conflictsCausedByOffending.push(item);
	    }
	}

	if(!(s1 in unscheduled)){
	    for(var rs in schedule[s.date][s.time]){
		for(var sk in schedule[s.date][s.time][rs]){
		    if(sk != s.id){
			conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(computeNewPairConflicts(sk, s2, hypSessions));
			conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(computeNewFilteredPairConflicts(sk, s2, hypSessions));
		    }
		}
	    }
	}
	

	return {conflictsCausedByItem: conflictsCausedByItem,
		conflictsCausedByCandidate: conflictsCausedByCandidate,
		conflictsCausedByOffending: conflictsCausedByOffending,
		conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
    }

    function proposeSessionForSlot(sdate, stime, sroom){
	var scheduleValue = [];
	var unscheduleValue = [];
	
 	if(keys(schedule[sdate][stime][sroom]).length != 0) return;
	
	for(var s2 in unscheduled){
	    var offendingConflicts = (computeProtoConflictsWithRowAtTimeSlot(allSessions[s2], sdate, stime))['sum'];
	    offendingConflicts = offendingConflicts.concat(computeChairConflictsAtRowWithSessionAtTimeSlot(allSessions[s2], sdate, stime));
	    var cs = computeSessionInnerConflicts(allSessions[s2]);
	    if(hasChair(s2)){
		cs = cs.concat(computeChairInnerConflicts(allSessions[s2], allChairs[allSessions[s2].chairs]));
		cs = cs.concat((computeChairConflictsWithRowAtTimeSlot(allChairs[allSessions[s2].chairs], sdate, stime))['sum']);
	    }
	    offendingConflicts = offendingConflicts.concat(cs);

	    var sc = {conflictsCausedByItem: [],
 		      conflictsCausedByCandidate: [],
 		      conflictsCausedByOffending: [],
 		      conflictsCausedByCandidateAtOffending: offendingConflicts};
 	    unscheduleValue.push(createSwapDetails(sc, new slot(null, null, null, s2)));
	}

	// proposing scheduled session
	for(var date in schedule){
	    for(var time in schedule[date]){
		for(var room in schedule[date][time]){
		    for(var s2 in schedule[date][time][room]){
 			var cc = emptyProtoPropose();

 			if(date == sdate && time == stime && room != sroom){
			}else{
			    cc.conflictsCausedByItem = extractCurrentProtoConflicts(s2);
			    cc.conflictsCausedByItem = cc.conflictsCausedByItem.concat(extractCurrentChairConflicts(s2));
			    cc.conflictsCausedByItem = cc.conflictsCausedByItem.concat(extractCurrentChairConflictsWithSession(s2));

			    cc.conflictsCausedByOffending = (computeProtoConflictsWithRowAtTimeSlot(allSessions[s2], sdate, stime))['sum'];
			    cc.conflictsCausedByOffending = cc.conflictsCausedByOffending.concat(computeChairConflictsAtRowWithSessionAtTimeSlot(allSessions[s2], sdate, stime));
			    if(hasChair(s2)){
				cc.conflictsCausedByOffending = cc.conflictsCausedByOffending.concat((computeChairConflictsWithRowAtTimeSlot(allChairs[allSessions[s2].chairs], sdate, stime))['sum']);
			    }
			}
			var sc = {conflictsCausedByItem: cc.conflictsCausedByCandidate,
				  conflictsCausedByCandidate: cc.conflictsCausedByItem,
 				  conflictsCausedByOffending: cc.conflictsCausedByCandidateAtOffending,
				  conflictsCausedByCandidateAtOffending: cc.conflictsCausedByOffending};
 			scheduleValue.push(createSwapDetails(sc, new slot(date, time, room, s2)));
		    }
		}
	    }
	}
    	return {scheduleValue: scheduleValue,
		unscheduleValue: unscheduleValue};
    }

    function proposeSessionForSlotOld(sdate, stime, sroom){
	var scheduleValue = [];
	var unscheduleValue = [];
	
	// proposing unscheduled session
	if(keys(schedule[sdate][stime][sroom]).length != 0) return;
	
	var conflictsWithSession = {};
	for(var s2 in unscheduled){
	    var cc = null;
	    var conflictsCausedByItem = [];
	    var conflictsWithRow = computeConflictsWithRowAtTimeSlot(allSessions[s2], sdate, stime);

	    var sc = {conflictsCausedByItem: [],
		      conflictsCausedByCandidate: [],
		      conflictsCausedByOffending: conflictsWithRow['sum'], 
		      conflictsCausedByCandidateAtOffending: []};
	    unscheduleValue.push(createSwapDetails(sc, new slot(null, null, null, s2)));
	}

	// proposing scheduled session
	for(var date in schedule){
	    for(var time in schedule[date]){
		for(var room in schedule[date][time]){
		    for(var s2 in schedule[date][time][room]){
			var cc = null;
			var space = new slot(sdate, stime, sroom, null);
			if(date == sdate && time == stime){
			    // in same row; assume only single constraints affected
			    if(room == sroom && s2 != s1.id) continue;
			    cc = computeAllSingleConflictsSlot(s2, space);
			}else{
			    var conflictsCausedByItem = CCOps.allConflicts["sessions"][s2];
			    var conflictsWithRow = {};
			    conflictsWithRow[sdate] = {};
			    conflictsWithRow[sdate][stime] = computeConflictsWithRowAtTimeSlot(allSessions[s2], sdate, stime);
			    cc = computeAllConflictsSlot(s2, space, conflictsCausedByItem, conflictsWithRow);
			}
			var sc = {conflictsCausedByItem: cc.conflictsCausedByCandidate,
				  conflictsCausedByCandidate: cc.conflictsCausedByItem,
				  conflictsCausedByOffending: cc.conflictsCausedByCandidateAtOffending,
				  conflictsCausedByCandidateAtOffending: cc.conflictsCausedByOffending};
			scheduleValue.push(createSwapDetails(sc, new slot(date, time, room, s2)));
		    }
		}
	    }
	}
    	return {scheduleValue: scheduleValue,
		unscheduleValue: unscheduleValue};
    }
    
    function extractCurrentProtoPaperConflicts(s, p){
	// returns all conflicts that involve p from current conflicts involving s, p in s.
	var ret = [];
	var sessionConflicts = CCOps.allConflicts.sessions[s];
	for(var i in sessionConflicts){
	    var type = sessionConflicts[i].type;
	    // TODO: only captures pairwise conflicts now
	    if(type in protoConstraints && type != 'personaInTwoSessions' && 
	       sessionConflicts[i].conflict.length == 2 && 
	       (sessionConflicts[i].conflict[0] == p || sessionConflicts[i].conflict[1] == p)){
		ret.push(sessionConflicts[i]);
	    }
	}
	return ret;
    }

    function extractChairInSessionConflicts(sc, s){
	// only extract across session conflicts
	var ret = [];
	var sessionConflicts = CCOps.allConflicts.sessions[sc];
	for(var i in sessionConflicts){
	    var type = sessionConflicts[i].type;
	    // TODO: only handles limited types right now
	    if(type in chairConstraints && !(type in chairSelfConstraints) && 
	       sessionConflicts[i].entities[1] == s){
		ret.push(sessionConflicts[i]);
	    }
	}
	return ret;
    }

    function extractCurrentChairConflicts(s){
	// return conflicts other than inner conflicts
	var ret = [];
	var sessionConflicts = CCOps.allConflicts.sessions[s];
	for(var i in sessionConflicts){
	    var type = sessionConflicts[i].type;
	    // TODO: only handles limited types right now
	    if(type in chairConstraints && !(type in chairSelfConstraints)){
		ret.push(sessionConflicts[i]);
	    }
	}
	return ret;
    }
    
    function extractCurrentChairConflictsWithSession(s){
	// returns a row's chair conflict with this session
	var ret = [];
	if(!(allSessions[s] in unscheduled)){
	    // other session at same timeslot may have chairs who have conflicts with session being moved
	    for(var room in schedule[allSessions[s].date][allSessions[s].time]){
		if(room != allSessions[s].room){
		    for(var s2 in schedule[allSessions[s].date][allSessions[s].time][room]){
			var sessionConflicts = CCOps.allConflicts.sessions[s2];
			for(var i in sessionConflicts){
			    var type = sessionConflicts[i].type;
			    if(type in chairConstraints && !(type in chairSelfConstraints) && sessionConflicts[i].entities[1] == s){
				ret.push(sessionConflicts[i]);
			    }
			}
		    }
		}
	    }
	}
	return ret;
    }

    function extractInnerChairConflicts(s){
	// return inner conflicts only
	var ret = [];
	var sessionConflicts = CCOps.allConflicts.sessions[s];
	for(var i in sessionConflicts){
	    var type = sessionConflicts[i].type;
	    if(type in chairConstraints && type in chairSelfConstraints){
		ret.push(sessionConflicts[i]);
	    }
	}
	return ret;
    }
    
    function extractAllChairConflicts(s){
	var ret = [];
	var sessionConflicts = CCOps.allConflicts.sessions[s];
	for(var i in sessionConflicts){
	    var type = sessionConflicts[i].type;
	    // TODO: only handles limited types right now
	    if(type in chairConstraints){
		ret.push(sessionConflicts[i]);
	    }
	}
	return ret;
    }

    function extractCurrentProtoConflicts(s){
	// return conflicts other than inner conflicts
	var ret = [];
	var sessionConflicts = CCOps.allConflicts.sessions[s];
	for(var i in sessionConflicts){
	    var type = sessionConflicts[i].type;
	    // TODO: only handles limited types right now
	    if(type in protoConstraints && !(type in protoSelfConstraints)){
		ret.push(sessionConflicts[i]);
	    }
	}
	return ret;
    }

    function extractAllCurrentProtoConflicts(s){
	// return conflicts includding inner conflicts
	var ret = [];
	var sessionConflicts = CCOps.allConflicts.sessions[s];
	for(var i in sessionConflicts){
	    var type = sessionConflicts[i].type;
	    // TODO: only handles limited types right now
	    if(type in protoConstraints){
		ret.push(sessionConflicts[i]);
	    }
	}
	return ret;
    }


    function extractAllButFromRow(row, s){
	var ret = [];
	if(row == null) return ret;
	for(var i in row["session"]){
	    if(i != s){
		ret = ret.concat(row["session"][i]);
	    }
	}
	return ret;
    }
    
    function extractAllButFromSession(row, p){
	var ret = [];
	for(var i in row["paper"]){
	    if(i != p){
		ret = ret.concat(row["paper"][i]);
	    }
	}
	return ret;
    }

    function emptyProtoPropose(){
	return  {conflictsCausedByItem: [],
		  conflictsCausedByCandidate: [],
		  conflictsCausedByOffending: [],
		  conflictsCausedByCandidateAtOffending: []};
    }

    function hasChair(s){
	return allSessions[s].chairs != "";
    }

    function chairIsScheduled(c){
	return !(c.authorId in unscheduledChairs) && !(c.id in unscheduled);
    }
    
    function proposeChairSessionAndSwap(c){
	var swapValue = [];
	var sessionValue = [];
	
	var conflictsCausedByItem = [];
	if(chairIsScheduled(c)){
	    // chair of a scheduled session
	    conflictsCausedByItem = extractAllChairConflicts(c.id);
	}

	var conflictsWithRow = computeChairConflictsWithRow(c);
	
	for(var date in schedule){
	    for(var time in schedule[date]){
		// TODO: same time slot
		if(chairIsScheduled(c) &&
		   date == allSessions[c.id].date &&
		   time == allSessions[c.id].time){
		    for(var room in schedule[date][time]){
			for(var s in schedule[date][time][room]){
			    if(s == c.id) continue;
			    if(allSessions[s].chairs != ""){ // swapping 
				// rowCausedByItem: inner conflict with c.id, external conflict w. s
				var rowCausedByItem = extractInnerChairConflicts(c.id);
				rowCausedByItem = rowCausedByItem.concat(extractChairInSessionConflicts(c.id, s));

				// rowCausedByCandidate: inner conflict with s, external conflict w. c.id
				var rowCausedByCandidate = extractInnerChairConflicts(s);
				rowCausedByCandidate = rowCausedByCandidate.concat(extractChairInSessionConflicts(s, c.id));
				
				// rowCausedByOffending: inner conflict with s, external conflict w. c.id
				var rowCausedByOffending = computeChairInnerConflicts(allSessions[s], c);
				rowCausedByOffending = rowCausedByOffending.concat(computeChairOuterConflicts(allSessions[c.id], c));
				
				// rowCausedByCandidateAtOffending: inner conflict with c.id, external conflict w. s
				var c2 = allChairs[allSessions[s].chairs];
				var rowCausedByCandidateAtOffending = computeChairInnerConflicts(allSessions[c.id], c2);
				rowCausedByCandidateAtOffending = rowCausedByCandidateAtOffending.concat(computeChairOuterConflicts(allSessions[s], c2));
				
				var cc = {conflictsCausedByItem: rowCausedByItem,
					  conflictsCausedByCandidate: rowCausedByCandidate,
					  conflictsCausedByOffending: rowCausedByOffending,
					  conflictsCausedByCandidateAtOffending: rowCausedByCandidateAtOffending};
				var space = new sessionChair(s, allSessions[s].chairs);
				swapValue.push(createChairSwapDetails(cc, space));
			    }else{ // inserting
				// rowCausedByItem: inner conflict with c.id, external conflict w. s
				var rowCausedByItem = extractInnerChairConflicts(c.id);
				rowCausedByItem = rowCausedByItem.concat(extractChairInSessionConflicts(c.id, s));

				// rowCausedByCandidate: inner conflict with s, external conflict w. c.id
				var rowCausedByCandidate = [];
				
				// rowCausedByOffending: inner conflict with s, external conflict w. c.id
				var rowCausedByOffending = computeChairInnerConflicts(allSessions[s], c);
				rowCausedByOffending = rowCausedByOffending.concat(computeChairOuterConflicts(allSessions[c.id], c));
				
				// rowCausedByCandidateAtOffending: inner conflict with c.id, external conflict w. s
				var rowCausedByCandidateAtOffending = [];
				
				var cc = {conflictsCausedByItem: rowCausedByItem,
					  conflictsCausedByCandidate: rowCausedByCandidate,
					  conflictsCausedByOffending: rowCausedByOffending,
					  conflictsCausedByCandidateAtOffending: rowCausedByCandidateAtOffending};
				var space = new sessionChair(s, null);
				sessionValue.push(createChairSwapDetails(cc, space));
			    }
			}
		    }
		    continue;
		}
		for(var room in schedule[date][time]){
		    for(var s in schedule[date][time][room]){
			if(schedule[date][time][room][s].chairs == ""){// empty chair
			    var conflictsCausedByCandidate = [];
			    var conflictsCausedByCandidateAtOffending = [];
//			    var conflictsCausedByOffending = conflictsWithRow[date][time]["sum"];// handle this case
			    var conflictsCausedByOffending = extractAllButFromRow(conflictsWithRow[date][time], s);

			    conflictsCausedByOffending = conflictsCausedByOffending.concat(computeChairInnerConflicts(allSessions[s], c));
			    var space = new sessionChair(s, null);

	
			    var cc = {conflictsCausedByItem: conflictsCausedByItem,
				      conflictsCausedByCandidate: conflictsCausedByCandidate,
				      conflictsCausedByOffending: conflictsCausedByOffending,
				      conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
			    sessionValue.push(createChairSwapDetails(cc, space));
			}else{ // swapping
			    var conflictsCausedByCandidate = extractAllChairConflicts(s);
			    var conflictsCausedByCandidateAtOffending = [];
			    if(chairIsScheduled(c)){
				// chair of a scheduled session
				var s2row = computeChairConflictsWithRowAtTimeSlot(allChairs[allSessions[s].chairs], 
										   allSessions[c.id].date,
										   allSessions[c.id].time)
				conflictsCausedByCandidateAtOffending = extractAllButFromRow(s2row, c.id);
				conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(computeChairInnerConflicts(allSessions[c.id], allChairs[allSessions[s].chairs]));
			    }				
			    var conflictsCausedByOffending = extractAllButFromRow(conflictsWithRow[date][time], s);
			    conflictsCausedByOffending = conflictsCausedByOffending.concat(computeChairInnerConflicts(allSessions[s], c));
			    // handle this case
			    var cc = {conflictsCausedByItem: conflictsCausedByItem,
				      conflictsCausedByCandidate: conflictsCausedByCandidate,
				      conflictsCausedByOffending: conflictsCausedByOffending,
				      conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
			    var space = new sessionChair(s, allSessions[s].chairs);
			    swapValue.push(createChairSwapDetails(cc, space));
			}
		    }
		}
	    }
	}
	// target: unscheduled session
	//  source: scheduled chair
	//  supported, nothing happens,  source: unscheduled chair
	//  not supported -- source: chair in unscheduled session
	if(c.authorId in unscheduledChairs || c.id in unscheduled){
	    for(var s in unscheduled){
		var localChair =  allSessions[s].chairs;

		var cc = emptyProtoPropose();
		if(localChair == ''){
		    var space = new sessionChair(s, null);
		    sessionValue.push(createChairSwapDetails(cc, space));
		}else{
		    var space = new sessionChair(s, localChair);
		    swapValue.push(createChairSwapDetails(cc, space));
		}
	    }
	}
	
	if(chairIsScheduled(c)){
	    for(var s in unscheduled){
		var conflictsCausedByCandidate = [];
		var conflictsCausedByCandidateAtOffending = [];
		var space = null;
		
		if(allSessions[s].chairs != ''){ // swapping
		    var s2row = computeChairConflictsWithRowAtTimeSlot(allChairs[allSessions[s].chairs], 
								       allSessions[c.id].date,
								       allSessions[c.id].time)
		    conflictsCausedByCandidateAtOffending = extractAllButFromRow(s2row, c.id);
		    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(computeChairInnerConflicts(allSessions[c.id], allChairs[allSessions[s].chairs]));		
		    space = new sessionChair(s, allSessions[s].chairs);
		}else{ // inserting here
		    space = new sessionChair(s, null);
		}
		
		var conflictsCausedByOffending = [];
		
		var cc = {conflictsCausedByItem: conflictsCausedByItem,
			  conflictsCausedByCandidate: conflictsCausedByCandidate,
			  conflictsCausedByOffending: conflictsCausedByOffending,
			  conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
		if(allSessions[s].chairs == ''){
		    sessionValue.push(createChairSwapDetails(cc, space));
		}else{
		    swapValue.push(createChairSwapDetails(cc, space));
		}
		
	    }
	    
	    for(var c2 in unscheduledChairs){
		var s2row = computeChairConflictsWithRowAtTimeSlot(allChairs[c2],
								   allSessions[c.id].date,
								   allSessions[c.id].time)
		conflictsCausedByCandidateAtOffending = extractAllButFromRow(s2row, c.id);
		conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(computeChairInnerConflicts(allSessions[c.id], allChairs[c2]));		
		space = new sessionChair(null, c2);
		
		var conflictsCausedByOffending = [];
		

		var cc = {conflictsCausedByItem: conflictsCausedByItem,
			  conflictsCausedByCandidate: [],
			  conflictsCausedByOffending: [],
			  conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
		swapValue.push(createChairSwapDetails(cc, space));
	    }
	}

	return {swapValue: swapValue,
		sessionValue: sessionValue};
    }
    
    function proposeChairForSession(session){
	if(session.chairs != ""){
	    // already has a session chair, not the right function to call
	    return;
	}
	var scheduleValue = [];
	var unscheduleValue = [];
	
	var conflictsCausedByItem = [];
	var conflictsCausedByOffending = [];
	
	// Target Chair Is Unscheduled
	for(var c in unscheduledChairs){
	  
	    var space = new sessionChair(null, c);
	    if(session.id in unscheduled){ // no change
		var cc = emptyProtoPropose();
		unscheduleValue.push(createChairSwapDetails(cc, space));
	    }else{
		var conflictsCausedByCandidate = [];
		var conflictsCausedByCandidateAtOffending = []; // moving chair into session;
		var s2row = computeChairConflictsWithRowAtTimeSlot(allChairs[c], session.date, session.time);
		    
		var s2inner = computeChairInnerConflicts(session, allChairs[c]);
		conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(extractAllButFromRow(s2row, session.id));//s2row['sum']);
		conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(s2inner);
		var cc = {conflictsCausedByItem: [],
			  conflictsCausedByCandidate: conflictsCausedByCandidate,
			  conflictsCausedByOffending: [],
			  conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
		unscheduleValue.push(createChairSwapDetails(cc, space));
	    }
	}
	// Target Chair In Unscheduled Session
	for(var s in unscheduled){
	    if(allSessions[s].chairs != ""){
		var c =  allSessions[s].chairs;
		var space = new sessionChair(s, c);
		if(session.id in unscheduled){
		    var cc = emptyProtoPropose();
		    scheduleValue.push(createChairSwapDetails(cc, space));
		}else{
		    var conflictsCausedByCandidate = [];
		    var conflictsCausedByCandidateAtOffending = []; // moving chair into session;
		    var s2row = computeChairConflictsWithRowAtTimeSlot(allChairs[c], session.date, session.time);
		    var s2inner = computeChairInnerConflicts(session, allChairs[c]);
		    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(extractAllButFromRow(s2row, session.id));//s2row['sum']);
		    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(s2inner);
		    var cc = {conflictsCausedByItem: [],
			      conflictsCausedByCandidate: conflictsCausedByCandidate,
			      conflictsCausedByOffending: [],
			      conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
		    scheduleValue.push(createChairSwapDetails(cc, space));
		}
	    }
	}
	
	// Target Chair Is Scheduled
	for(var date in schedule){
	    for(var time in schedule[date]){
		for(var room in schedule[date][time]){
		    for(var s in schedule[date][time][room]){
			var c = allSessions[s].chairs;
			if(c != "" && session.id != s){
			    var space = new sessionChair(s, c);
			    if(session.id in unscheduled){ // Case: source is unscheduled 
				var conflictsCausedByCandidateAtOffending = []; // moving chair into session;
				var conflictsCausedByCandidate = extractAllChairConflicts(s);
				var cc = {conflictsCausedByItem: [],
					  conflictsCausedByCandidate: conflictsCausedByCandidate,
					  conflictsCausedByOffending: [],
					  conflictsCausedByCandidateAtOffending: []};
				scheduleValue.push(createChairSwapDetails(cc, space));
			    }else if(!(time == session.time && date == session.date)){
				// Case: source in different row
				var conflictsCausedByCandidateAtOffending = []; // moving chair into session;
				var s2row = computeChairConflictsWithRowAtTimeSlot(allChairs[c], session.date, session.time);
				var s2inner = computeChairInnerConflicts(session, allChairs[c]);
				conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(extractAllButFromRow(s2row, session.id));//s2row['sum']);
				conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(s2inner);
				var conflictsCausedByCandidate = extractAllChairConflicts(s);
				var cc = {conflictsCausedByItem: [],
					  conflictsCausedByCandidate: conflictsCausedByCandidate,
					  conflictsCausedByOffending: [],
					  conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
				scheduleValue.push(createChairSwapDetails(cc, space));
			    }else if(time == session.time && date == session.date){
				var conflictsCausedByCandidate = extractInnerChairConflicts(s);
				conflictsCausedByCandidate = conflictsCausedByCandidate.concat(extractChairInSessionConflicts(s, session));
				
				var conflictsCausedByCandidateAtOffending = computeChairInnerConflicts(session, allChairs[c]);
				conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(computeChairOuterConflicts(allSessions[s], allChairs[c]));
				
				var cc = {conflictsCausedByItem: [],
					  conflictsCausedByCandidate: conflictsCausedByCandidate,
					  conflictsCausedByOffending: [],
					  conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
				scheduleValue.push(createChairSwapDetails(cc, space));
			    }else{
				console.log("no other case");
			    }
			}
		    }
		}
	    }
	}
	
    	return {scheduleValue: scheduleValue,
		unscheduleValue: unscheduleValue};
    }
    
    
    function proposeSlotAndSwap(s){
	var swapValue = [];
	var slotValue = [];
	
	var conflictsCausedByItem = [];
	if(!(s.id in unscheduled)){
	    conflictsCausedByItem = extractCurrentProtoConflicts(s.id);
	    conflictsCausedByItem = conflictsCausedByItem.concat(extractCurrentChairConflicts(s.id));
	    conflictsCausedByItem = conflictsCausedByItem.concat(extractCurrentChairConflictsWithSession(s.id));
	}
	var conflictsWithRow = 	computeProtoConflictsWithRow(s);
	var chairConflictsWithRow = null;
	if(hasChair(s.id)){
	    chairConflictsWithRow = computeChairConflictsWithRow(allChairs[s.chairs]);
	}
	var chairConflictsAtRowWithSession = computeChairConflictsAtRowWithSession(s);

	for(var date in schedule){
	    for(var time in schedule[date]){
		if(!(s.id in unscheduled) && date == s.date && time == s.time){
		    for(var room in schedule[date][time]){
			if(room != s.room){
			    if(keys(schedule[date][time][room]).length == 0){ // empty slot
				var space = new slot(date, time, room, null);
				var cc = emptyProtoPropose();
				slotValue.push(createSwapDetails(cc, space));
			    }else{
				for(var s2 in schedule[date][time][room]){
				    var space = new slot(date, time, room, s2);
				    var cc = emptyProtoPropose();
				    swapValue.push(createSwapDetails(cc, space));
				}
			    }
			}	
		    }
		    continue; 
		}

		for(var room in schedule[date][time]){
		    if(keys(schedule[date][time][room]).length == 0){ // empty slot			
			var conflictsCausedByCandidate = [];
			var conflictsCausedByCandidateAtOffending = [];
			var conflictsCausedByOffending = conflictsWithRow[date][time]["sum"];// handle this case
			if(hasChair(s.id)){
			    conflictsCausedByOffending = conflictsCausedByOffending.concat(chairConflictsWithRow[date][time]["sum"]);
			}
			conflictsCausedByOffending = conflictsCausedByOffending.concat(chairConflictsAtRowWithSession[date][time]["sum"]);
			if(s.id in unscheduled){
			    var cs = computeSessionInnerConflicts(s);
			    if(hasChair(s.id))
				cs = cs.concat(computeChairInnerConflicts(s, allChairs[s.chairs]));
			    
			    conflictsCausedByOffending = conflictsCausedByOffending.concat(cs);
			}

			var space = new slot(date, time, room, null);
			var cc = {conflictsCausedByItem: conflictsCausedByItem,
				  conflictsCausedByCandidate: conflictsCausedByCandidate,
				  conflictsCausedByOffending: conflictsCausedByOffending,
				  conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
			slotValue.push(createSwapDetails(cc, space));
		    }else{ // session slot
			for(var s2 in schedule[date][time][room]){
			 //   var conflictsCausedByCandidate = extractAllCurrentProtoConflicts(s2);
			    var conflictsCausedByCandidate = extractCurrentProtoConflicts(s2);
			    conflictsCausedByCandidate = conflictsCausedByCandidate.concat(extractCurrentChairConflicts(s2));
			    conflictsCausedByCandidate = conflictsCausedByCandidate.concat(extractCurrentChairConflictsWithSession(s2));

			    var conflictsCausedByCandidateAtOffending = [];
			    if(!(s.id in unscheduled)){
				var s2row = computeProtoConflictsWithRowAtTimeSlot(allSessions[s2], s.date, s.time)
				conflictsCausedByCandidateAtOffending = extractAllButFromRow(s2row, s.id);
				if(hasChair(s2)){
				    var c2row = computeChairConflictsWithRowAtTimeSlot(allChairs[allSessions[s2].chairs], s.date, s.time);
				    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(extractAllButFromRow(c2row, s.id));
				}
				var a2row = computeChairConflictsAtRowWithSessionAtTimeSlot(allSessions[s2], s.date, s.time)
				conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(extractAllButFromRow(a2row, s.id));
			    }
			    
			    var conflictsCausedByOffending = extractAllButFromRow(conflictsWithRow[date][time], s2);
			    if(hasChair(s.id)){
				conflictsCausedByOffending = conflictsCausedByOffending.concat(extractAllButFromRow(chairConflictsWithRow[date][time], s2));
			    }
			    conflictsCausedByOffending = conflictsCausedByOffending.concat(extractAllButFromRow(chairConflictsAtRowWithSession[date][time], s2));
			    if(s.id in unscheduled){
				// add inner conflicts
				var cs = computeSessionInnerConflicts(s);
				if(hasChair(s.id)){
				    cs = cs.concat(computeChairInnerConflicts(s, allChairs[s.chairs]));
				}
				conflictsCausedByOffending = conflictsCausedByOffending.concat(cs);
			    }
			    
			    // handle this case
			    var cc = {conflictsCausedByItem: conflictsCausedByItem,
				      conflictsCausedByCandidate: conflictsCausedByCandidate,
				      conflictsCausedByOffending: conflictsCausedByOffending,
				      conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
			    var space = new slot(date, time, room, s2);
			    swapValue.push(createSwapDetails(cc, space));
			}
		    }
		}
	    }
	}
	
	return {swapValue: swapValue,
		slotValue: slotValue};	
    }
    
    function matchingSessionPaper(session, p){
	return (session["venue"] == p.type ||
		(p.type == "TOCHI" && session["venue"] == "paper"));
    }

    function computePaperSwapConflicts(p1, s1, p2, s2){
	var ignorePairs = false;
	if (p1.session != "null" && !(s1 in unscheduled) && !(s2 in unscheduled) && 
	    ((allSessions[s1].date == allSessions[s2].date) &&
	     (allSessions[s1].time == allSessions[s2].time))){
	    ignorePairs = true;
	}

	var conflictsCausedByItem = [];
	if(p1.session != "null" && !(s1 in unscheduled)){
	    if(ignorePairs){
		for(var c in CCOps.allConflicts["sessions"][s1]){
		    if(CCOps.allConflicts["sessions"][s1][c].constraintType == 'single'){
			conflictsCausedByItem.push(CCOps.allConflicts["sessions"][s1][c]);
		    }
		}
	    }else{
		conflictsCausedByItem = CCOps.allConflicts["sessions"][s1];
	    }
	}

	var conflictsCausedByCandidate = []
	if(!(s2 in unscheduled) && s2 != "null"){
	    if(ignorePairs){
		for(var c in CCOps.allConflicts["sessions"][s2]){
		    if(CCOps.allConflicts["sessions"][s2][c].constraintType == 'single'){
			conflictsCausedByItem.push(CCOps.allConflicts["sessions"][s2][c]);
		    }
		}
	    }else{
		conflictsCausedByCandidate = CCOps.allConflicts["sessions"][s2];
	    }
	}

	var subS1 = [];
	var subS2 = [];
	if(p2 == null){ // inserting into s2
	    if(p1.session != "null"){
		for(var sub in allSessions[s1].submissions){
		    if(allSessions[s1].submissions[sub].id != p1.id)
			subS1.push(allSessions[s1].submissions[sub]);
		}
	    }
	    for(var sub in allSessions[s2].submissions){
		subS2.push(allSessions[s2].submissions[sub]);
	    }
	    subS2.push(p1);
	}else{ // swapping p1 and p2
	    if(p1.session != "null"){
		for(var sub in allSessions[s1].submissions){
		    if(allSessions[s1].submissions[sub].id == p1.id)
			subS1.push(p2);
		    else
			subS1.push(allSessions[s1].submissions[sub]);
		}
	    }
	    for(var sub in allSessions[s2].submissions){
		if(allSessions[s2].submissions[sub].id == p2.id)
		    subS2.push(p1);
		else
		    subS2.push(allSessions[s2].submissions[sub]);
	    }
	}

	if(p1.session == "null"){
	    var hypSessions = {};
	    var hypS2 = createHypSessionSubs(allSessions[s2], subS2);
	    hypSessions[s2] = hypS2;
	    var conflictsCausedByOffending = computeConflictsFromSession(s2, hypSessions, ignorePairs);
	    var conflictsCausedByCandidateAtOffending = [];
	    return {conflictsCausedByItem: conflictsCausedByItem,
		    conflictsCausedByCandidate: conflictsCausedByCandidate,
		    conflictsCausedByOffending: conflictsCausedByOffending,
		    conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
	}else{

	    var hypSessions = {};
	    var hypS1 = createHypSessionSubs(allSessions[s1], subS1); 
	    var hypS2 = createHypSessionSubs(allSessions[s2], subS2);
	    hypSessions[s1] = hypS1;
	    hypSessions[s2] = hypS2;
	    
	    var conflictsCausedByOffending = computeConflictsFromSession(s2, hypSessions, ignorePairs);

	    var conflictsCausedByCandidateAtOffending = computeConflictsFromSession(s1, hypSessions, ignorePairs);

	    return {conflictsCausedByItem: conflictsCausedByItem,
		    conflictsCausedByCandidate: conflictsCausedByCandidate,
		    conflictsCausedByOffending: conflictsCausedByOffending,
		    conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
	}
    }
    
    function computeConflictsFromSession(s, hypSessions, ignorePairs){
	
	var conflicts = [];
	// conflicts caused by offending
	if (s in unscheduled){
	    return conflicts;
	}
	
	for(var i in CCOps.allConstraints){
	    var constraint = CCOps.allConstraints[i];
            if(constraint.constraintType == "single"){
		var paths = hypLegalPaths(s, constraint.entityRules, hypSessions);
		var levels = groupRulesByLevel(constraint.constraintObjectRules);
		for (var p in paths){
		    if(!pathHypBelongs(levels, paths[p], hypSessions)){
			conflicts.push(createSingleHypConflict(paths[p], constraint, hypSessions));
		    }
		}
	    }else if(constraint.constraintType =="pair" && !ignorePairs) {
		var paths1 = hypLegalPaths(s, constraint.entity1Rules, hypSessions);
		var paths2 = hypLegalPaths(s, constraint.entity2Rules, hypSessions);
		var date = hypSessions[s].date;
		var time = hypSessions[s].time;
		var belongLHS = constraint.entities1;
		var belongRHS = constraint.entities2;
		var levels = groupRulesByLevel(constraint.relationRules);
	
		for(var room in schedule[date][time]){
		    for(var s2 in schedule[date][time][room]){
			// go one direction first
			if(s != s2 && s2 in belongRHS){
			    for(var e1 in paths1){
				for(var e2 in belongRHS[s2]){
				    conflicts.push(createPairHypConflict(paths1[e1], belongRHS[s2][e2], constraint, hypSessions));
				}
			    }
			} // then the other
			if(!constraint.isSymmetric && s2 in belongLHS && s != s2){
			    for(var e1 in belongLHS[s2]){
				for(var e2 in paths2){
				    conflicts.push(createPairHypConflict(belongLHS[s2][e1], paths2[e2], constraint, hypSessions));
				}
			    }
			}
			if(s == s2){// handle special case
			    for(var e1 in paths1){
				for(var e2 in paths2){
				    if(!pathHypRelates(levels, paths1[e1], paths2[e2], hypSessions)){
					conflicts.push(createPairHypConflict(paths1[e1], paths2[e2], constraint, hypSessions));
				    }
				}
			    }
			}
		    }
		}
	    }else if(constraint.constraintType =="pairFiltered" && !ignorePairs) {
		// TODO: Assume symmetric
		var paths1 = hypLegalPaths(s, constraint.entity1Rules, hypSessions);
			var date = hypSessions[s].date;
		var time = hypSessions[s].time;
		var belongLHS = constraint.entities1;
		var belongRHS = constraint.entities2;
		var levels = groupRulesByLevel(constraint.filterRules);
		for(var room in schedule[date][time]){
		    for(var s2 in schedule[date][time][room]){
			if(s != s2 && s2 in belongRHS){
			    for(var e1 in paths1){
				for(var e2 in belongRHS[s2]){
				    if(pathHypRelates(levels, paths1[e1], belongRHS[s2][e2], hypSessions)){
					conflicts.push(createPairHypConflict(paths1[e1], belongRHS[s2][e2], constraint, hypSessions));
				    }
				}
			    }
			}
		    }
		}
	    }
	}
	return conflicts;
    }
    
    function proposePaperSessionAndSwap(p){
	var swapValue = []; // paper swaps
	var sessionValue = []; // inserting p in sessions

	var conflictsWithRow = computeProtoPaperWithRow(p.id);//allSessions[p.session], p.id);
	var conflictsCausedByItem = [];
	if(!(p.id in unscheduledSubmissions) && !(p.session in unscheduled)){
	    conflictsCausedByItem = extractCurrentProtoPaperConflicts(p.session, p.id);
	}
	
	for(var date in schedule){
	    for(var time in schedule[date]){
		
		if (!(p.id in unscheduledSubmissions) && !(p.session in unscheduled) &&
		    date == allSessions[p.session].date && time == allSessions[p.session].time){
		    // same time slot
		    for(var room in schedule[date][time]){
			if(room != allSessions[p.session].room){
			    for(var session in schedule[date][time][room]){
				if(matchingSessionPaper(schedule[date][time][room][session], p)){
				    // conflicts within p's session, and between p and target session
				    var subs = schedule[date][time][room][session]['submissions'];
				    var rowWithSession = computeProtoPaperWithinSession(allSessions[session], p);
				    var genericCausedByItem = extractCurrentProtoPaperConflicts(session, p.id);
				    for(var i = 0; len = conflictsCausedByItem.length, i < len; i++){
					if(conflictsCausedByItem[i].entities[0] == conflictsCausedByItem[i].entities[1]){
					    genericCausedByItem.push(conflictsCausedByItem[i]);
					}
				    }
				    
				    // swapping
				    for(var j = 0, len = subs.length; j < len; j++){	
					var p2 = subs[j].id;
					var rowCausedByItem = [];
					for(var i = 0; i < genericCausedByItem.length; i++){
					    if(!((genericCausedByItem[i].conflict[0] == p2 &&
						  genericCausedByItem[i].conflict[1] == p.id) ||
						 (genericCausedByItem[i].conflict[1] == p2 &&
						  genericCausedByItem[i].conflict[0] == p.id) )){
						rowCausedByItem.push(genericCausedByItem[i]);
					    }						 
					}
					var genericCausedByCandidate = extractCurrentProtoPaperConflicts(p.session, p2);
					var rowCausedByCandidate = [];
					for(var i = 0; i < genericCausedByCandidate; i++){
					    if(!((genericCausedByCandidate[i].conflict[0] == p2 &&
						  genericCausedByCandidate[i].conflict[1] == p.id) ||
						 (genericCausedByCandidate[i].conflict[1] == p2 &&
						  genericCausedByCandidate[i].conflict[0] == p.id) )){
						rowCausedByCandidate.push(genericCausedByCandidate[i]);
					    }						 
					}
					var targetadd = extractCurrentProtoPaperConflicts(session, p2);
					for(var i = 0, len2 = targetadd.length; i < len2; i++){
					    if(targetadd[i].entities[0] == targetadd[i].entities[1]){
						rowCausedByCandidate.push(targetadd[i]);
					    }
					}
					

					var rowCausedByOffending = extractAllButFromSession(rowWithSession, p2);
					var offendingSelf = computeProtoPaperAcrossSession(allSessions[p.session],p.id);
					rowCausedByOffending = rowCausedByOffending.concat(offendingSelf);
					//
					var rowCausedByCandidateAtOffending = extractAllButFromSession(computeProtoPaperWithinSession(allSessions[p.session], p2), p.id);
					var offendingCand = computeProtoPaperAcrossSession(allSessions[session], p2);
					rowCausedByCandidateAtOffending = rowCausedByCandidateAtOffending.concat(offendingCand);
					
					var cc = {conflictsCausedByItem: rowCausedByItem, 
						  conflictsCausedByCandidate: rowCausedByCandidate,
						  conflictsCausedByOffending: rowCausedByOffending.map(function(x){return instantiateConflict(p.session, x)}),
						  conflictsCausedByCandidateAtOffending: rowCausedByCandidateAtOffending.map(function(x){return instantiateConflict(session, x)})};
					
					var space = new sessionPaper(session, p2);
					swapValue.push(createSwapDetails(cc, space));
				    }
				    // inserting..
				    var rowCausedByCandidate = [];
				    var rowCausedByCandidateAtOffending = [];
				    var rowCausedByOffending = rowWithSession['sum'];
				    var offendingSelf = computeProtoPaperAcrossSession(allSessions[p.session],p.id);
				    rowCausedByOffending = rowCausedByOffending.concat(offendingSelf);
				    
				    var cc = {conflictsCausedByItem: genericCausedByItem,
					      conflictsCausedByCandidate: rowCausedByCandidate,
					      conflictsCausedByOffending: rowCausedByOffending.map(function(x){return instantiateConflict(p.session, x)}),
					      conflictsCausedByCandidateAtOffending: rowCausedByCandidateAtOffending};
				    var space = new sessionPaper(session, null);
				    sessionValue.push(createSwapDetails(cc, space));
				}
			    }
			}
		    }
		    continue;
		}
		for(var room in schedule[date][time]){
		    for(var session in schedule[date][time][room]){
			if(p.session != session && matchingSessionPaper(schedule[date][time][room][session], p)){
			    // swapping...
			    var subs = schedule[date][time][room][session]['submissions'];
			    var conflictsWithSession = computeProtoPaperWithinSession(allSessions[session], p.id);
			    var conflictsWithoutSession = extractAllButFromRow(conflictsWithRow[date][time], session);
			    for(var p2 = 0, len = subs.length; p2 < len; p2++){
				var conflictsCausedByCandidate = extractCurrentProtoPaperConflicts(session, subs[p2].id);
				var conflictsCausedByOffending = [];
				conflictsCausedByOffending = conflictsCausedByOffending.concat(conflictsWithoutSession);
				conflictsCausedByOffending = conflictsCausedByOffending.concat(extractAllButFromSession(conflictsWithSession, subs[p2].id));
				
				var conflictsCausedByCandidateAtOffending = [];
				if(!(p.id in unscheduledSubmissions) && !(p.session in unscheduled)){
				    var s2row = computeProtoPaperWithRowAtTimeSlot(subs[p2].id, allSessions[p.session].date, allSessions[p.session].time);
				    var s2WithSession = computeProtoPaperWithinSession(allSessions[p.session], subs[p2].id);
				    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(extractAllButFromRow(s2row, p.session));
				    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(extractAllButFromSession(s2WithSession, p.id));
				}
				var cc = {conflictsCausedByItem: conflictsCausedByItem,
					  conflictsCausedByCandidate: conflictsCausedByCandidate,
					  conflictsCausedByOffending: conflictsCausedByOffending.map(function(x){return instantiateConflict(p.session, x)}),
					  conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending.map(function(x){return instantiateConflict(session, x)})};
				var space = new sessionPaper(session, subs[p2].id);
				swapValue.push(createSwapDetails(cc, space));
			    }
			    // inserting...
			    var conflictsCausedByCandidate = [];
			    var conflictsCausedByOffending = [];
			    conflictsCausedByOffending = conflictsCausedByOffending.concat(conflictsWithoutSession);
			    conflictsCausedByOffending = conflictsCausedByOffending.concat(conflictsWithSession['sum']);
			    var conflictsCausedByCandidateAtOffending = [];
			    
			    var cc = {conflictsCausedByItem: conflictsCausedByItem,
				      conflictsCausedByCandidate: conflictsCausedByCandidate,
				      conflictsCausedByOffending: conflictsCausedByOffending.map(function(x){return instantiateConflict(p.session, x)}),
				      conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending.map(function(x){return instantiateConflict(session, x)})};
			    var space = new sessionPaper(session, null);
			    sessionValue.push(createSwapDetails(cc, space));
			}
 		    }
 		}
 	    }
 	}
	
	for(var session in unscheduled){
	    if(p.session != session && matchingSessionPaper(unscheduled[session], p)){
		var subs = unscheduled[session]['submissions'];
		// swapping
		for(var j = 0, len =subs.length; j < len; j++){
		    var p2 = subs[j].id;
		    var conflictsCausedByCandidate = [];
		    var conflictsCausedByOffending = [];
		    var conflictsCausedByCandidateAtOffending = [];
		    if(!(p.id in unscheduledSubmissions) && !(p.session in unscheduled)){
			var s2row = computeProtoPaperWithRowAtTimeSlot(p2, allSessions[p.session].date, allSessions[p.session].time);
			var s2WithSession = computeProtoPaperWithinSession(allSessions[p.session], p2);
			conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(extractAllButFromRow(s2row, p.session));
			conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(extractAllButFromSession(s2WithSession, p.id));
		    }
		    
		    var cc = {conflictsCausedByItem: conflictsCausedByItem,
			      conflictsCausedByCandidate: conflictsCausedByCandidate,
			      conflictsCausedByOffending: conflictsCausedByOffending.map(function(x){return instantiateConflict(p.session, x)}),
			      conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending.map(function(x){return instantiateConflict(session, x)})};
		    var space = new sessionPaper(session, p2);
		    swapValue.push(createSwapDetails(cc, space));
		}
		// inserting
		var conflictsCausedByCandidate = [];
		var conflictsCausedByOffending = [];
		var conflictsCausedByCandidateAtOffending = [];
		var cc = {conflictsCausedByItem: conflictsCausedByItem,
			  conflictsCausedByCandidate: conflictsCausedByCandidate,
			  conflictsCausedByOffending: conflictsCausedByOffending,
			  conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending};
		var space = new sessionPaper(session, null);
		sessionValue.push(createSwapDetails(cc, space));
	    }
	}
    	
	return {swapValue: swapValue,
		sessionValue: sessionValue};
	
// 	for(var date in schedule){
// 	    for(var time in schedule[date]){
// 		for(var room in schedule[date][time]){
// 		    for(var session in schedule[date][time][room]){
// 			if(p.session != session && matchingSessionPaper(schedule[date][time][room][session], p)){
// 			    var cc = null;
// 			    // swapping...
// 			    for(var p2 in schedule[date][time][room][session]['submissions']){
// 				cc = computePaperSwapConflicts(p, p.session, schedule[date][time][room][session]['submissions'][p2], session);
// 				var space = new sessionPaper(session, schedule[date][time][room][session]['submissions'][p2]['id']);
// 				swapValue.push(createSwapDetails(cc, space));
// 			    }
			    
// 			    // inserting...
// 			    cc = computePaperSwapConflicts(p, p.session, null, session);
// 			    var space = new sessionPaper(session, null);
// 			    sessionValue.push(createSwapDetails(cc, space));
// 			}
// 		    }
// 		}
// 	    }
// 	}
	
// 	for(var session in unscheduled){
// 	    if(p.session != session && matchingSessionPaper(unscheduled[session], p)){
// 		var cc = null;
// 		// swapping...
// 		for(var p2 in unscheduled[session]['submissions']){
// 		    cc = computePaperSwapConflicts(p, p.session, unscheduled[session]['submissions'][p2], session);
// 		    var space = new sessionPaper(session, unscheduled[session]['submissions'][p2]['id']);
// 		    swapValue.push(createSwapDetails(cc, space));
// 		}
		
// 		// inserting...
// 		cc = computePaperSwapConflicts(p, p.session, null, session);
// 		var space = new sessionPaper(session, null);
// 		sessionValue.push(createSwapDetails(cc, space));
// 	    }
	// 	}}
    }
    
    function proposePaperSessionAndSwapOld(p){
	var swapValue = [];
	var sessionValue = [];
	
	for(var date in schedule){
	    for(var time in schedule[date]){
		for(var room in schedule[date][time]){
		    for(var session in schedule[date][time][room]){
			if(p.session != session && matchingSessionPaper(schedule[date][time][room][session], p)){
			    var cc = null;
			    // swapping...
			    for(var p2 in schedule[date][time][room][session]['submissions']){
				cc = computePaperSwapConflicts(p, p.session, schedule[date][time][room][session]['submissions'][p2], session);
				var space = new sessionPaper(session, schedule[date][time][room][session]['submissions'][p2]['id']);
				swapValue.push(createSwapDetails(cc, space));
			    }
			    
			    // inserting...
			    cc = computePaperSwapConflicts(p, p.session, null, session);
			    var space = new sessionPaper(session, null);
			    sessionValue.push(createSwapDetails(cc, space));
			}
		    }
		}
	    }
	}
	
	for(var session in unscheduled){
	    if(p.session != session && matchingSessionPaper(unscheduled[session], p)){
		var cc = null;
		// swapping...
		for(var p2 in unscheduled[session]['submissions']){
		    cc = computePaperSwapConflicts(p, p.session, unscheduled[session]['submissions'][p2], session);
		    var space = new sessionPaper(session, unscheduled[session]['submissions'][p2]['id']);
		    swapValue.push(createSwapDetails(cc, space));
		}
		
		// inserting...
		cc = computePaperSwapConflicts(p, p.session, null, session);
		var space = new sessionPaper(session, null);
		sessionValue.push(createSwapDetails(cc, space));
	    }
	}
	return {swapValue: swapValue,
		sessionValue: sessionValue};
    }
    
    function proposePaperForSession(s){
	var scheduleValue = [];
	var unscheduleValue = [];
	
	var conflictsCausedByItem = [];
	var conflictsCausedByOffending = [];


	for (var date in schedule){
	    for (var time in schedule[date]){
		if (!(s.id in unscheduled) && time == s.time && date == s.date){ // at same time slot
		    for (var room in schedule[date][time]){
			if(room == s.room) continue;
			for (var session in schedule[date][time][room]){
			    var subs = schedule[date][time][room][session]['submissions'];
			    for(var p2 = 0, len = subs.length; p2 < len; p2++){	
				var p = subs[p2];
				if(matchingSessionPaper(s, p)){
				    var conflictsAtCandidate = extractCurrentProtoPaperConflicts(session, p.id);
				    // conflicts between p2 and empty session
				    var conflictsCausedByCandidate = extractCurrentProtoPaperConflicts(s.id, p.id);
				    // conflicts between p2 and papers in its own session
				    for(var i = 0; len2 = conflictsAtCandidate.length, i < len2; i++){
					if(conflictsAtCandidate[i].entities[0] == 
					   conflictsAtCandidate[i].entities[1]){
					    conflictsCausedByCandidate.push(conflictsAtCandidate[i]);
					}
				    }
				    var conflictsCausedByCandidateAtOffending = (computeProtoPaperWithinSession(allSessions[s.id], p.id))['sum'];
				    // conflicts between p2 in empty session with everyone else?
				    var offendingSelf = computeProtoPaperAcrossSession(allSessions[session], p.id);
				    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(offendingSelf);
				    
				    var cc = {conflictsCausedByItem: conflictsCausedByItem,
					      conflictsCausedByCandidate: conflictsCausedByCandidate,
					      conflictsCausedByOffending: conflictsCausedByOffending,
					      conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending.map(function(x){return instantiateConflict(session, x)})};
				    
				    var space = new sessionPaper(session, p.id);
				    scheduleValue.push(createSwapDetails(cc, space));
				}
			    }
			}
		    }
		    continue;
		}else{
		    for (var room in schedule[date][time]){
			for (var session in schedule[date][time][room]){
			    var subs = schedule[date][time][room][session]['submissions'];
			    for(var p2 = 0, len = subs.length; p2 < len; p2++){	
				var p = subs[p2];
				if(matchingSessionPaper(s, p)){
				    var conflictsCausedByCandidate = extractCurrentProtoPaperConflicts(session, p.id);
				    var conflictsCausedByCandidateAtOffending = [];
				    if(!(s.id in unscheduled)){
					var conflictsWithRow = computeProtoPaperWithRowAtTimeSlot(p.id, s.date, s.time); //s, p.id);
					var conflictsWithSession = (computeProtoPaperWithinSession(s, p.id))['sum'];
					var conflictsWithoutSession = extractAllButFromRow(conflictsWithRow, s.id);
					conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(conflictsWithoutSession);
					conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(conflictsWithSession);
					
				    }
				    var cc = {conflictsCausedByItem: conflictsCausedByItem,
					      conflictsCausedByCandidate: conflictsCausedByCandidate,
					      conflictsCausedByOffending: conflictsCausedByOffending,
					      conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending.map(function(x){return instantiateConflict(session, x)})};
				    var space = new sessionPaper(session, p.id);
				    scheduleValue.push(createSwapDetails(cc, space));
				}
			    }
			}
		    }
		}
	    }
	}
	for(var p2 in unscheduledSubmissions){
	    var p = unscheduledSubmissions[p2];
	    
	    if(matchingSessionPaper(s, p)){
		var conflictsCausedByCandidate = [];
		var conflictsCausedByCandidateAtOffending = [];
		if(!(s.id in unscheduled)){
		    var conflictsWithRow = computeProtoPaperWithRowAtTimeSlot(p.id, s.date, s.time); //s, p.id);
		    var conflictsWithSession = (computeProtoPaperWithinSession(s, p.id))['sum'];
		    var conflictsWithoutSession = extractAllButFromRow(conflictsWithRow, s.id);
		    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(conflictsWithoutSession);
		    conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(conflictsWithSession);
		    
		}
		var cc = {conflictsCausedByItem: conflictsCausedByItem,
			  conflictsCausedByCandidate: conflictsCausedByCandidate,
			  conflictsCausedByOffending: conflictsCausedByOffending,
			  conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending.map(function(x){return instantiateConflict(null, x)})};
		var space = new sessionPaper(null, p.id); //session, p.id
		unscheduleValue.push(createSwapDetails(cc, space));
	    }
	}
	for(var s2 in unscheduled){
	    var subs = unscheduled[s2]['submissions'];
	    for(var p2 = 0, len = subs.length; p2 < len; p2++){	
		var p = subs[p2];
		if(matchingSessionPaper(s, p)){
		    var conflictsCausedByCandidate = [];
		    var conflictsCausedByCandidateAtOffending = [];
		    if(!(s.id in unscheduled)){
			var conflictsWithRow = computeProtoPaperWithRowAtTimeSlot(p.id, s.date, s.time); //s, p.id);
			var conflictsWithSession = (computeProtoPaperWithinSession(s, p.id))['sum'];
			var conflictsWithoutSession = extractAllButFromRow(conflictsWithRow, s.id);
			conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(conflictsWithoutSession);
			conflictsCausedByCandidateAtOffending = conflictsCausedByCandidateAtOffending.concat(conflictsWithSession);
		    }
		    var cc = {conflictsCausedByItem: conflictsCausedByItem,
			      conflictsCausedByCandidate: conflictsCausedByCandidate,
			      conflictsCausedByOffending: conflictsCausedByOffending,
			      conflictsCausedByCandidateAtOffending: conflictsCausedByCandidateAtOffending.map(function(x){return instantiateConflict(s2, x)})};
		    var space = new sessionPaper(s2, p.id);
		    unscheduleValue.push(createSwapDetails(cc, space));
		}
	    }
	}    
	
	return {scheduleValue: scheduleValue,
	     	unscheduleValue: unscheduleValue};
    }

    function proposePaperForSessionOld(s){
	var scheduleValue = [];
	var unscheduleValue = [];
	
	for(var date in schedule){
	    for(var time in schedule[date]){
		for(var room in schedule[date][time]){
		    for(var session in schedule[date][time][room]){
			for(var submission in schedule[date][time][room][session]['submissions']){
			    var p = schedule[date][time][room][session]['submissions'][submission];
			    if(s.id != session && matchingSessionPaper(s, p)){
				var cc = null;
				cc = computePaperSwapConflicts(p, p.session, null, s.id);
				var space = new sessionPaper(session, p.id);
				var sc = {conflictsCausedByItem: cc.conflictsCausedByCandidate,
					  conflictsCausedByCandidate: cc.conflictsCausedByItem,
					  conflictsCausedByOffending: cc.conflictsCausedByCandidateAtOffending,
					  conflictsCausedByCandidateAtOffending: cc.conflictsCausedByOffending};
				
				scheduleValue.push(createSwapDetails(sc, space));
			    }
			}
		    }
		}
	    }
	}
	
	// look for unscheduled paper
	for(var submission in unscheduledSubmissions){
	    var p = unscheduledSubmissions[submission];
	    if(matchingSessionPaper(s, p)){
		var cc = null;
		cc = computePaperSwapConflicts(p, p.session, null, s.id);
		var sc = {conflictsCausedByItem: cc.conflictsCausedByCandidate,
			  conflictsCausedByCandidate: cc.conflictsCausedByItem,
			  conflictsCausedByOffending: cc.conflictsCausedByCandidateAtOffending,
			  conflictsCausedByCandidateAtOffending: cc.conflictsCausedByOffending};
		var space = new sessionPaper(null, p.id);
		unscheduleValue.push(createSwapDetails(sc, space));
	    }
	}
	
	return {scheduleValue: scheduleValue,
	     	unscheduleValue: unscheduleValue};
    }
    
    function createSwapDetails(cc, space){
	var conflictsResolved = 0;
	
	for(var i in cc.conflictsCausedByCandidate){
	    if(cc.conflictsCausedByCandidate[i].type in protoConstraints &&
	       protoConstraints[cc.conflictsCausedByCandidate[i].type] > 0){
		conflictsResolved-=1;
	    }else{
	    	conflictsResolved+=1;
	    }
	}
		
	for(var i in cc.conflictsCausedByItem){
	    if(cc.conflictsCausedByItem[i].type in protoConstraints &&
	       protoConstraints[cc.conflictsCausedByItem[i].type] > 0){
		conflictsResolved-=1;
	    }else{
	    	conflictsResolved+=1;
	    }
	}
		
	for(var i in cc.conflictsCausedByOffending){
	    if(cc.conflictsCausedByOffending[i].type in protoConstraints &&
	       protoConstraints[cc.conflictsCausedByOffending[i].type] > 0){
		conflictsResolved+=1;
	    }else{
	    	conflictsResolved-=1;
	    }
	}
		
	for(var i in cc.conflictsCausedByCandidateAtOffending){
	    if(cc.conflictsCausedByCandidateAtOffending[i].type in protoConstraints &&
	       protoConstraints[cc.conflictsCausedByCandidateAtOffending[i].type] > 0){
		conflictsResolved+=1;
	    }else{
	    	conflictsResolved-=1;
	    }
	}
		

	    
//	    cc.conflictsCausedByItem.length - 
//	    cc.conflictsCausedByOffending.length - 
//	    cc.conflictsCausedByCandidateAtOffending.length;
	
	
//	cc = removeAddRemove(cc);
	
	return new swapDetails(space,
			       conflictsResolved,
			       cc.conflictsCausedByCandidateAtOffending,
			       cc.conflictsCausedByOffending,
			       cc.conflictsCausedByItem,
			       cc.conflictsCausedByCandidate
			      );
    }


    function createChairSwapDetails(cc, space){
	var conflictsResolved = 0;
	
	for(var i in cc.conflictsCausedByCandidate){
	    if(cc.conflictsCausedByCandidate[i].type in chairConstraints &&
	       chairConstraints[cc.conflictsCausedByCandidate[i].type] > 0){
		conflictsResolved-=1;
	    }else{
	    	conflictsResolved+=1;
	    }
	}
		
	for(var i in cc.conflictsCausedByItem){
	    if(cc.conflictsCausedByItem[i].type in chairConstraints &&
	       chairConstraints[cc.conflictsCausedByItem[i].type] > 0){
		conflictsResolved-=1;
	    }else{
	    	conflictsResolved+=1;
	    }
	}
		
	for(var i in cc.conflictsCausedByOffending){
	    if(cc.conflictsCausedByOffending[i].type in chairConstraints &&
	       chairConstraints[cc.conflictsCausedByOffending[i].type] > 0){
		conflictsResolved+=1;
	    }else{
	    	conflictsResolved-=1;
	    }
	}
		
	for(var i in cc.conflictsCausedByCandidateAtOffending){
	    if(cc.conflictsCausedByCandidateAtOffending[i].type in chairConstraints &&
	       chairConstraints[cc.conflictsCausedByCandidateAtOffending[i].type] > 0){
		conflictsResolved+=1;
	    }else{
	    	conflictsResolved-=1;
	    }
	}
		
	return new swapDetails(space,
			       conflictsResolved,
			       cc.conflictsCausedByCandidateAtOffending,
			       cc.conflictsCausedByOffending,
			       cc.conflictsCausedByItem,
			       cc.conflictsCausedByCandidate
			      );
    }
    
    function removeAddRemove(cc){
	var resA = removeSames(cc.conflictsCausedByCandidateAtOffending,
			       cc.conflictsCausedByItem);
	var resB = removeSames(cc.conflictsCausedByOffending,
    			       cc.conflictsCausedByCandidate);
	
	return { 
	    conflictsCausedByItem: resA.b,
	    conflictsCausedByCandidate: resB.b,
	    conflictsCausedByOffending: resB.a,
	    conflictsCausedByCandidateAtOffending: resA.a
	}
    }
    
    function removeSames(a,b){
	var markedForRemovalA = [];
	var markedForRemovalB = [];
	for(var i in a) markedForRemovalA.push(false);
	for(var i in b) markedForRemovalB.push(false);
	
        for(var i = 0; i < a.length; i++){
	    for(var j = 0; j < b.length; j++){
    		if(a[i].type == b[j].type && a[i].conflict.length == b[j].conflict.length){
    		    var same = false;
		    if(a[i].conflict.length ==1 &&
		       a[i].conflict[0].author == b[j].conflict[0].author &&
    		       a[i].conflict[0].session == b[j].conflict[0].session &&
    		       a[i].conflict[0].submission == b[j].conflict[0].submission){
			same = true;
		    }else if(a[i].conflict.length == 2 && 
			     a[i].conflict[0].author == b[j].conflict[0].author &&
    			     a[i].conflict[0].session == b[j].conflict[0].session &&
    			     a[i].conflict[0].submission == b[j].conflict[0].submission &&
			     a[i].conflict[1].author == b[j].conflict[1].author &&
    			     a[i].conflict[1].session == b[j].conflict[1].session &&
			     a[i].conflict[1].submission == b[j].conflict[1].submission){
			same = true;
		    }else if(a[i].conflict.length == 2 && 
			     a[i].conflict[1].author == b[j].conflict[0].author &&
    			     a[i].conflict[1].session == b[j].conflict[0].session &&
    			     a[i].conflict[1].submission == b[j].conflict[0].submission &&
			     a[i].conflict[0].author == b[j].conflict[1].author &&
    			     a[i].conflict[0].session == b[j].conflict[1].session &&
			     a[i].conflict[0].submission == b[j].conflict[1].submission){
			same = true;
		    }
		    if(same){
    			markedForRemovalA[i] = true;
			markedForRemovalB[j] = true;
			break;
		    }
		}
	    }
        }
	var ap = [];
	var bp = [];
	for(var i in a){
	    if(!markedForRemovalA[i]) ap.push(a[i]);
	}
	for(var i in b){
	    if(!markedForRemovalB[i]) bp.push(b[i]);
	}
	return {a: ap,
		b: bp};
    }
    
    function clone(obj) {
	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;
	
	// Handle Array
	if (obj instanceof Array) {
	    var copy = [];
	    for (var i = 0, len = obj.length; i < len; i++) {
		copy[i] = clone(obj[i]);
	    }
	    return copy;
	}
	
	// Handle Object
	if (obj instanceof Object) {
	    var copy = {};
	    for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
	    }
	    return copy;
	}
	
	throw new Error("Unable to copy obj! Its type isn't supported.");
    }
    
    function copySession(s){
	return clone(s);
    }
    
    function createHypSessionLoc(s, date, time, room){
	hypSession = clone(s);
	hypSession.date = date;
	hypSession.time = time;
	hypSession.room = room;
	return hypSession;
    } 

    function createHypSessionSubs(s, subs){
	hypSession = clone(s);
	hypSession['submissions'] = subs;
	return hypSession;
    }
    
    function equal(a, b){
	return a == b;
    }

    function legalPathPairs(rules, entities1, entities2){
	var levels = groupRulesByLevel(rules);
	var pathPairs = {};
	for (var s1 in entities1){
	    paths = legalPathPairsForSession(s1, levels, entities1, entities2);
	    if (paths != null){
		pathPairs[s1] = paths;
	    }
	}
	return pathPairs;
    }
    
    function legalPathPairsForHypSession(paths1, levels, entities2, hypSessions){
	var pathPairs = {};
	for(var s2 in entities2){
	    var paths = [];
	    for (var e1 in paths1){
		for(var e2 in entities2[s2]){
		    var path1 = paths1[e1];
		    var path2 = entities2[s2][e2];
		    if(pathHypRelates(levels, path1, path2, hypSessions)){
			paths.push({'p1': path1,
				    'p2': path2});
		    }
		}
	    }
	}
	return pathPairs;
    }

    
    function legalPathPairsForTwoSessions(s1, s2, levels, entities1, entities2){
	var paths = [];
	for(var e1 in entities1[s1]){
	    for(var e2 in entities2[s2]){
		var path1 = entities1[s1][e1];
		var path2 = entities2[s2][e2];
		if(pathRelates(levels, path1, path2)){
		    paths.push({'p1': path1,
				'p2': path2});
		}
	    }
	}
	return paths;
    }
    
    function legalPathPairsForSession(s1, levels, entities1, entities2){
	var pathPairs = {};
	var changed = false;
	for(var s2 in entities2){
	    var paths = legalPathPairsForTwoSessions(s1, s2, levels, entities1, entities2);
	    if(paths.length > 0){
		changed = true;
		pathPairs[s2] = paths;
	    }
	}
	if(!changed)
	    return null;
	else
	    return pathPairs;
	
    }

    function pathHypRelates(levels, path1, path2, hypSessions){
	var session1 = allSessions[path1.session];
	var session2 = allSessions[path2.session];
	if(path1.session in hypSessions)
	    session1 = hypSessions[path1.session];
	if(path2.session in hypSessions)
	    session2 = hypSessions[path2.session];
	
	for (var sessionRule in levels['session']){
	    if(!(levels['session'][sessionRule].comp)(session1,
						      session2)){
		return false;
	    }
	}
	// check submission level
	for(var submissionRule in levels['submission']){
	    var comp = levels['submission'][submissionRule].comp;
	    if(!comp(session1.submissions[path1.submission],
		     session2.submissions[path2.submission])){
		return false;
	    }else{
	    }
	}
	
	// check author level 
	for(var authorRule in levels['author']){
	    if(!(levels['author'][authorRule].comp)(session1.submissions[path1.submission].authors[path1.author],
						    session2.submissions[path2.submission].authors[path2.author])){
		return false;
	    }
	}
	
	return true;
	
    }
    function pathRelates(levels, path1, path2){
	// TODO: track where violations are happening
	// check session level
	for (var sessionRule in levels['session']){
	    if(!(levels['session'][sessionRule].comp)(allSessions[path1.session], 
						      allSessions[path2.session])){
		return false;
	    }
	}
	// check submission level
	for(var submissionRule in levels['submission']){
	    var comp = levels['submission'][submissionRule].comp;
	    if(!comp(allSessions[path1.session].submissions[path1.submission],
		     allSessions[path2.session].submissions[path2.submission])){
		return false;
	    }else{
	    }
	}
	
	// check author level 
	for(var authorRule in levels['author']){
	    if(!(levels['author'][authorRule].comp)(allSessions[path1.session].submissions[path1.submission].authors[path1.author],
						    allSessions[path2.session].submissions[path2.submission].authors[path2.author])){
		return false;
	    }
	}
	
	return true;
    }
    
    function pathBelongs(levels, path){
	// TODO: track where violations are happening
	// check session level
	for (var sessionRule in levels['session']){
	    if(!(levels['session'][sessionRule].comp)(allSessions[path.session])){
		return false;
	    }
	}
	// check submission level
	for(var submissionRule in levels['submission']){
	    var comp = levels['submission'][submissionRule].comp;
	    if(!comp(allSessions[path.session].submissions[path.submission])){
		return false;
	    }else{
	    }
	}
	
	// check author level 
	for(var authorRule in levels['author']){
	    if(!(levels['author'][authorRule].comp)(allSessions[path.session].submissions[path.submission].authors[path.author])){
		return false;
	    }
	}
	
	return true;
    }
    
    function pathsHypBelongs(levels, paths, hypSessions){
	// return paths if session satisfies rules
	var legal = [];
	for(var i in paths){
	    legal.push(true);
	}
	for(var i in paths){
	    legal[i] = pathHypBelongs(levels, paths[i], hypSessions);	    
	}
	return legal;
    }
    

    function pathHypBelongs(levels, path, hypSessions){
	// TODO: track where violations are happening
	// check session level
	var session = allSessions[path.session];
	if(path.session in hypSessions){
	    session = hypSessions[path.session];
	}
	
	for (var sessionRule in levels['session']){
	    if(!(levels['session'][sessionRule].comp)(session)){
		return false;
	    }
	}
	// check submission level
	for(var submissionRule in levels['submission']){
	    var comp = levels['submission'][submissionRule].comp;
	    if(!comp(session.submissions[path.submission])){
		return false;
	    }else{
	    }
	}
	
	// check author level 
	for(var authorRule in levels['author']){
	    if(!(levels['author'][authorRule].comp)(session.submissions[path.submission].authors[path.author])){
		return false;
	    }
	}
	
	return true;
    }
    
    
    function pathsBelongs(levels, paths){
	// return paths if session satisfies rules
	var legal = [];
	for(var i in paths){
	    legal.push(true);
	}
	for(var i in paths){
	    legal[i] = pathBelongs(levels, paths[i]);	    
	}
	return legal;
    }
    
    function groupRulesByLevel(rules){
	var levels = {};
	// group rules by the level at which they operate
	levels['session'] = [];
	levels['submission'] = [];
	levels['author'] = [];
	for(var i = 0; i < rules.length; i++){
	    levels[rules[i].level].push(rules[i]);
	}
	return levels;
    }
    
    function updateAllConstraintEntities(affectedSessions){
	// array of session ids
	for(var i in CCOps.allConstraints){
	    if(!(CCOps.allConstraints[i].type in protoConstraints) && !(CCOps.allConstraints[i].type in chairConstraints)){
		
	    
	    updateConstraintEntities(affectedSessions, CCOps.allConstraints[i]);
	    }
	}
    }

    function updateConstraintEntities(affectedSessions, constraint){
	if(constraint.constraintType == "single"){		
	    for(var i in affectedSessions){
		var sessionPath = updateLegalPaths(affectedSessions[i], 
						   constraint.entityRules);
		if(sessionPath.length == 0 && (affectedSessions[i] in constraint.entities)){
		    delete constraint.entities[affectedSessions[i]];
		}else{
		    constraint.entities[affectedSessions[i]] = sessionPath;
		}
	    }
	}else {
	    for(var i in affectedSessions){
		var sessionPath = updateLegalPaths(affectedSessions[i], 
						   constraint.entity1Rules);

		if(sessionPath.length == 0 && (affectedSessions[i] in constraint.entities1)){
		    delete constraint.entities1[affectedSessions[i]];
		}else{
		    constraint.entities1[affectedSessions[i]] = sessionPath;
		}
		
		sessionPath = updateLegalPaths(affectedSessions[i], 
					       constraint.entity2Rules);
		if(sessionPath.length == 0 && (affectedSessions[i] in constraint.entities2)){
		    delete constraint.entities2[affectedSessions[i]];
		}else{
		    constraint.entities2[affectedSessions[i]] = sessionPath;
		}
	    }
	    
	    if (constraint.constraintType == "pairFiltered"){
		for(var i in affectedSessions){
		    // update legal paths
	            var levels = groupRulesByLevel(constraint.filterRules);
		    if(affectedSessions[i] in constraint.entityPairs){
			delete constraint.entityPairs[affectedSessions[i]];
		    }
		    var paths = legalPathPairsForSession(affectedSessions[i], levels, constraint.entities1, constraint.entities2);
		    if(paths != null){
			constraint.entityPairs[affectedSessions[i]] = paths;
		    }
		    // still have to go through all paths where sessions are on RHS and update 
		    // them too
		    for(var s in constraint.entityPairs){
			if(affectedSessions[i] in constraint.entityPairs[s]){
			    delete constraint.entityPairs[s][affectedSessions[i]];
			}
			var affPaths = legalPathPairsForTwoSessions(s, affectedSessions[i], levels, constraint.entities1, constraint.entities2);
			if(affPaths.length > 0)
			    constraint.entityPairs[s][affectedSessions[i]] = affPaths; 
			
		    }
		}
	    }
	}
    }
    
    function hypLegalPaths(s, rules, hypSessions){
	var levels = groupRulesByLevel(rules);
	var paths = generatePaths(hypSessions[s], levels); 
	var legal = pathsHypBelongs(levels, paths, hypSessions);
	var legalPaths = [];
	for(var i in legal){
	    if (legal[i]) legalPaths.push(paths[i]);
	}
	return legalPaths;

    }
    
    function updateLegalPaths(s, rules){
	var levels = groupRulesByLevel(rules);
	var paths = generatePaths(allSessions[s], levels);
	var legal = pathsBelongs(levels, paths);
	var legalPaths = [];
	for(var i in legal){
	    if (legal[i]) legalPaths.push(paths[i]);
	}
	return legalPaths;
    }

    function belongs(rules){
	var matchesBySession = {};
	var levels = groupRulesByLevel(rules);
	for(var s in allSessions){
	    var paths = generatePaths(allSessions[s], levels);
	    var legal = pathsBelongs(levels, paths);
	    var legalPaths = [];
	    for(var i in legal){
		if (legal[i]) legalPaths.push(paths[i]);
	    }
	    if(legalPaths.length > 0){
		matchesBySession[s] = legalPaths;
	    }
	}
	//	console.log(matches);
	return matchesBySession;
    }
	
    function violates(rules, paths){
	// given a set of paths, figure out which paths violates the rules
	var levels = groupRulesByLevel(rules);
	var legal = pathsBelongs(levels, paths);
	var violatingPaths = [];
	for(var i in legal){
	    if (!legal[i]) violatingPaths.push(paths[i]);
	}
	return violatingPaths;
    }

    function satisfies(rules, paths){
	// given a set of paths, figure out which paths violates the rules
	var levels = groupRulesByLevel(rules);
	var legal = pathsBelongs(levels, paths);
	var acceptingPaths = [];
	for(var i in legal){
	    if (legal[i]) acceptingPaths.push(paths[i]);
	}
	return acceptingPaths;
    }
    
    function generatePaths(s, levels){
	var paths = [];
	if(levels['submission'].length != 0 || levels['author'].length != 0){
	    for(var sub in s.submissions){
		if(levels['author'].length != 0){
		    for(var auth in s.submissions[sub].authors){
			paths.push(new entityTrace(s.id, sub, auth));
		    }
		}else{
		    // just generate sub level paths
		    paths.push(new entityTrace(s.id, sub, null));
		}
	    }
	}else{
	    paths.push(new entityTrace(s.id, null, null));
	}
	return paths;
    }

    function checkPairConflicts(constraint){
	var violationsBySession = {};
	var conflictList = [];
	
	var belongLHS = constraint.entities1;
	var belongRHS = constraint.entities2;
	var levels = groupRulesByLevel(constraint.relationRules);

	// assume only have to check at same time slot relations
	for(var date in schedule){
	    for(var time in schedule[date]){
		var roomKeys = keys(schedule[date][time]);
		for(var i = 0; i < roomKeys.length; i++){
		    for(var s1 in schedule[date][time][roomKeys[i]]){
			if (s1 in belongLHS){
			    var start = 0;
			    if(constraint.isSymmetric){
				start = i+1;
			    }
			    for(var j = start; j < roomKeys.length; j++){
			    	for(var s2 in schedule[date][time][roomKeys[j]]){
				    if(s1 != s2 && s2 in belongRHS){
					for(var e1 in belongLHS[s1]){
					    for(var e2 in belongRHS[s2]){
						if(!pathRelates(levels, belongLHS[s1][e1], belongRHS[s2][e2])){
						    var conflict = createPairConflict(belongLHS[s1][e1], belongRHS[s2][e2], constraint);
						    conflictList.push(conflict);
						}
					    }
					}
				    }else if(s1 == s2){
					for(var e1 in belongLHS[s1]){
					    for(var e2 in belongRHS[s2]){
						if(!pathRelates(levels, belongLHS[s1][e1], belongRHS[s2][e2])){
						    var conflict = createPairConflict(belongLHS[s1][e1], belongRHS[s2][e2], constraint);
						    conflictList.push(conflict);
						}
					    }
					}
					
				    }
				}
			    }
			    
			}
		    }
		}
	    }
	}
	return conflictList;
    }
    
    function checkFilteredPairConflicts(constraint){
	var violationsBySession = {};
	var conflictList = [];
	
	var entityPairs = constraint.entityPairs;

	// 2. Get eligible RHS sessions

	var levels = groupRulesByLevel(constraint.relationRules);
		
	// assume only have to check at same time slot relations
	for(var date in schedule){
	    for(var time in schedule[date]){
		var roomKeys = keys(schedule[date][time]);
		for(var i = 0; i < roomKeys.length; i++){
		    for(var s1 in schedule[date][time][roomKeys[i]]){
			if (s1 in entityPairs){
			    var start = 0;
			    if(constraint.isSymmetric){
				start = i+1;
			    }
			    for(var j = start; j < roomKeys.length; j++){
				if(j!=i){
				    for(var s2 in schedule[date][time][roomKeys[j]]){
					if (s2 in entityPairs[s1]){
					    for (var entityPair in entityPairs[s1][s2]){
						if(!pathRelates(levels, entityPairs[s1][s2][entityPair].p1, 
								entityPairs[s1][s2][entityPair].p2)){
						    
						    var conflict = createPairConflict(entityPairs[s1][s2][entityPair].p1,
										      entityPairs[s1][s2][entityPair].p2,
										      constraint);
						    conflictList.push(conflict);
						}
					    }
					}
				    }
				}
			    }
			}
		    }
		}
	    }
	}
    	return conflictList;
    }
    
    function checkSingleConflicts(constraint){
	// TODO: explain why doesn't match
	// assume single entity constraint
	// 1. Get eligible sessions
	var belongList = constraint.entities;
	var conflicts = [];
	
	// 2. find all that violates constraint
	for(var s in belongList){
	    var violations = violates(constraint.constraintObjectRules,
				      belongList[s]); // paths
	    for(var i in violations){
		conflicts.push(createSingleConflict(violations[i], constraint));
	    }
	}
	return conflicts;
    }
    
    function revealPath(path){
	if(path.author != null) {
	    return allSessions[path.session].submissions[path.submission].authors[path.author].firstName + " " + 
		allSessions[path.session].submissions[path.submission].authors[path.author].lastName + ", " + 
		allSessions[path.session].title;
	}else if(path.submission != null){
	    return allSessions[path.session].submissions[path.submission].title + ", " + allSessions[path.session].title;
	}else{
	    return allSessions[path.session].personas + ", " + allSessions[path.session].title;
	}
    }

    function computeNewFilteredPairConflicts(s1, s2, hypSessions){
	var conflicts = [];

	for(var i in CCOps.allConstraints){
	    if(CCOps.allConstraints[i].type in protoConstraints) continue;
	    var constraint = CCOps.allConstraints[i];
	    if(constraint.constraintType == "pairFiltered"){
		var entityPairs = constraint.entityPairs;
		var levels = groupRulesByLevel(constraint.relationRules);
		
		// go one direction first
		if((s1 in entityPairs) && (s2 in entityPairs[s1])){
		    for(var entityPair in entityPairs[s1][s2]){
			// TODO, assume don't need hyp session here 
			// or even to check if path relates
			var conflict = createPairHypConflict(entityPairs[s1][s2][entityPair].p1,
							     entityPairs[s1][s2][entityPair].p2,
							     constraint,
							     hypSessions);
			conflicts.push(conflict);
		    }
		}
		// then the other
		if(!constraint.isSymmetric && (s2 in entityPairs) && (s1 in entityPairs[s2])){
		    for(var entityPair in entityPairs[s2][s1]){
			var conflict = createPairHypConflict(entityPairs[s2][s1][entityPair].p1,
							     entityPairs[s2][s1][entityPair].p2,
							     constraint,
							     hypSessions);
			conflicts.push(conflict);
		    }
		}
	    }
	}
	return conflicts;
    }
    
    // assumes s1 and s2 not same and just checking for in different session
    function computeNewPairConflicts(s1, s2, hypSessions){
	var conflicts = [];

	for(var i in CCOps.allConstraints){
	    if(CCOps.allConstraints[i].type in protoConstraints) continue;
	    var constraint = CCOps.allConstraints[i];
	    if(constraint.constraintType == "pair"){
		var belongLHS = constraint.entities1;
		var belongRHS = constraint.entities2;
		var levels = groupRulesByLevel(constraint.relationRules);
		// go one direction first
		if((s1 in belongLHS) && (s2 in belongRHS)){
		    for(var e1 in belongLHS[s1]){
			for(var e2 in belongRHS[s2]){
			    if(!pathHypRelates(levels, belongLHS[s1][e1], belongRHS[s2][e2], hypSessions)){
				var conflict = createPairHypConflict(belongLHS[s1][e1],
								     belongRHS[s2][e2],
								     constraint, hypSessions);
				conflicts.push(conflict);
			    }
			}
		    }
		}
		// then the other
		if(!constraint.isSymmetric && s1 != s2 && (s2 in belongLHS) && (s1 in belongRHS)){
		    for(var e1 in belongLHS[s2]){
			for(var e2 in belongRHS[s1]){
			    if(!pathHypRelates(levels, belongLHS[s2][e1], belongRHS[s1][e2], hypSessions)){
				var conflict = createPairHypConflict(belongLHS[s2][e1],
								     belongRHS[s1][e2],
								     constraint, hypSessions);
				conflicts.push(conflict);
			    }
			}
		    }
		}
	    }
	}
	return conflicts;
    }
    
    function computeNewSingleConflicts(s, hypSessions){
	var conflicts = [];
	
	for(var i in CCOps.allConstraints){
	    if(CCOps.allConstraints[i].type in protoConstraints) continue;
	    var constraint = CCOps.allConstraints[i];
	    if(constraint.constraintType == "single"){
		var belongList = constraint.entities;
		if(s in belongList){
		    var levels = groupRulesByLevel(constraint.constraintObjectRules);
		    
		    for(var p in belongList[s]){
			if(!pathHypBelongs(levels, belongList[s][p], hypSessions)){ 
			    conflicts.push(createSingleHypConflict(belongList[s][p],
								   constraint, hypSessions));
			}
		    }
		}
	    }
	}
    
	return conflicts;
    }
    
    
    return {allConstraints: allConstraints,
	    allConflicts: allConflicts,
	    proposeSlotAndSwap: proposeSlotAndSwap,
	    proposePaperSessionAndSwap: proposePaperSessionAndSwap,
	    proposePaperForSession: proposePaperForSession,
	    proposeSessionForSlot: proposeSessionForSlot,
	    proposeChairForSession: proposeChairForSession,
	    proposeChairSessionAndSwap: proposeChairSessionAndSwap,
	    updateAllConstraintEntities: updateAllConstraintEntities,
	    computePaperSwapConflicts: computePaperSwapConflicts,
	    initialize: initialize,
	    getAllConflicts: getAllConflicts,
	    belongs: belongs,
	    equal: equal,
	    legalPathPairs: legalPathPairs,
	    removeSames: removeSames,
	    authorsourcingData: authorsourcingData,
	    authorsourcingAuthor: authorsourcingAuthor,
	    generateAuthorsourcingConstraints: 	    generateAuthorsourcingConstraints,
	    generatePersonaConstraints:	    generatePersonaConstraints,
	    generateAuthorConstraints: generateAuthorConstraints,
	    scoreThreshold: scoreThreshold,
	    goodThreshold: goodThreshold,
	    fitMat: fitMat,
	    notokMat: notokMat,
	    intMat: intMat,
	    authorMat: authorMat, 
	    personaMat: personaMat,
	    chairNotokMat: chairNotokMat,
	    chairFitMat: chairFitMat,
	    chairAuthorMat: chairAuthorMat,
	    chairIntMat: chairIntMat,
	    protoConstraints: protoConstraints,
	    chairConstraints: chairConstraints
	   };
}();

