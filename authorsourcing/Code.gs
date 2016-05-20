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

var SPREADSHEET_ID = '0AmqG_XlmGMXZdGY3VDBPTjh6dkxlOElZYW85WUFvUFE';

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp */)
  {
    "use strict";
 
    if (this == null)
      throw new TypeError();
 
    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();
 
    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }
 
    return res;
  };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if (!Array.prototype.map) {
  Array.prototype.map = function(callback, thisArg) {
 
    var T, A, k;
 
    if (this == null) {
      throw new TypeError(" this is null or not defined");
    }
 
    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);
 
    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;
 
    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
    }
 
    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (thisArg) {
      T = thisArg;
    }
 
    // 6. Let A be a new array created as if by the expression new Array(len) where Array is
    // the standard built-in constructor with that name and len is the value of len.
    A = new Array(len);
 
    // 7. Let k be 0
    k = 0;
 
    // 8. Repeat, while k < len
    while(k < len) {
 
      var kValue, mappedValue;
 
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {
 
        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[ k ];
 
        // ii. Let mappedValue be the result of calling the Call internal method of callback
        // with T as the this value and argument list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);
 
        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor {Value: mappedValue, : true, Enumerable: true, Configurable: true},
        // and false.
 
        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });
 
        // For best browser support, use the following:
        A[ k ] = mappedValue;
      }
      // d. Increase k by 1.
      k++;
    }
 
    // 9. return A
    return A;
  };      
}

function rtrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}

function doPost(e) {
  var app = UiApp.getActiveApplication();
  
  var presenters = [];
  var sessionFits = [];
  var interested = [];
  Logger.log(e.parameter);

  for(var key in e.parameter){
    if(key.indexOf("presenter") === 0){
      presenters.push(e.parameter[key]);
    }
    if(key.indexOf("session") === 0){      
      sessionFits.push({ id: key.substr(7), value: e.parameter[key]});
     
    }
    if(key.indexOf("interest") === 0){
     interested.push(e.parameter[key]); 
    }
  }
  Logger.log(presenters);
  Logger.log(sessionFits);
  Logger.log(interested);
 
  var great = sessionFits.filter(function(m) { return m.value == "great"}).map(function(a) {return a.id});
  var ok = sessionFits.filter(function(m) { return m.value == "ok"}).map(function(a) {return a.id});
  var notok = sessionFits.filter(function(m) { return m.value == "not"}).map(function(a) {return a.id});
  var dontknow = sessionFits.filter(function(m) { return m.value == "dontknow"}).map(function(a) {return a.id});
  var now = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  
  SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Results').appendRow([e.parameter.startTime, now, e.parameter.personName, e.parameter.paperId, presenters.join(), e.parameter.candidates, great.join(), ok.join(), notok.join(), dontknow.join(), interested.join(), e.parameter.candidates20, e.parameter.moreClicked1, e.parameter.moreClicked2, e.parameter.candidatesSpecial, e.parameter.candidatesSpecial20, e.parameter.comments]);

  var thankyou = app.createHTML("Thank you for submitting your preferences. <br><br>Please complete the same form for your other papers, <br>and remind your co-authors to submit their preferences as well.<br><br>We look forward to seeing you in Paris!")
  thankyou.setStyleAttributes({"margin": "40px", "width": "40em", "border": "1px solid rgb(233,233,233)", "padding": "10px", "font-size": "1.2em"});
  app.add(thankyou);
  app.setStyleAttribute("margin", "100px");
  return app;
}


// Task 1: Tell us who you are
function displayName(app, flow, paperId){
    var q1HTML = app.createHTML('<strong>1. Tell us your name: </strong> (as it appears in the paper)').setId('inviteLabel');
    q1HTML.setStyleAttributes({'font-size': '1.1em'});
    flow.add(app.createHTML("<br/><br/>"));   
    flow.add(q1HTML);
  
    /*
    var nameBox = app.createListBox().setName("personName").setId("personName");
    nameBox.addItem("");
    for(var i = 0; i < authors.length; i++){
       nameBox.addItem(authors[i], authors[i]);
    }    
    flow.add(nameBox);
    */
    
    var nameBox = app.createTextBox().setName("personName").setId("personName");
    nameBox.setStyleAttributes({'width': '450px', 'height': '24px'});
    flow.add(nameBox);
    
    flow.add(app.createHTML("<br/>"));
    flow.add(app.createHidden('paperId', paperId).setId('paperId'));
    flow.add(app.createHTML("<br/><br/>")); 
  
    
//    // Task 2: Identify who is/are presenting
//    flow.add(app.createLabel('2. Please identify the presenter(s), to the best of your knowledge: ').setId('presenterLabel'));
//    for(var i = 0; i < authors.length; i++){
//      var chbox = app.createCheckBox(authors[i]).setFormValue(authors[i]).setName("presenter" + i);     
//      flow.add(chbox).add(app.createHTML(""));
//    }
//    flow.add(app.createHTML("<br/>"));
  
    return nameBox;
}


