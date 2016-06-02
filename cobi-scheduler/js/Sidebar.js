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

var Sidebar = function() {
     // Initialize the sidebar with a default view 
     function initialize(){
          displayConstraints();
          displayPreferences();
          displayViewOptions();
          displaySessionTypes(); 
          displayPersonas();  
          displayCommunities();
          displayHistory();
          bindEvents();

          addCount();

          // by default, open conflicts and history
          $(".toggle-options").first().trigger("click");
          $(".toggle-options").last().trigger("click");
     }


     // Add event handlers to each sidebar item
     function bindEvents(){
          $("#list-constraints").on("click", "li.constraint-entry a", clickConstraintsHandler); 
          $("#list-constraints").on("click", ".sublist-header a", clickConstraintHeaderHandler);         
          $("#list-preferences").on("click", "li a", clickPreferencesHandler);
          $("#list-view-options").on("click", "li a", clickViewOptionsHandler);
          $("#list-session-types").on("click", "li a", clickSessionTypesHandler);
          $("#list-session-types").on("click", ".myCheckbox", clickCheckboxSessionTypesHandler);           
          $("#list-personas").on("click", "li a", clickPersonasHandler);
          $("#list-personas").on("click", ".myCheckbox", clickCheckboxPersonasHandler); 
          $("#list-communities").on("click", "li a", clickCommunitiesHandler);
          $("#list-communities").on("click", ".myCheckbox", clickCheckboxCommunitiesHandler);          
          $(".sidebar-fixed").on("click", ".toggle", clickToggle);
          $(".sidebar-fixed").on("click", ".toggle-options", clickHeaderHandler);

          // $(document).on("addHistory", addHistoryHandler);
          // $(document).on("updateHistoryAccepted", updateHistoryHandler);
          // $(document).on("updateHistoryFailed", updateHistoryHandler);
     }


     // Display counts for each community and persona
     function addCount(){
          var sessionTypeCount = {};
          var personaCount = {};
          var communityCount = {};
          $.each(sessionTypeList, function(index, item){
               sessionTypeCount[item] = 0;
          });

          $.each(personaList, function(index, item){
               personaCount[item] = 0;
          });
          $.each(communityList, function(index, item){
               communityCount[item] = 0;
          });

          // get count
          $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
               var id = $(item).attr("id").substr(8);
               var session = allSessions[id];    
               $.each(sessionTypeList, function(index, key){
                    if (session.venue != "" && key.indexOf(session.venue) != -1)
                         sessionTypeCount[key]++;
               });               
               $.each(personaList, function(index, key){
                    if (session.personas != "" && key.indexOf(session.personas) != -1)
                         personaCount[key]++;
               });
               $.each(session.coreCommunities, function(index, key){
                    communityCount[key]++;
               });
          });  

          $("#list-session-types li").each(function(){
               var type = $(this).attr("data-type");
               if (typeof sessionTypeCount[type] != "undefined")
                    $(this).find(".count").html(sessionTypeCount[type]);                
          });
          $("#list-personas li").each(function(){
               var type = $(this).attr("data-type");
               if (typeof personaCount[type] != "undefined")
                    $(this).find(".count").html(personaCount[type]);                
          });
          $("#list-communities li").each(function(index, key){
               var type = $(this).attr("data-type");
               if (typeof communityCount[type] != "undefined")
                    $(this).find(".count").html(communityCount[type]);                
          });          
     }


