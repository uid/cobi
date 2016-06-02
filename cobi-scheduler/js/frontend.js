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
require.config({
  paths: {
    "jquery": "https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min",
    "underscore": "vendor/underscore-min",
  }
});

require(["underscore", "jquery"], function(_, $) {
    //the jquery.alpha.js and jquery.beta.js plugins have been loaded.
    $(function() {
        console.log("jquery loaded");



    });
});

	function getRandomColor(){
		return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
	}

     // Getting html for session details with individual paper info
     function getSessionDetail(submissions){
     	var html = "<button class='btn btn-info button-propose-swap'>Propose Swaps</button>"
     		+ "  <button class='btn btn-danger button-unschedule'>Unschedule</button> "
     		+ " <ul>";
     	$.each(submissions, function(index, submission){
     		html += "<li class='submission'><strong>" + submission.type + "</strong>: " + submission.title + "</li>";
     	});
     	html += "</ul>";
     	return html;
     }

     function getSessionNumSubmissions(submissions){
     	var key, count = 0;
     	for (key in submissions){
     		count++;
     	}
     	return count;
     }

// HQ: added new durartion function
     function getSessionDuration(submissions){
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
	     }else if(submissions[key].type == "panel"){
		 count += 80;
	     }else if(submissions[key].type == "SIG"){
		 count += 80;
	     }else if(submissions[key].type == "course"){
		 count += 80;
	     }else if(submissions[key].type == "casestudy"){
		 count += 20;
	     }
	 }
	 return count;
     }


     function swapSessionCell(id1, id2){
     	var $org1 = $("#program #session-" + id1);
     	var $org2 = $("#program #session-" + id2);
     	var $session1 = $("#program #session-" + id1).clone();
     	var $session2 = $("#program #session-" + id2).clone();
     	
     	console.log($session1, $session2);
     	$session1.css("background-color", "white").effect("highlight", {color: "yellow"}, 10000);
     	$session2.css("background-color", "white").effect("highlight", {color: "yellow"}, 10000);
     	$org1.replaceWith($session2);
     	$org2.replaceWith($session1);

     }

     function getSessionCell(session){
			 var cell = document.createElement('td');
			 $(cell).addClass("cell slot").append("<div class='display'/>");
			 
			 if(session != ""){
			 	$(cell).attr("id", "session-" + session.id);
			 	$(cell).data("session-id", session.id);
			 	$(cell).data("title", session.title);
			 	$(cell).data("session-type", session.type);
			 	$(cell).data("num-papers", getSessionNumSubmissions(session.submissions));
			 	$(cell).data("awards", session.hasAward);
			 	$(cell).data("honorable-mentions", session.hasHonorableMention);
			 	$(cell).data("duration", getSessionDuration(session.submissions));
			 	$(cell).data("persona", keys(session.personas).map(function(x) {return personaHash[x]}));
			 	// getting a random persona for now
			 	//var persona = personas_list[Math.floor(Math.random()*personas_list.length)];
			 	//$(cell).data("persona", persona.id);

			 	// default view: session type
			    $(cell).find(".display").html(session.type);
			    
			    var detail = document.createElement("div");
			    $(detail).hide();	
			    $(detail).addClass("detail").html(getSessionDetail(session.submissions));
			    $(cell).append($(detail));
			 } else {
			 	$(cell).addClass("empty");
			 }
			 return cell;
     }

     function displayProgram(schedule){
		 var table = document.createElement('table');
		 
		 var orderedRooms = keys(allRooms).sort(function(a,b) { return allRooms[a] - allRooms[b];});
		 
		 var header = document.createElement('tr');
		 // leave one empty for 1st column
		 var firstcell = document.createElement('td');
		 var secondcell = document.createElement('td');
		 $(firstcell).text("Time");
		 $(secondcell).text("Conflicts");
		 $(header).append(firstcell);
		 $(header).append(secondcell);
		 for(var i = 0; i < orderedRooms.length; i++){
		     var cell = document.createElement('td');
		     $(cell).addClass("cell").append("<div class='display'>" + orderedRooms[i] + "</div>");
		     $(header).append(cell);
		 }
		 $("#program").append(header);

		 for(var i = 0; i < schedule.length; i++){
		     var row = document.createElement('tr');
		     var slot = document.createElement('td');
//		     var conflicts = document.createElement('td');
		     $(slot).append(schedule[i][1]); // schedule[i][0]: full date. schedule[i][1]: time
		     $(row).append(slot);

		     // getting a random violation for now

		     var conflicts = document.createElement('td');
		     $(conflicts).addClass("cell");

		     // TODO: make it scalable. avoid miopic hacks.
		     var conflicts_array = conflictsByTime[schedule[i][0]][schedule[i][1]].map(function(co) {return co.type});
		     
		     // for each constraint, count and add a modal dialog with descriptions
		     $.each(constraints_list, function(index, conflict){
		     	var filtered_array = conflicts_array.filter(function(x){return x==conflict.type});
		     	if (filtered_array.length > 0) {
		     		var $palette = $("<span class='palette'></span>").css("background-color", conflict.color);
		     		$(conflicts).append($palette).append(filtered_array.length);
		     		var palette_title = "Conflicts: " + conflict.label;
		     		var palette_content = conflictsByTime[schedule[i][0]][schedule[i][1]].map(function(co) {
		     			if (co.type == conflict.type)
		     				return "<li>"+co.description+"</li>";
		     		}).join("");
		     		$palette.popover({
			     		html:true,
			     		placement: "bottom",
			     		title:function(){
			     			return palette_title;
			     		},
			     		content:function(){
			     			return palette_content;
			     		}
			     	});
			     	$palette.popover();   		
		     	}
		     });
		     //var violation = constraints_list[Math.floor(Math.random()*constraints_list.length)];

		     $(row).append(conflicts);

		     for(var j = 2; j < schedule[i].length; j++){
		     	var cell = getSessionCell(schedule[i][j]);
				$(row).append(cell);
		     }
		 	$('#program').append(row);
		 }
     }


     $("body").on("click", ".popover .button-propose-swap", function(){
		var $session = $(".selected").first();
		var id = $session.attr("id").substr(8);
		var session = allSessions[id];
		//console.log(session.title);     	

		 var swapValues = proposeSwap(allSessions[id]);
 	     var sortedSwaps = keys(swapValues).sort(function(a, b) {return swapValues[b]- swapValues[a];});
 	     // return top 10 swaps

 	     var swapContent = "";
 	     for(var i = 0; i < 5; i++){
 	     	$("#program #session-" + sortedSwaps[i]).addClass("proposed-swap");
 		 	swapContent += "<li data-session-id='" + sortedSwaps[i] + "'>" + sortedSwaps[i] + " (" + allSessions[sortedSwaps[i]].title + "): " + swapValues[sortedSwaps[i]] + "</li>";
 	     }

 	     var html = '<div id="myModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'
		  + '<div class="modal-header">'
		  + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">Ă</button>'
		  + '  <h3 id="myModalLabel">' + "Swap suggestions for session " + id + ": " + session.title + '</h3>'
		  + '</div>'
		  + '<div class="modal-body">'
//		  + '  <p>' + swapContent + '</p>'
		  + '<p>Review highlighted swap suggestions and select one, or click Cancel to go back.</p>'
		  + '</div>'
		  + '<div class="modal-footer">'
		  + '  <button class="btn btn-primary" id="swap-review-button">Review</button>'
		  + '  <button class="btn" data-dismiss="modal" aria-hidden="true" id="swap-cancel-button">Cancel</button>'		  
		  + '</div>'
		+ '</div>';
		$session.append(html);
		$("#myModal").modal();
     });


     $("body").on("click", ".popover #swap-button", function(){
     	     	
     	var $source = $(".selected").first();
     	var dst_id = $(this).data("session-id");
     	$(".proposed-swap").popover("hide");
     	$("#list-history").append("<li>swapped: <strong>" + allSessions[$source.attr("id").substr(8)].title + "</strong> and <strong>" + allSessions[dst_id].title + "</strong></li>");
     	swapSchedule(allSessions[$source.attr("id").substr(8)], allSessions[dst_id]);
     	swapSessionCell($source.attr("id").substr(8), dst_id);
     	
     	//$(".selected").hide();
     	$(".selected").removeClass("selected");
     	$(".proposed-swap").removeClass("proposed-swap");     	
     });	

     $("#program").on("click", "#swap-cancel-button", function(){
     	$("#program .proposed-swap").removeClass("proposed-swap");
     });

     $("#program").on("click", "#swap-review-button", function(){
     	$("#myModal").modal("hide");
     	var $session = $(".selected").first();
     	$session.css("background-color", "yellow");
     	var id = $session.attr("id").substr(8);
		var session = allSessions[id];
     	$session.popover("hide");
     	$("#program .proposed-swap").popover({
     		html:true,
            placement: "bottom",
            trigger: "click",
     		title:function(){
     			return session.title;
     		},
     		content:function(){
     			return "<button class='btn btn-primary' id='swap-button' data-session-id='" + session.id +"'>Swap with this session</button>";
     		}
     	});
     	//$(this).popover();
     });

     $("body").on("click", ".popover .button-unschedule", function(){
     	var $session = $(".selected").first();
     	var id = $session.attr("id").substr(8);
		var session = allSessions[id];
     	$("#list-history").append("<li>unscheduled: " + session.title + "</li>");

     	//var $cloned_session = $session.clone();
     	var $cloned_session = $session.clone(true, true);
     	//$cloned_session = $.extend({}, $cloned_session)
     	// not using clone(true) because it copies the events as well. Manually copy data
     	$session.removeClass("selected").popover("hide").addClass("empty").html("");
     	$cloned_session.removeClass("selected");
     	$("#unscheduled").append($cloned_session);

     });

     // Event handler for clicking an individual session
     $("#unscheduled").on("click", ".slot", function(){
     	// detect if the currently selected item is selected again.
     	var $selection = $("#unscheduled .selected");
     	var isSelected = $selection[0] == $(this)[0];
     	$selection.removeClass("selected").popover("hide");

     	// if reselected, do nothing.
     	if (isSelected)
     		return;
     	var id = $(this).attr("id").substr(8);
		var session = allSessions[id];
     	$(this).addClass("selected");
     	$(this).popover({
     		html:true,
     		title:function(){
     			return session.title;
     		},
     		content:function(){
     			return $(this).find(".detail").html();
     		}
     	});
     	$(this).popover("show");
     	
     });

     // Event handler for clicking an individual session
     $("#program").on("click", ".slot", function(){
     	// detect if the currently selected item is selected again.
     	var $selection = $("#program .selected");
     	var isSelected = $selection[0] == $(this)[0];
     	$selection.removeClass("selected").popover("hide");

     	// if reselected, do nothing.
     	if (isSelected)
     		return;
     	var id = $(this).attr("id").substr(8);
		var session = allSessions[id];
     	$(this).addClass("selected");
     	$(this).popover({
     		html:true,
            placement: "bottom",
            trigger: "manual",
     		title:function(){
     			return session.title;
     		},
     		content:function(){
     			return $(this).find(".detail").html();
     		}
     	});
     	$(this).popover("show");
     });