// Task 3: Tell us which papers would be great in your session
function displayPreferences(app, flow, candidates, isTop10){
    var panel = app.createVerticalPanel();
    if (isTop10)
      panel.setId('top10Panel1');
    else
      panel.setId('top20Panel1').setVisible(false);
  
    if (isTop10){
      var q2HTML = app.createHTML('<strong>2. We\'ve identified 10 papers that may be similar to yours. <br>Tell us how they would fit in a session with your paper: </strong>').setId('inviteLabel');
      q2HTML.setStyleAttributes({'font-size': '1.1em'});
      panel.add(q2HTML);
    }
    panel.add(app.createHTML("<br/>"));
  
    var candidateNames = [];
    
    for(var candidate in candidates){
      candidateNames.push(candidate);
      var title = app.createLabel(rtrim(candidates[candidate]["Paper Title"], "\n")).setId(candidate);
      title.setStyleAttributes({'float': 'left', 'margin-right': '10px', 'font-weight': 'bold'});
      
      var button = app.createLabel("[abstract]");
      button.setStyleAttributes({'text-decoration':'underline', 'color':'#2A5DB0'});
      
      var button2 = app.createLabel("[abstract]");
      button2.setStyleAttributes({'text-decoration':'underline', 'color':'#2A5DB0'});
      button2.setVisible(false);
      
      var abstract =  app.createLabel(candidates[candidate]["Abstract"]).setWidth("40em").setWordWrap(true).setStyleAttributes({"margin": "20px", "border": "1px solid rgb(233,233,233)", "padding": "10px"});
      abstract.setVisible(false);
      
      var handler = app.createClientHandler().forTargets(abstract).setVisible(true).forTargets(button2).setVisible(true).forTargets(button).setVisible(false);
      button.addClickHandler(handler);
           
      var handler2 = app.createClientHandler().forTargets(abstract).setVisible(false).forTargets(button2).setVisible(false).forTargets(button).setVisible(true);
      button2.addClickHandler(handler2);
      
      var hPanel = app.createHorizontalPanel();
      hPanel.add(title).add(button).add(button2);
      panel.add(hPanel);
      panel.add(app.createHTML("")).add(abstract).add(app.createHTML(""))

      panel.add(app.createRadioButton("session" + candidate, "Great in same session").setFormValue("great").setName("session" + candidate));
      panel.add(app.createHTML(""));

      panel.add(app.createRadioButton("session" + candidate, "Okay in same session").setFormValue("ok").setName("session" + candidate));
      panel.add(app.createHTML(""));
      
      panel.add(app.createRadioButton("session" + candidate, "Not sure if it should be in same session").setFormValue("dontknow").setName("session" + candidate));
      panel.add(app.createHTML(""));
      
      panel.add(app.createRadioButton("session" + candidate, "Should not be in same session").setFormValue("not").setName("session" + candidate));  
      


      panel.add(app.createHTML("<br/>"));
    }
  
    if (isTop10)
      panel.add(app.createHidden('candidates', candidateNames.join()).setId('candidates'));
    else
      panel.add(app.createHidden('candidates20', candidateNames.join()).setId('candidates20'));
  
    flow.add(panel);
    return panel;
}