/******************************
 * History Display
 ******************************/

     function addHistory(t){
          // console.log("HISTORY", t);
          // hack that fixes the bug where when history is open with 0 items, prepend doesn't work because height is automatically set to 0px.
          // so force height to be auto when collapsed
          if ($("#list-history").hasClass("in"))
               $("#list-history").css("height", "auto");
          
        if (isTransactionSessionLevel(t))
            displaySessionHistory(t);
        else if (isTransactionPaperLevel(t))
            displayPaperHistory(t);
        else if (isTransactionChairLevel(t))
            displayChairHistory(t);
        else
            console.log("addStatus error");

          var count = $("#history-count").html();
          $("#history-count").html(parseInt(count)+1);
     }

     function updateHistory(type, t){
          // find the matching localHash
          var $item;
          $("#list-history li").each(function(index, item){
               // console.log($(item).attr("data-local-hash"), t.localHash);
               if (typeof $(item).attr("data-local-hash") !== "undefined" && $(item).attr("data-local-hash") == t.localHash){
                    $item = $(item);
               }
          });
          
          if (typeof $item !== "undefined"){
               if (type == "updateHistoryAccepted")
                    $item.find(".status").removeClass("icon-exclamation-sign").addClass("icon-ok");
               else if (type == "updateHistoryFailed")
                    $item.find(".status").removeClass("icon-exclamation-sign").addClass("icon-remove");
          }
     }

     function displaySessionHistory(t){
          var $link, $link2, $li;
          var $statusLabel = isTransactionMyChange(t) ? $("<span/>").addClass("status icon-exclamation-sign") : $("<span/>").addClass("status icon-ok");
          var user = isTransactionMyChange(t) ? "You" : getUsernameByUID(t.uid);
          $li = $("<li/>").attr("data-local-hash", t.localHash).append($statusLabel).append(user + " ").append($("<strong/>").wrapInner(typeDisplayList[t.type])).append(": ");
          
          if (t.type.indexOf("swap") !== -1){
               $link = getCellLinkByID(t.data.s1id);
               $link2 = getCellLinkByID(t.data.s2id);
               $li = $li.append($link).append(" and ").append($link2);    
          } else if (t.type == "unschedule") {
               $link = getCellLinkByID(t.data.id);
               $link2 = getCellLinkByDateTimeRoom(t.data.date, t.data.time, t.data.room);
               $li = $li.append($link).append(" from ").append($link2);  
          } else if (t.type == "move") {
               $link = getCellLinkByID(t.data.id);
               $link2 = getCellLinkByDateTimeRoom(t.data.sdate, t.data.stime, t.data.sroom);
               $li = $li.append($link).append(" from ").append($link2);  
          } else {
               $link = (typeof t.data.id === "undefined") ? getCellLinkByDateTimeRoom(t.data.date, t.data.time, t.data.room) : getCellLinkByID(t.data.id);
               $li = $li.append($link);
          }

          $("#list-history").prepend($li);
     }

     function displayPaperHistory(t){
          var $link, $link2, $li;
          var $statusLabel = isTransactionMyChange(t) ? $("<span/>").addClass("status icon-exclamation-sign") : $("<span/>").addClass("status icon-ok");
          var user = isTransactionMyChange(t) ? "You" : getUsernameByUID(t.uid);
          $li = $("<li/>").attr("data-local-hash", t.localHash).append($statusLabel).append(user + " ").append($("<strong/>").wrapInner(typeDisplayList[t.type])).append(": ");

          if (t.type == "swapPapers"){
               $link = getPaperCellLinkByID(t.data.s1id, t.data.p2id);
               $link2 = getPaperCellLinkByID(t.data.s2id, t.data.p1id);
               $li = $li.append($link).append(" and ").append($link2); 
          } else if (t.type == "swapWithUnscheduledPaper"){
               $link = getPaperCellLinkByID(undefined, t.data.p2id);
               $link2 = getPaperCellLinkByID(t.data.s2id, t.data.p1id);
               $li = $li.append($link).append(" and ").append($link2); 
          } else if (t.type == "unschedulePaper") {
               $link = getPaperCellLinkByID(undefined, t.data.pid);
               $link2 = getCellLinkByID(t.data.sid);
               $li = $li.append($link).append(" from ").append($link2); 
          } else if (t.type == "schedulePaper") {
               $link = getPaperCellLinkByID(t.data.sid, t.data.pid);
               $li = $li.append($link);
          } else if (t.type == "movePaper") {
               $link = getPaperCellLinkByID(t.data.s2id, t.data.p1id);
               $link2 = getCellLinkByID(t.data.s1id);
               $li = $li.append($link).append(" from ").append($link2); 
          } else if (t.type == "reorderPapers") {
               $link = getPaperCellLinkByID(t.data.id, "");
               $li = $li.append($link);
          }
          $("#list-history").prepend($li);
     }

     function displayChairHistory(t){
          var $link, $link2, $li;
          var $statusLabel = isTransactionMyChange(t) ? $("<span/>").addClass("status icon-exclamation-sign") : $("<span/>").addClass("status icon-ok");
          var user = isTransactionMyChange(t) ? "You" : getUsernameByUID(t.uid);
          $li = $("<li/>").attr("data-local-hash", t.localHash).append($statusLabel).append(user + " ").append($("<strong/>").wrapInner(typeDisplayList[t.type])).append(": ");

          if (t.type == "swapChair"){
               $link = getChairCellLinkByID(t.data.s1id, t.data.chair2Id);
               $link2 = getChairCellLinkByID(t.data.s2id, t.data.chair1Id);
               $li = $li.append($link).append(" and ").append($link2); 
          } else if (t.type == "swapWithUnscheduledChair"){
               $link = getChairCellLinkByID(undefined, t.data.chair1Id);
               $link2 = getChairCellLinkByID(t.data.s1id, t.data.chair2Id);
               $li = $li.append($link).append(" and ").append($link2); 
          } else if (t.type == "unscheduleChair") {
               $link = getChairCellLinkByID(undefined, t.data.chairId);
               $link2 = getCellLinkByID(t.data.id);
               $li = $li.append($link).append(" from ").append($link2); 
          } else if (t.type == "scheduleChair") {
               $link = getChairCellLinkByID(t.data.id, t.data.chairId);
               $li = $li.append($link);
          } else if (t.type == "moveChair") {
               $link = getChairCellLinkByID(t.data.s2id, t.data.chairId);
               $link2 = getCellLinkByID(t.data.s1id);
               $li = $li.append($link).append(" from ").append($link2); 
          } 

          $("#list-history").prepend($li);
     }


     // Return any active options for a given sidebar menu
     // Menu: constraints / view-options / personas
     function getActiveOptions(menu){
          var options = [];
          if ($("#list-" + menu + " .view-option-active").length === 0) 
               return;
          else {
               $("#list-" + menu + " .view-option-active").each(function(){
                    options.push($(this).attr("data-type"));
               });
          }
          return options;
     }

     // function _resetSidebarSelections(){
     //      _toggleAllCheckboxes($("#list-session-types"), false);
     //      _toggleAllCheckboxes($("#list-personas"), false);
     //      _toggleAllCheckboxes($("#list-communities"), false);
     //      $(".slot.cell-session-type").removeClass("cell-session-type");
     //      $(".slot.cell-persona").removeClass("cell-persona");
     //      $(".slot.cell-community").removeClass("cell-community");          
     // }

     function _toggleAllConflicts(toggle){
          $("#list-constraints li.constraint-entry").each(function(index, constraint){
               Conflicts.updateConstraintBackground($(constraint).attr("data-type"), toggle);         
          });          
     }

     function _toggleAllPreferences(toggle){
          $("#list-preferences li.preference-entry").each(function(index, preference){
               Conflicts.updatePreferenceBackground($(preference).attr("data-type"), toggle);         
          });          
     }

