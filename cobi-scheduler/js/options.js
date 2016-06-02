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

    var Features = {
        chair: true
    }

    var sessionTypeList = ["paper", "casestudy", "panel", "course", "SIG", "altchi", "special", "bof", "unavailable"];

    var typeDisplayList = {
    	lock: "locked slot",
    	unlock: "unlocked slot",
    	unschedule: "unscheduled session",
    	schedule: "scheduled session",
    	swap: "swapped session",
    	move: "moved session",
    	swapWithUnscheduled: "swapped with unscheduled",
    	editSessionTitle: "edited session title",
    	reorderPapers: "reordered papers",
    	unschedulePaper: "unscheduled paper",
    	schedulePaper: "scheduled paper",
    	swapPapers: "swapped papers",
    	movePaper: "moved paper",
    	swapWithUnscheduledPaper: "swapped with unscheduled paper",
        unscheduleChair: "unscheduled chair",
        scheduleChair: "scheduled chair",
        swapChair: "swapped chairs",
        moveChair: "moved chair",
        swapWithUnscheduledChair: "swapped with unscheduled chair"        
    }

    var dateList = {
        "Saturday": 0,
        "Sunday": 1,
        "Monday": 2,
        "Tuesday": 3,
        "Wednesday": 4,
        "Thursday": 5,
        "Friday": 6
    };

    var timeList = {
        "9:00-10:20": 0, 
        "11:00-12:20": 1, 
        "14:00-15:20": 2, 
        "16:00-17:20": 3
    };

    var roomList = {
        "221/221M": {floor: "2", size: "", type: ""},
        "241": {floor: "2", size: "", type: ""},
        "242A": {floor: "2", size: "", type: ""},
        "242B": {floor: "2", size: "", type: ""},
        "243":  {floor: "2", size: "", type: ""},
        "251":  {floor: "2", size: "", type: ""},
        "252A": {floor: "2", size: "", type: ""},
        "252B": {floor: "2", size: "", type: ""},
        "253": {floor: "2", size: "", type: ""},
        "342A": {floor: "3", size: "", type: ""},
        "343": {floor: "3", size: "", type: ""},
        "351": {floor: "3", size: "", type: ""},
        "352AB": {floor: "3", size: "", type: ""},
        "361": {floor: "3", size: "", type: ""},
        "362/363": {floor: "3", size: "", type: ""},
        "Blue": {floor: "2", size: "", type: ""},
        "Bordeaux": {floor: "2", size: "", type: ""},
        "Havane": {floor: "2", size: "", type: ""}
    };

    var roomTypeList = ["Amphitheater", "Theater", "Classroom", "Conference"];
    var sessionTypeList = ["paper", "course", "special", "panel", "casestudy", "SIG", "bof", "altchi"];
    var submissionTypeList = ["paper", "TOCHI", "course", "panel", "casestudy", "SIG"];

    var submissionOrderList = ["first", "second (if exists)", "third (if exists)", "fourth (if exists)", "last"];
    var authorRoleList = ["presenter", "backup presenter"];

    var optionsList = [
    {"id": "conflicts", "label": "Conflict"}, 
    {"id": "preferences", "label": "Preference"}, 
    {"id": "chair-conflict", "label": "Session Chair Conflict"}, 
    {"id": "chair-name", "label": "Session Chair Names"}, 
    {"id": "session-type", "label": "Session Type"}, 
    //{"id": "popularity", "label": "Popularity"}, 
    {"id": "num-papers", "label": "Number of Papers"}, 
    {"id": "duration", "label": "Duration"}, 
    {"id": "awards", "label": "Best Paper"}, 
    {"id": "honorable-mentions", "label": "Honorable Mention"}
    /*{"id": "persona", "label": "Tracks"} */
    ];

var constraints_list = [
 {
     "id": "1",
     "description": "simultaneous sessions for an author",
     "importance": -10,
     "severity": "high",
     // "color": "#913A52", //#C76A61", //#8C489F", //#a55194",
     "type": "authorInTwoSessions" 
 },
 {
     "id": "2",
     "description": "simultaneous sessions for a persona",
     "importance": -4,
     "severity": "medium",     
     // "color": "#C77F77", //#FAB99A", //#ff9896",
     "type": "personaInTwoSessions"
 }   
];

// var communities_list = [
// {"label": "design", "color": "#9edae5"},
// {"label": "engineering", "color": "#9edae5"},
// {"label": "management", "color": "#9edae5"},
// {"label": "user experience", "color": "#9edae5"},
// {"label": "child-computer interaction", "color": "#9edae5"},
// {"label": "digital arts", "color": "#9edae5"},
// {"label": "games & entertainment", "color": "#9edae5"},
// {"label": "health", "color": "#9edae5"},
// {"label": "sustainability", "color": "#9edae5"},
// {"label": "HCI4D", "color": "#9edae5"}
// ];

/*
var personas_list = [
{"id": "uist", "label": "UIST", "color": "#443266"},
{"id": "social", "label": "Social", "color": "#C3C3E5"},
{"id": "design", "label": "Design", "color": "#F1F0FF"},
{"id": "game", "label": "Game", "color": "#8C489F"}, 
{"id": "ict4d", "label": "ICT4D", "color": "#008888"}
];
*/

// var color_palette_2 = ["#A69E86", "#F2D9BB"];

// var color_palette_1 = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", 
// "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", 
// "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", 
// "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"]