// Task 4: Check any papers below that you would be interested in seeing at CHI 2013. We will try our best not to schedule them alongside your session.
function displayInterests(app, flow, candidates, specialCandidates, isTop10){
    var panel = app.createVerticalPanel();
    if (isTop10)
      panel.setId('top10Panel2');
    else
      panel.setId('top20Panel2').setVisible(false);
  
    if (isTop10){
      var q3HTML = app.createHTML("<strong>3. Of the papers and sessions below, check the ones you'd personally like to attend. <br>We will try our best not to schedule them in conflict with your session.<strong>").setId('inviteLabel');
      q3HTML.setStyleAttributes({'font-size': '1.1em'});
      panel.add(q3HTML);
    }
    
    panel.add(app.createHTML("<br/>"));
    for(var candidate in candidates){
     
      var chbox = app.createCheckBox(candidates[candidate]["Paper Title"]).setFormValue(candidates[candidate]["PaperId"]).setName("interested" + candidates[candidate]["PaperId"]);   
      
      chbox.setStyleAttribute('float', 'left');
      chbox.setStyleAttribute('margin-right', '10px');
      
      var button = app.createLabel("[abstract]");
      button.setStyleAttributes({'text-decoration':'underline', 'color':'#2A5DB0'});
      
      var button2 = app.createLabel("[abstract]");
      button2.setStyleAttributes({'text-decoration':'underline', 'color':'#2A5DB0'});
      button2.setVisible(false);
      
      var abstract =  app.createLabel(candidates[candidate]["Abstract"]).setWidth("40em").setWordWrap(true).setStyleAttributes({"margin": "5px 20px 20px 20px", "border": "1px solid rgb(233,233,233)", "padding": "10px"});
      abstract.setVisible(false);
      
      var clear = app.createHTML("");
      clear.setStyleAttribute("clear", "both");
     
      var handler = app.createClientHandler().forTargets(abstract).setVisible(true).forTargets(button2).setVisible(true).forTargets(button).setVisible(false);
      button.addClickHandler(handler);
           
      var handler2 = app.createClientHandler().forTargets(abstract).setVisible(false).forTargets(button2).setVisible(false).forTargets(button).setVisible(true);
      button2.addClickHandler(handler2);
      
      var hPanel = app.createHorizontalPanel();
      hPanel.add(chbox).add(button).add(button2);
      panel.add(hPanel).add(abstract).add(clear);
    }
    
    var candidateNames = [];
    for(var candidate in specialCandidates){
      candidateNames.push(candidate);
      var prefix = "";
      if (specialCandidates[candidate]["PaperId"].indexOf("case") == 0)
        prefix = "[Case Study] ";
      else if (specialCandidates[candidate]["PaperId"].indexOf("sig") == 0)
        prefix = "[SIG] ";
      else if (specialCandidates[candidate]["PaperId"].indexOf("crs") == 0)
        prefix = "[Course] ";
      else if (specialCandidates[candidate]["PaperId"].indexOf("pan") == 0)
        prefix = "[Panel] ";
      
      var chbox = app.createCheckBox(prefix + specialCandidates[candidate]["Paper Title"]).setFormValue(specialCandidates[candidate]["PaperId"]).setName("interested" + specialCandidates[candidate]["PaperId"]);   
      
      chbox.setStyleAttribute('float', 'left');
      chbox.setStyleAttribute('margin-right', '10px');
      
      var button = app.createLabel("[abstract]");
      button.setStyleAttributes({'text-decoration':'underline', 'color':'#2A5DB0'});
      
      var button2 = app.createLabel("[abstract]");
      button2.setStyleAttributes({'text-decoration':'underline', 'color':'#2A5DB0'});
      button2.setVisible(false);
      
      var abstract =  app.createLabel(specialCandidates[candidate]["Abstract"]).setWidth("40em").setWordWrap(true).setStyleAttributes({"margin": "20px", "border": "1px solid rgb(233,233,233)", "padding": "10px"});
      abstract.setVisible(false);
      
      var clear = app.createHTML("");
      clear.setStyleAttribute("clear", "both");
     
      var handler = app.createClientHandler().forTargets(abstract).setVisible(true).forTargets(button2).setVisible(true).forTargets(button).setVisible(false);
      button.addClickHandler(handler);
           
      var handler2 = app.createClientHandler().forTargets(abstract).setVisible(false).forTargets(button2).setVisible(false).forTargets(button).setVisible(true);
      button2.addClickHandler(handler2);
           
      var hPanel = app.createHorizontalPanel();
      hPanel.add(chbox).add(button).add(button2);
      panel.add(hPanel).add(abstract).add(clear);
    }

    if (isTop10)
      panel.add(app.createHidden('candidatesSpecial', candidateNames.join()).setId('candidatesSpecial'));
    else
      panel.add(app.createHidden('candidatesSpecial20', candidateNames.join()).setId('candidatesSpecial20'));
  
    panel.add(app.createHTML("<br/>"));  
    flow.add(panel);
    return panel;
}

function moreClickHandler1(e){
  Logger.log("sHandler1");
  var app = UiApp.getActiveApplication();
  var hidden = app.getElementById('moreClicked1').setValue("TRUE");

  app.close();
  return app;  
}

function moreClickHandler2(e){
  Logger.log("sHandler2");
  var app = UiApp.getActiveApplication();
  var hidden = app.getElementById('moreClicked2').setValue("TRUE");

  app.close();
  return app;  
}