/******************************
 * Click Handlers
 ******************************/

      function clickHeaderHandler(){
          //console.log("here", $(this).find("span.toggle-icon"));
          if ($(this).find("span.toggle-icon").hasClass("icon-chevron-right"))
               $(this).find("span.toggle-icon").removeClass("icon-chevron-right").addClass("icon-chevron-down");
          else
               $(this).find("span.toggle-icon").removeClass("icon-chevron-down").addClass("icon-chevron-right");
     }

     function clickToggle(){
          $("#list-" + $(this).attr("id").substring(7)).toggle();
          var text = $(this).text() == "show" ? "hide" : "show";
          $(this).text(text);
     }

     // Turn or off all sub constraint under this header
     function clickConstraintHeaderHandler(){
          var $this = $(this);
          var toggle = true;
          // _resetSidebarSelections();
          _toggleAllCheckboxes($("#list-preferences"), false);
          _toggleAllCheckboxes($("#list-session-types"), false);
          _toggleAllCheckboxes($("#list-personas"), false);
          _toggleAllCheckboxes($("#list-communities"), false);
          // $(".slot.cell-preference").removeClass("cell-preference");
          $(".slot.cell-session-type").removeClass("cell-session-type");
          $(".slot.cell-persona").removeClass("cell-persona");
          $(".slot.cell-community").removeClass("cell-community");  
          _toggleAllPreferences(false); 
          
          // Turn off everything
          if ($(this).parent().hasClass("view-option-active"))
              toggle = false;
          $("#list-constraints .view-option-active").removeClass("view-option-active");
          // Turn on everything within my group
          if (toggle) {
              $(this).parent().addClass("view-option-active");
              var mySeverityListID = $(this).parent().attr("data-severity") + "-severity-constraints";
              $("#" + mySeverityListID + " li.constraint-entry").addClass("view-option-active");
          }

          $("#list-constraints li.constraint-entry").each(function(index, item){
               // var type = $(constraint).attr("data-type");
               // // console.log(type, $this.parent().attr("data-type"), toggle);
               // if (type == $this.parent().attr("data-type"))
               //     Conflicts.updateConstraintBackground(type, toggle);     
               // else
               //     Conflicts.updateConstraintBackground(type, false);   

               if ($(item).hasClass("view-option-active"))
                   Conflicts.updateConstraintBackground($(item).attr("data-type"), true);
               else
                   Conflicts.updateConstraintBackground($(item).attr("data-type"), false);  
          });          
         return false;     
     }

     function clickConstraintsHandler(){
          var $this = $(this);
          var toggle = true;
          // _resetSidebarSelections();
          _toggleAllCheckboxes($("#list-preferences"), false);
          _toggleAllCheckboxes($("#list-session-types"), false);
          _toggleAllCheckboxes($("#list-personas"), false);
          _toggleAllCheckboxes($("#list-communities"), false);
          // $(".slot.cell-preference").removeClass("cell-preference");
          $(".slot.cell-session-type").removeClass("cell-session-type");
          $(".slot.cell-persona").removeClass("cell-persona");
          $(".slot.cell-community").removeClass("cell-community");   
          _toggleAllPreferences(false);
          
          // turn off everything not in the same severity
          var mySeverity = "";
          var myType = $(this).parent().attr("data-type");
          $.each(Conflicts.constraintsList, function(index, item){
               // console.log(item.type, myType);
               if (item.type == myType)
                    mySeverity = item.severity; 
          }); 
          var mySeverityListID = mySeverity + "-severity-constraints";
          // console.log("#list-constraints :not(#" + mySeverityListID + ") .view-option-active");
          $("#list-constraints :not(#" + mySeverityListID + ") .view-option-active").removeClass("view-option-active");

          // toggle
          if ($this.parent().hasClass("view-option-active")) {
               $this.parent().removeClass("view-option-active");
               toggle = false;
          } else {
               $this.parent().addClass("view-option-active");
          }

          // if ($(this).parent().hasClass("view-option-active")){
               
          // }
          // $("#list-constraints .view-option-active").removeClass("view-option-active");
          // if (toggle)
          //     $(this).parent().addClass("view-option-active");

          $("#list-constraints li.constraint-entry").each(function(index, item){
               // var type = $(constraint).attr("data-type");
               // // console.log(type, $this.parent().attr("data-type"), toggle);
               // if (type == $this.parent().attr("data-type"))
               //     Conflicts.updateConstraintBackground(type, toggle);     
               // else
               //     Conflicts.updateConstraintBackground(type, false);   

               if ($(item).hasClass("view-option-active"))
                   Conflicts.updateConstraintBackground($(item).attr("data-type"), true);
               else
                   Conflicts.updateConstraintBackground($(item).attr("data-type"), false);  
          });
         return false;          
     }

     function clickPreferencesHandler(){
          var $this = $(this);
          var toggle = true;
          // _resetSidebarSelections();
          _toggleAllCheckboxes($("#list-constraints"), false);
          _toggleAllCheckboxes($("#list-session-types"), false);
          _toggleAllCheckboxes($("#list-personas"), false);
          _toggleAllCheckboxes($("#list-communities"), false);
          $(".slot.cell-session-type").removeClass("cell-session-type");
          $(".slot.cell-persona").removeClass("cell-persona");
          $(".slot.cell-community").removeClass("cell-community");   
          _toggleAllConflicts(false);

          // turn off everything not in the same severity
          // var mySeverity = "";
          // var myType = $(this).parent().attr("data-type");
          // $.each(Conflicts.preferencesList, function(index, item){
          //      if (item.type == myType)
          //           mySeverity = item.severity; 
          // }); 
          // var mySeverityListID = mySeverity + "-severity-constraints";
          // console.log("#list-constraints :not(#" + mySeverityListID + ") .view-option-active");
          // $("#list-constraints :not(#" + mySeverityListID + ") .view-option-active").removeClass("view-option-active");

          // toggle
          if ($this.parent().hasClass("view-option-active")) {
               $this.parent().removeClass("view-option-active");
               toggle = false;
          } else {
               $this.parent().addClass("view-option-active");
          }

          $("#list-preferences li.preference-entry").each(function(index, item){
               // var type = $(constraint).attr("data-type");
               // // console.log(type, $this.parent().attr("data-type"), toggle);
               // if (type == $this.parent().attr("data-type"))
               //     Conflicts.updateConstraintBackground(type, toggle);     
               // else
               //     Conflicts.updateConstraintBackground(type, false);   

               if ($(item).hasClass("view-option-active"))
                   Conflicts.updatePreferenceBackground($(item).attr("data-type"), true);
               else
                   Conflicts.updatePreferenceBackground($(item).attr("data-type"), false);  
          });
         return false;     
     }

     function clickViewOptionsHandler(){
          $("#list-view-options .view-option-active").removeClass("view-option-active");
          $(this).parent().addClass("view-option-active");
          switch($(this).parent().attr("data-type")){
               case "session-type":
                    $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
                         var id = $(item).attr("id").substr(8);
                         var session = allSessions[id];
                         $(item).find(".display").html(session.venue);
                    });
               break;
               case "conflicts":
                    if (MoveMode.isOn){
                         $(".slot:not('.unavailable')").each(function(index, item){
                              $(item).find(".display").html($(item).find(".conflicts").html());
                         });
                    } else
                         Conflicts.updateConflicts(true, true, "conflict");
               break;   
               case "preferences":
                    if (MoveMode.isOn){
                         $(".slot:not('.unavailable')").each(function(index, item){
                              $(item).find(".display").html($(item).find(".conflicts").html());
                         });
                    } else
                         Conflicts.updateConflicts(true, true, "preference");
               break;   
               case "chair-conflict":
                    if (MoveMode.isOn){
                         $(".slot:not('.unavailable')").each(function(index, item){
                              // TODO: filter using only chair conflicts
                              $(item).find(".display").html($(item).find(".conflicts").html());
                         });
                    } else
                         Conflicts.updateConflicts(true, true, "chair");
               break;   

               case "chair-name":
                    $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
                         var id = $(item).attr("id").substr(8);
                         var chair = allSessions[id].chairs;
                         var $chair = $("<span/>").addClass("chair");
                         if (chair == "")
                              $chair.addClass("chair-not-available").html("N/A");
                         else
                              $chair.addClass("chair-available").html(displayChairName(allChairs[chair], false));
                         $(item).find(".display").html($chair);                              
                    });
               break;                                              
               case "popularity":
                    $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
                         var id = $(item).attr("id").substr(8);
                         $(item).find(".display").html(sessionPopularity[id]);
                    });
               break;               
               case "num-papers":
                    $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
                         var id = $(item).attr("id").substr(8);
                         var session = allSessions[id];
                         $(item).find(".display").html(getSessionNumSubmissions(session.submissions));
                    });
               break;
               case "duration":
                    $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
                         var id = $(item).attr("id").substr(8);
                         var session = allSessions[id];
                         var duration = getSessionDuration(session);
                         var $duration = $("<span/>").addClass("duration").html(duration);
                         if (duration > 80)
                              $duration.addClass("duration-overtime");
                         else if (duration == 80)
                              $duration.addClass("duration-full");
                         else if (duration == 0)
                              $duration.addClass("duration-none");
                         else 
                              $duration.addClass("duration-undertime");

                         $(item).find(".display").html($duration);
			});
               break;
               case "awards":
                    $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
                         var id = $(item).attr("id").substr(8);
                         var session = allSessions[id];
                         if (session.hasAward)
                              $(item).find(".display").html("<img src='img/best-paper.png' class='icon'/>");
                         else
                              $(item).find(".display").html("");
                    });
                    // $(".slot-paper:not('.unavailable'):not('.empty')").each(function(index, item){
                    //      var id = $(item).attr("id");
                    //      var submission = allSubmissions[id];                         
                    //      if (submission.bestPaperAward)
                    //          $(item).find(".display").html("<img src='img/best-paper.png' class='icon'/>");
                    //      else
                    //          $(item).find(".display").html(""); 
                    // });                      
               break;
               case "honorable-mentions":
                    $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
                         var id = $(item).attr("id").substr(8);
                         var session = allSessions[id];                         
                         if (session.hasHonorableMention)
                             $(item).find(".display").html("<img src='img/nominee.png' class='icon'/>");
                         else
                             $(item).find(".display").html(""); 
                    });
                    // $(".slot-paper:not('.unavailable'):not('.empty')").each(function(index, item){
                    //      var id = $(item).attr("id");
                    //      var submission = allSubmissions[id];                         
                    //      if (submission.bestPaperNominee)
                    //          $(item).find(".display").html("<img src='img/nominee.png' class='icon'/>");
                    //      else
                    //          $(item).find(".display").html(""); 
                    // });                              
               break;
               case "persona":
                    $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
                         var id = $(item).attr("id").substr(8);
                         var session = allSessions[id];
                         $(item).find(".display").html(keys(session.personas).map(function(x) {return personaHash[x]}));
                    });
               break;
               default:
               break;
          }
          return false;     
     }
 

     function clickCheckboxSessionTypesHandler(){
          // console.log("click session types");
          $(this).parent().find("a").trigger("click");
     }
     
     function clickSessionTypesHandler(event){
          var $this = $(this);
          // _resetSidebarSelections();
          _toggleAllCheckboxes($("#list-constraints"), false);
          _toggleAllCheckboxes($("#list-preferences"), false);
          // _toggleAllCheckboxes($("#list-session-types"), false);
          _toggleAllCheckboxes($("#list-personas"), false);
          _toggleAllCheckboxes($("#list-communities"), false);
          // $(".slot.cell-preference").removeClass("cell-preference");
          // $(".slot.cell-session-type").removeClass("cell-session-type");
          $(".slot.cell-persona").removeClass("cell-persona");
          $(".slot.cell-community").removeClass("cell-community");   
          _toggleAllConflicts(false);
          _toggleAllPreferences(false);

          if ($this.parent().hasClass("view-option-active")) {
               $this.parent().removeClass("view-option-active");
               $this.parent().find(".myCheckbox").prop("checked", false);
          } else {
               $this.parent().addClass("view-option-active");
               $this.parent().find(".myCheckbox").prop("checked", true);
          }

          var className = "cell-session-type";
          
          // get current selections. allowing multiple selections. 
          var selections = [];
          $("#list-session-types li a").each(function(){
               if ($(this).parent().hasClass("view-option-active")) {
                    selections.push($(this).parent().attr("data-type"))
               }
          });

          $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
               if (isSpecialCell($(item)))
                    return;
               $(item).removeClass(className);
               var id = $(item).attr("id").substr(8);
               var session = allSessions[id];     
               if (selections.indexOf(session.venue) != -1){
                    $(item).addClass(className);
               }
          });
         return false;
     }

     function clickCheckboxPersonasHandler(){
          $(this).parent().find("a").trigger("click");
     }
     
     function clickPersonasHandler(event){
          var $this = $(this);
          _toggleAllCheckboxes($("#list-constraints"), false);
          _toggleAllCheckboxes($("#list-preferences"), false);
          _toggleAllCheckboxes($("#list-session-types"), false);
          // _toggleAllCheckboxes($("#list-personas"), false);
          _toggleAllCheckboxes($("#list-communities"), false);
          $(".slot.cell-preference").removeClass("cell-preference");
          $(".slot.cell-session-type").removeClass("cell-session-type");
          // $(".slot.cell-persona").removeClass("cell-persona");
          $(".slot.cell-community").removeClass("cell-community");   
          _toggleAllConflicts(false);        
          _toggleAllPreferences(false);

          if ($this.parent().hasClass("view-option-active")) {
               $this.parent().removeClass("view-option-active");
               $this.parent().find(".myCheckbox").prop("checked", false);
          } else {
               $this.parent().addClass("view-option-active");
               $this.parent().find(".myCheckbox").prop("checked", true);
          }
          
          var className = "cell-persona";

          // get current selections. allowing multiple selections. 
          var selections = [];
          $("#list-personas li a").each(function(){
               if ($(this).parent().hasClass("view-option-active")) {
                    selections.push($(this).parent().attr("data-type"))
               }
          });
          
          $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
               if (isSpecialCell($(item)))
                    return;
               $(item).removeClass(className);
               var id = $(item).attr("id").substr(8);
               var session = allSessions[id];     
	          if (selections.indexOf(session.personas) != -1){
                   $(item).addClass(className);
	          }
          });
         return false;
     }

     // Turn off all checkboxes in curList
     function _toggleAllCheckboxes($list, toggle){
          $list.find("li").removeClass("view-option-active");
          $list.find("li").find(".myCheckbox").prop("checked", toggle);
     }

     function clickCheckboxCommunitiesHandler(){
          $(this).parent().find("a").trigger("click");
     }
     
     function clickCommunitiesHandler(event){
          var $this = $(this);
          // _resetSidebarSelections();
          _toggleAllCheckboxes($("#list-constraints"), false);
          _toggleAllCheckboxes($("#list-preferences"), false);
          _toggleAllCheckboxes($("#list-session-types"), false);
          _toggleAllCheckboxes($("#list-personas"), false);
          // _toggleAllCheckboxes($("#list-communities"), false);
          $(".slot.cell-preference").removeClass("cell-preference");
          $(".slot.cell-session-type").removeClass("cell-session-type");
          $(".slot.cell-persona").removeClass("cell-persona");
          // $(".slot.cell-community").removeClass("cell-community");   
          
          _toggleAllConflicts(false);
          _toggleAllPreferences(false);

          if ($this.parent().hasClass("view-option-active")) {
               $this.parent().removeClass("view-option-active");
               $this.parent().find(".myCheckbox").prop("checked", false);
          } else {
               $this.parent().addClass("view-option-active");
               $this.parent().find(".myCheckbox").prop("checked", true);
          }

          var className = "cell-community";
          
          // get current selections. allowing multiple selections. 
          var selections = [];
          $("#list-communities li a").each(function(){
               if ($(this).parent().hasClass("view-option-active")) {
                    selections.push($(this).parent().attr("data-type"))
               }
          });
          
          $(".slot:not('.unavailable'):not('.empty')").each(function(index, item){
               if (isSpecialCell($(item)))
                    return;
               $(item).removeClass(className);
               var id = $(item).attr("id").substr(8);
               var session = allSessions[id];     
               $.each(session.coreCommunities, function(index, key){
                    if (selections.indexOf(key) != -1){
                         $(item).addClass(className);
                    }
               });
          });
         return false;
     }