/*
     // Event handler for mouse hovering an individual session
     $("#program").on("mouseenter", ".slot", function(){
     	// ignore if the current item is "selected"
     	console.log($(this).hasClass("selected"));
     	if ($(this).hasClass("selected") || $("#program .selected").length != 0 || $(this).hasClass("empty"))
     		return;
          // detect if the currently selected item is selected again.
          //var $selection = $("#program .selected");
          //var isSelected = $selection[0] == $(this)[0];
          //$selection.removeClass("selected").popover("hide");

          // if reselected, do nothing.
          //if (isSelected)
          //     return;
        else{
          //$(this).addClass("hovered");
          $(this).popover({
               html:true,
               placement: "bottom",
               trigger: "hover",
               title:function(){
                    return $(this).data("title");
               },
               content:function(){
                    return $(this).find(".detail").html();
               }
          });
          $(this).popover("show");
        }
     });

     // Event handler for mouse hovering an individual session
     $("#program").on("mouseleave", ".slot", function(){
     	// ignore if the current item is "selected"
     	//console.log($(this).hasClass("selected"));
     	if ($(this).hasClass("selected"))
     		return;
     	else
        	$(this).popover("hide");        
     });
*/
     // Upon selecting a view option, change the view
     $("#list-view-options").on("click", "li a", function(){
     	$("#list-view-options .view-option-active").removeClass("view-option-active");
     	$(this).parent().addClass("view-option-active");
     	switch($(this).parent().data("type")){
     		case "session-type":
     			$(".slot:not('.empty')").each(function(index, item){
     				var id = $(item).attr("id").substr(8);
					var session = allSessions[id];
//     				$(item).find(".display").html($(item).data("session-type"));
					$(item).find(".display").html(session.type);
     			});
     		break;
     		case "num-papers":
     			$(".slot:not('.empty')").each(function(index, item){
     				var id = $(item).attr("id").substr(8);
					var session = allSessions[id];
     				//$(item).find(".display").html($(item).data("num-papers"));
     				$(item).find(".display").html(getSessionNumSubmissions(session.submissions));
     			});
     		break;
     		case "duration":
     			$(".slot:not('.empty')").each(function(index, item){
     				$(item).find(".display").html(getSessionDuration(session.submissions);
     			});
     		break;
     		case "awards":
     			$(".slot:not('.empty')").each(function(index, item){
     				//if ($(item).data("awards")){
     				var id = $(item).attr("id").substr(8);
					var session = allSessions[id];
     				if (session.hasAward)
     					$(item).find(".display").html("Y");
     				else
     					$(item).find(".display").html("N");
     			});
     		break;
     		case "honorable-mentions":
     			$(".slot:not('.empty')").each(function(index, item){
     				//if ($(item).data("honorable-mentions"))
     				var id = $(item).attr("id").substr(8);
					var session = allSessions[id];     				
     				if (session.hasHonorableMention)
     					$(item).find(".display").html("Y");
     				else
     					$(item).find(".display").html("N");
     			});     		     		
     		break;
     		case "persona":
     			$(".slot:not('.empty')").each(function(index, item){
     				var id = $(item).attr("id").substr(8);
					var session = allSessions[id];
     				//$(item).find(".display").html($(item).data("persona"));
     				$(item).find(".display").html(keys(session.personas).map(function(x) {return personaHash[x]}));
     			});
     		break;
     		default:
     		break;
     	}
     });

	$("#list-personas").on("click", "li a", function(){
		var $this = $(this);
     	$("#list-personas .view-option-active").removeClass("view-option-active");
     	$(this).parent().addClass("view-option-active");
     	var selected_persona = $(this).parent().data("type");
		$(".slot:not('.empty')").each(function(index, item){
			$(item).css("background-color", "white");
			var id = $(item).attr("id").substr(8);
			var session = allSessions[id];	
			var color = $this.find(".palette").css("background-color");
			//session.personas.contains(selected_persona);
			$.each(keys(session.personas), function(index, key){
				if (key == selected_persona){
					$(item).css("background-color", color);
				}
			});
		});
	
	});


	function displayConstraints(){
     	$.each(constraints_list, function(index, constraint){
     		var item = document.createElement("li");
     		$(item).data("type", constraint.id).html("<a href='#'><span class='palette'></span>" + constraint.label + "</a>");
     		$("#list-constraints").append($(item));
     		$(item).find("span.palette").css("background-color", constraint.color);
      	});
	}

     // Populate the View options list
     function displayViewOptions(){
     	$.each(options_list, function(index, option){
     		var item = document.createElement("li");
     		$(item).data("type", option.id).html("<a href='#'>" + option.label + "</a>");
     		$("#list-view-options").append($(item));
      	});
      	$("#list-view-options li:first-child").addClass("view-option-active");
     }

     // Display the persona list
     function displayPersonas(){
     	$.each(personaHash, function(index, persona){
     		var item = document.createElement("li");
      		$(item).data("type", index).html("<a href='#'><span class='palette'></span>" + persona + "</a>");
     		$("#list-personas").append($(item));    		
     		$(item).find("span.palette").css("background-color", getRandomColor());
     		
     	});
     	/*
     	$.each(personas_list, function(index, persona){
     		var item = document.createElement("li");
      		$(item).data("type", persona.id).html("<a href='#'><span class='palette'></span>" + persona.label + "</a>");
     		$("#list-personas").append($(item));    		
     		$(item).find("span.palette").css("background-color", persona.color);
     	});
		*/
     }
     $(document).ready(function() {
	    initialize();
	    // test: swapping leveraging the crowd with madness
	    // swapSchedule(schedule["May 7, 2012"]["11:30"]["Ballroom F"]["117"],
	    //				  schedule["May 10, 2012"]["08:30"]["Ballroom D"]["223"]);
	    //		     alert(JSON.stringify(schedule["May 7, 2012"]["11:30"]["Ballroom F"]));
	    //		     alert(JSON.stringify(schedule["May 10, 2012"]["08:30"]["Ballroom D"]));
	     
	     // test: checking that personas got attached to sessions and print out full persona names
	    // for(var s in schedule["May 7, 2012"]["11:30"]["Ballroom F"]){
	    //  	 console.log(JSON.stringify(keys(allSessions[s]["personas"]).map(function(x) {return personaHash[x]})));
	    // }

	     // test: find all sesions with conflicts
	     	  //    for(var s1 in allSessions){
	     		 // for(var s2 in allSessions){
	     		 //     if(authorConflictsAmongSessions[s1][s2].length > 0){
	     			//  	console.log(JSON.stringify(authorConflictsAmongSessions[s1][s2]));
	     			//  return;
	     		 //     }
	     		 // }
	     	  //    }
	     // test: checking author conflict finding
	     //	alert(JSON.stringify(computeAuthorConflicts(allSessions["117"], allSessions["47"])));
	     //	     	alert(JSON.stringify(computePersonaConflicts(allSessions["117"], allSessions["47"])));
	     
	     

	     // test: how many conflicts are caused by a session
	     //alert(calculateNumConflictsCausedBy(allSessions["39"]));
	     
	     // test: Proposing a swap
	     	  //    alert(JSON.stringify(proposeSwap(allSessions["39"])));
	     	  //    var swapValues = proposeSwap(allSessions["39"]);
	     	  //    var sortedSwaps = keys(swapValues).sort(function(a, b) {return swapValues[b]- swapValues[a];});
	     	  //    // return top 10 swaps
	     	  //    var output = "Finding good swaps for session 39 (" + allSessions["39"].title + ")\n";
	     	  //    for(var i = 0; i < 10; i++){
	     		 // output += sortedSwaps[i] + " (" + allSessions[sortedSwaps[i]].title + "): " + swapValues[sortedSwaps[i]] + "\n";
	     	  //    }
	     	  //    alert(output);
	     
	     
	    var sm = makeProgram();
	    displayProgram(sm);

     	displayConstraints();
     	displayViewOptions();
     	displayPersonas();

	 });