function doGet(e) {
  var paperHash = readDataByPaperId();  
  var app  = UiApp.createApplication();
  
  var form = app.createFormPanel();
  var flow = app.createFlowPanel();
  form.setStyleAttribute("margin", "60px");

  // Record start time
  var now = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  var startTimeHidden = app.createHidden('startTime', now).setId('startTime');
  flow.add(startTimeHidden);
  
  //Logger.log(paperHash);
  var paperId = e.parameter.paperId;
  //Logger.log(paperId);
  var nameBox;
  
  if(paperId in paperHash && (paperId.indexOf("cscw")==0)){
    var paper = paperHash[paperId];    
    //Logger.log(paper);
    
    var authors = paper['Authors'].split(",");
    
    var paperTitleHTML = app.createHTML('Your Paper: <strong>' + paperHash[paperId]['Paper Title'] + '</strong>').setId('inviteLabel');
    paperTitleHTML.setStyleAttributes({'font-size': '1.2em'});
    flow.add(paperTitleHTML);
    flow.add(app.createHTML("<br/>"));

    nameBox = displayName(app, flow, e.parameter.paperId);
    var candidates = getCandidates(paperHash, paper, true);  
    var specialCandidates = getSpecialCandidates(paperHash, paper, true);
 
    // Show Preference Questions
    displayPreferences(app, flow, candidates, true);    
    
    // showing 10 more papers. 11-20
    var candidates2 = getCandidates(paperHash, paper, false);
    var specialCandidates2 = getSpecialCandidates(paperHash, paper, false);    
    var panel1 = displayPreferences(app, flow, candidates2, false); 
    
    var moreButton1 = app.createButton("Show me some more").setId("moreButton1");
    moreButton1.setStyleAttributes({"width":"250px", "height": "30px"});
    flow.add(moreButton1);
    flow.add(app.createHTML("<br/>"));
    var moreClickedHidden1 = app.createHidden('moreClicked1', "FALSE").setId('moreClicked1');
    flow.add(moreClickedHidden1);
    var chandler1 = app.createClientHandler().forEventSource().setVisible(false).forTargets(panel1).setVisible(true);
    var shandler1 = app.createServerHandler('moreClickHandler1');
    moreButton1.addClickHandler(chandler1);
    moreButton1.addClickHandler(shandler1);
    
    flow.add(app.createHTML("<br/><br/>")); 
    // Show Interest Questions
    displayInterests(app, flow, candidates, specialCandidates, true);
    var panel2 = displayInterests(app, flow, candidates2, specialCandidates2, false);  
    
    var moreButton2 = app.createButton("Show me some more").setId("moreButton2");
    moreButton2.setStyleAttributes({"width":"250px", "height": "30px"});    
    flow.add(moreButton2);
    flow.add(app.createHTML("<br/>"));
    var moreClickedHidden2 = app.createHidden('moreClicked2', "FALSE").setId('moreClicked2');
    flow.add(moreClickedHidden2);
    var chandler2 = app.createClientHandler().forEventSource().setVisible(false).forTargets(panel2).setVisible(true);
    var shandler2 = app.createServerHandler('moreClickHandler2');
    moreButton2.addClickHandler(chandler2);
    moreButton2.addClickHandler(shandler2);    
    flow.add(app.createHTML("<br/><br/>")); 

    var commentsInstruction = app.createHTML('(optional) <strong>Please feel free to share any comments with us:</strong>').setId('inviteLabel');
    commentsInstruction.setStyleAttributes({'font-size': '1.1em'});
    var commentsBox = app.createTextArea().setId('comments').setName('comments').setWidth("450px").setHeight("90px");
//    commentsBox.setStyleAttributes({'font-size': '1.2em'});
    flow.add(commentsInstruction).add(commentsBox);
    flow.add(app.createHTML("<br/>"));

    
    //var submitHandler = app.createServerHandler("validator").addCallbackElement(nameBox);  
    var submitButton = app.createSubmitButton("Submit");
    submitButton.setStyleAttributes({"width":"200px", "height":"36px", "font-size":"1.2em"});
    flow.add(submitButton);
    flow.add(app.createHTML("<br/><br/>"));
    
    var thankyou = app.createHTML("If you encounter a problem, please email <strong>juhokim@mit.edu</strong>");
    //thankyou.setStyleAttributes({"margin": "40px", "width": "40em", "border": "1px solid rgb(233,233,233)", "padding": "10px", "font-size": "1.2em"});
    flow.add(thankyou);
    flow.add(app.createHTML("<br/><br/><br/><br/><br/>"));
    
    //.addSubmitHandler(submitHandler);
  } else { // Invalid URL
    var thankyou = app.createHTML("Sorry, something went wrong. Did you get the right link? <br><br>Try reloading the page. If the problem persists, please email <strong>juhokim@mit.edu</strong>");
    thankyou.setStyleAttributes({"margin": "40px", "width": "40em", "border": "1px solid rgb(233,233,233)", "padding": "10px", "font-size": "1.2em"});
    flow.add(thankyou);
  }
  
  form.add(flow);    
  app.add(form);

  return app;
}