/******************************
 * Default Displays
 ******************************/
     // Display the constraints list
	function displayConstraints(){
     	$.each(Conflicts.constraintsList, function(index, constraint){
     		var item = document.createElement("li");
     		$(item).attr("data-type", constraint.type)
                    .addClass("constraint-entry")
                    .html("<a href='#'><span class='palette'></span>" 
                    + constraint.description 
                    + "</a>"
                    + " (<span class='count'></span>)"
                    );
     		$("#list-constraints #" + constraint.severity + "-severity-constraints").append($(item));
     		$(item).find("span.palette").addClass("cell-conflict-" + constraint.severity);
      	});
	}

     // Display the preferences list
     function displayPreferences(){
          $.each(Conflicts.preferencesList, function(index, preference){
               var item = document.createElement("li");
               $(item).attr("data-type", preference.type)
                    .addClass("preference-entry")
                    .html("<a href='#'><span class='palette'></span>" 
                    + preference.description 
                    + "</a>"
                    + " (<span class='count'></span>)"
                    );
               $("#list-preferences").append($(item));
               $(item).find("span.palette").addClass("cell-preference");
          });
     }

     // Display the View options list
     function displayViewOptions(){
     	$.each(optionsList, function(index, option){
     		var item = document.createElement("li");
     		$(item).attr("data-type", option.id).html("<a href='#'>" + option.label + "</a>");
     		$("#list-view-options").append($(item));
      	});
      	$("#list-view-options li:first-child").addClass("view-option-active");

     }


     // Display the session types list
     function displaySessionTypes(){
          $.each(sessionTypeList, function(index, sessionType){
               var item = document.createElement("li");
               $(item).attr("data-type", sessionType).html("<input type='checkbox' class='myCheckbox'> <a href='#'>" 
                    + sessionType 
                    + " (<span class='count'></span>)"
                    + "</a>");
               $("#list-session-types").append($(item));              
          });
     }

     // Display the persona list
     function displayPersonas(){
     	$.each(personaList, function(index, persona){
     		var item = document.createElement("li");
      		$(item).attr("data-type", persona).html("<input type='checkbox' class='myCheckbox'> <a href='#'>" 
                    + persona 
                    + " (<span class='count'></span>)"
                    + "</a>");
     		$("#list-personas").append($(item));    		
     	});
     }

     // Display the communities list
     function displayCommunities(){
          $.each(communityList, function(index, community){
               var item = document.createElement("li");
               $(item).attr("data-type", community).html("<input type='checkbox' class='myCheckbox'> <a href='#'>" 
                    + community 
                    + " (<span class='count'></span>)"
                    + "</a>");
               $("#list-communities").append($(item));              
          });
     }

     function displayHistory(){
          $("#history-count").html(0);
     }

     return {
          initialize: initialize,
          getActiveOptions: getActiveOptions,
          addHistory: addHistory,
          updateHistory: updateHistory
     };
}();