function validator(e) {
  var app = UiApp.getActiveApplication();
  // the type of event, in this case "submit".
  var eventType = e.parameter.eventType;
  // the id of the widget that fired this event.
  var source = e.parameter.source;
  
  if(e.parameter.personName == ""){
    app.getElementById('personName').setText("*Name is required").setStyleAttribute("color", "#F00");
    //flag = 1;
  }
  
  return app;
}

function show_label(e) {
  Logger.log("clicked on hidden");
  var app = UiApp.getActiveApplication();
  label = app.getElementById("label_caption");
  label.setVisible(true);
}

function getCandidates(paperHash, paper, isTop10){
  var maxCandidates = 10;
  var candidateHash = {};
  var candidates = [];

  if(isTop10 && typeof paper['Top10rand'] !== "undefined")
    candidates = paper['Top10rand'].split(",");
  if(!isTop10 && typeof paper['Top20rand'] !== "undefined")  
    candidates = paper['Top20rand'].split(",");

  var numCandidates = 0;
  for(var i = 0; i < candidates.length; i++){
    
    if(!(candidates[i] in candidateHash) && candidates[i] in paperHash && candidates[i] != paper['PaperId']){
     candidateHash[candidates[i]] = paperHash[candidates[i]]; 
      numCandidates+=1;
      if(numCandidates >= maxCandidates){
       break; 
      }
    }
  }
  return candidateHash;
}

// Top TF-IDF picks for non-paper submissions
function getSpecialCandidates(paperHash, paper, isTop10){
  var maxCandidates = 3;
  var candidateHash = {};
  var candidates = [];

  if(typeof paper['TFIDF Specials'] === "undefined" || paper['TFIDF Specials'] == "" || paper['TFIDF Specials'] == " ")
    return;
  
  candidates = paper['TFIDF Specials'].split(",");
  Logger.log(candidates);
  
  var numCandidates = 0;
  var startIndex = isTop10? 0: 3;
  for(var i = startIndex; i < candidates.length; i++){
    if(!(candidates[i] in candidateHash) && candidates[i] in paperHash && candidates[i] != paper['PaperId']){
    
      candidateHash[candidates[i]] = paperHash[candidates[i]]; 
      numCandidates+=1;
      if(numCandidates >= maxCandidates){
       break; 
      }
    }
  }
  return candidateHash;
}

function readDataByPaperId(){
  var paperHash = {};
  var data = readRows("PaperData");
  
  for(var i = 1; i <= data.numRows -1; i++){
    var row = data.values[i];
    var rowHash = {};
    var numCols = row.length;
    for(var j = 0; j <= numCols; j++){
      if(data.values[0][j] != ""){
    //    Logger.log(data.values[0][j]);
        rowHash[data.values[0][j]] = row[j];
      }
    }
    paperHash[row[0]] = rowHash;
  }
 return paperHash; 
}

/**
 * Retrieves all the rows in the active spreadsheet that contain data and logs the
 * values for each row.
 * For more information on using the Spreadsheet API, see
 * https://developers.google.com/apps-script/service_spreadsheet
 */
function readRows(sn) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sn);
  var rows = sheet.getDataRange();
  var numRows = rows.getNumRows();
  var values = rows.getValues();

  
  return {numRows: numRows, values: values}; 
//  for (var i = 0; i <= numRows - 1; i++) {
//    var row = values[i];
 //   Logger.log(row);
  
};

/**
 * Adds a custom menu to the active spreadsheet, containing a single menu item
 * for invoking the readRows() function specified above.
 * The onOpen() function, when defined, is automatically invoked whenever the
 * spreadsheet is opened.
 * For more information on using the Spreadsheet API, see
 * https://developers.google.com/apps-script/service_spreadsheet
 */
function onOpen() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name : "Read Data",
    functionName : "readRows"
  }];
  sheet.addMenu("Script Center Menu", entries);
};
