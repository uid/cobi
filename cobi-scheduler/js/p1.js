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

    // popover title update
    // $('body').on('focus', '[contenteditable]', function() {
    //     var $this = $(this);
    //     $this.attr('data-before', $this.html());
    //     return $this;
    // }).on('blur keyup paste', '[contenteditable]', function() {
    //     var $this = $(this);
    //     // if ($this.attr('data-before') !== $this.html()) {
    //     //     $this.attr('data-before', $this.html());
    //     //     $this.trigger('change');
    //     // }
    //     return $this;
    // });

    $("body").on("click", ".popover-inner .save-button", function(){
        var $text = $(this).closest(".popover-inner").find("[contenteditable]")
        if ($(this).html() == "edit") {
            $text.attr("contenteditable", true);
            $text.trigger("focus");
            $(this).html("save");
        } else {            
            $text.attr("contenteditable", false);
            $(this).html("edit");
            var id = $(this).attr("data-session-id");
            // console.log("change", id, $text.html());
            if (typeof id !== "undefined"){
                editSessionTitle(allSessions[id], $text.html());    
            }
            
        }
    });


    // Popover close button interaction
    $("body").on("click", ".popover-close", function(){
        // console.log("popover-close", $(this).attr("data-session-id"));
        var $cell = null;
        if (typeof $(this).attr("data-session-id") === "undefined"){
            $cell = findCellByDateTimeRoom($(this).attr("data-date"), $(this).attr("data-time"), $(this).attr("data-room"));
        } else {
            $cell = findCellByID($(this).attr("data-session-id"));
        }
        $cell.trigger("click");
//        $cell.popover("hide");
    });


    $("body").on("click", ".session-link", function(){
        var id = $(this).attr("data-session-id");      
        var $cell;
        if (typeof id === "undefined" || id == "null") {
            $cell = findCellByDateTimeRoom($(this).attr("data-slot-date"), $(this).attr("data-slot-time"), $(this).attr("data-slot-room"));
        } else
            $cell = findCellByID(id);

        $("body").animate({
            scrollTop:$cell.offset().top - 100
        }, 500, function(){
            $cell.css("z-index", "auto");    
            $cell.css("position", "static");
        });         
        $cell.effect("highlight", {color: "#aec7e8 !important"}, 3000);
        $cell.css("z-index", "1011");
        $cell.css("position", "relative");

        return false;
    });

    $("body").on("click", ".submission-link", function(){
        var id = $(this).attr("data-session-id");
        var paperId = $(this).attr("data-submission-id");
        var $cell;
        if (typeof id === "undefined" || id == "null") {
            // $cell = findCellByDateTimeRoom($(this).attr("data-slot-date"), $(this).attr("data-slot-time"), $(this).attr("data-slot-room"));
            $cell = $("#unscheduled-papers #" + paperId);
        } else
            $cell = findCellByID(id);

        $("body").animate({
            scrollTop:$cell.offset().top - 100
        }, 500, function(){
            $cell.css("z-index", "auto");   
            $cell.css("position", "static"); 
        });    
        $cell.effect("highlight", {color: "#aec7e8"}, 3000);  
        $cell.css("z-index", "1011");          
        $cell.css("position", "relative");
        if ($("#" + paperId).length > 0)
            $("#" + paperId).effect("highlight", {color: "#aec7e8 !important"}, 3000);            
        return false;
    });

    $("body").on("click", ".chair-link", function(){
        var id = $(this).attr("data-session-id");
        var chairId = $(this).attr("data-chair-id");
        var $cell;
        if (typeof id === "undefined" || id == "null") {
            $cell = $("#unscheduled-chairs #" + chairId);
        } else
            $cell = findCellByID(id);

        $("body").animate({
            scrollTop:$cell.offset().top - 100
        }, 500, function(){
            $cell.css("z-index", "auto");   
            $cell.css("position", "static"); 
        });    
        $cell.effect("highlight", {color: "#aec7e8"}, 3000);  
        $cell.css("z-index", "1011");          
        $cell.css("position", "relative");
        if ($("#" + chairId).length > 0)
            $("#" + chairId).effect("highlight", {color: "#aec7e8 !important"}, 3000);            
        return false;
    });

    // Read paper IDs in order from a submission list
    function _readPaperOrder($list){
        var order = [];
        $.each($list.find("li"), function(index, item){
            // not including the last empty element
            if (item.id != "")
                order.push(item.id);
        });
        return order;
    }

    // Get html for a list of submissions for a session
    function getSubmissionList(mode, session, srcType){
        var element = document.createElement("ul");
        $(element).addClass("list-submissions");
        $.each(session.submissions, function(index, submission){
            $(element).append(getSubmissionDetail(mode, "scheduled", submission, srcType, session));                    
        });
        if (mode != "move") // do not show empty submission when move
            $(element).append(getSubmissionDetail(mode, "empty", null, srcType, session));    
        return outerHTML(element); 
    }

    // aggregator for calling getChairDetail
    function getChairList(mode, session, srcType){
        if (typeof session === "undefined" || session == null)
            return;
        var chairId = allSessions[session.id].chairs;
        if (chairId == "")
            return getChairDetail(mode, "empty", null, srcType, session);    
        else
            return getChairDetail(mode, "scheduled", allChairs[chairId], srcType, session);
    }

    // get html for a session in the view mode
    function _getViewSessionDetail(type, session){
        var element = document.createElement("div");
        if (typeof session !== "undefined" && session != null && typeof session.id !== "undefined" && session.id != null) {
           //$("<span/>").attr("id", "popover-session-" + session.id).addClass("hidden").appendTo($(element));
           $(element).attr("id", session.id);
        }

        // HQ: locked sessions get only a locked button
        var isLocked = false;
        if (type != "unscheduled" && typeof session !== "undefined" && session != null){
            isLocked = scheduleSlots[session.date][session.time][session.room]['locked'];
        }

        if(isLocked){
            $("<button/>").addClass("btn btn-inverse button-unlock").html("Unlock").appendTo($(element));
        } else {
            var $lockButton = $("<button/>").addClass("btn btn-inverse button-lock").html("Lock");
            if (type == "scheduled") {
                $("<button/>").addClass("btn btn-info button-propose-scheduled").html("Propose Move").appendTo($(element));
                $("<button/>").addClass("btn btn-danger button-unschedule").html("Unschedule").appendTo($(element));
                $lockButton.appendTo($(element));
            } else if (type == "unscheduled") {
                $("<button/>").addClass("btn btn-info button-propose-unscheduled").html("Propose Schedule").appendTo($(element));
            } else if (type == "empty") {
                $("<button/>").addClass("btn btn-info button-propose-empty").html("Propose Schedule").appendTo($(element));
                $lockButton.appendTo($(element));
            }

            if (typeof session !== "undefined" && session != null && typeof session.submissions !== "undefined" && session.submissions != null && session.submissions.length > 1) {
                $("<button/>").addClass("btn btn-inverse button-paper-reorder").html("Reorder").appendTo($(element));
            }
        }

        // Display conflicts
        if (typeof session !== "undefined" && session != null && typeof session.id !== "undefined" && session.id != null) {            
            $(element).append(Conflicts.displayViewModeSessionFullConflicts(session.id));
            if (Features.chair)
                $(element).append(getChairList("view", session));
        }

        if (typeof session !== "undefined" && session != null && typeof session.submissions !== "undefined" && session.submissions != null) {
            $(element).append(getSubmissionList("view", session));
        }
        return element;
    }



    function _getCancelButton(){
        return $("<button/>").addClass("btn move-cancel-button").html("Cancel Move");
    }

    // get html for a session in the move mode
    function _getMoveSessionDetail(type, session, srcType){
        var element = document.createElement("div");
        var $cell = null;
        if (typeof session.id === "undefined")
            $cell = findCellByDateTimeRoom(session.date, session.time, session.room);
        else
            $cell = findCellByID(session.id);

        var isLocked = false;
        if (type != "unscheduled" && typeof session !== "undefined" && session != null){
            isLocked = scheduleSlots[session.date][session.time][session.room]['locked'];
        }

        // console.log("src:", srcType, "dst:", type);
        if (srcType == "scheduled"){
            if (type == "scheduled"){
                if (isLocked)
                    $("<div/>").addClass("alert alert-info").append("<strong>This is a locked session. Unlock to change the schedule.</strong>").appendTo($(element));
                else
                    $("<button/>").attr("id", "swap-button").addClass("btn btn-primary").attr("data-session-id", session.id).html("Swap with this session").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>");
                $(element).append(Conflicts.displayMoveModeSessionFullConflicts(MoveMode.getSwapValueBySession(session)));
                if (Features.chair){
                    $(element).append(getChairList("move", session));
                }                
                $(element).append(getSubmissionList("move", session));
            } else if (type == "unscheduled"){
                console.log("Not supported");
            } else if (type == "empty"){
                if (isLocked)
                    $("<div/>").addClass("alert alert-info").append("<strong>This is a locked session. Unlock to change the schedule.</strong>").appendTo($(element));
                else {
                    $("<button/>").attr("id", "move-button").addClass("btn btn-primary")
                    .attr("data-date", session.date).attr("data-time", session.time).attr("data-room", session.room).html("Move to this slot").appendTo($(element));
                }
                $(element).append($(_getCancelButton())).append("<br>")
                $(element).append(Conflicts.displayMoveModeSessionFullConflicts(MoveMode.getSwapValueBySession(session)));
            }             
        } else if (srcType == "unscheduled") {
            if (type == "scheduled"){
                if (isLocked)
                    $("<div/>").addClass("alert alert-info").append("<strong>This is a locked session. Unlock to change the schedule.</strong>").appendTo($(element));
                else
                    $("<button/>").attr("id", "swap-with-unscheduled-button").addClass("btn btn-primary").attr("data-session-id", session.id).html("Swap with this session").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>");
                $(element).append(Conflicts.displayMoveModeSessionFullConflicts(MoveMode.getSwapValueBySession(session)));
                if (Features.chair){
                    $(element).append(getChairList("move", session));
                }                
                $(element).append(getSubmissionList("move", session));                       
            } else if (type == "unscheduled"){
                console.log("Not supported");
            } else if (type == "empty"){
                if (isLocked)
                    $("<div/>").addClass("alert alert-info").append("<strong>This is a locked session. Unlock to change the schedule.</strong>").appendTo($(element));
                else{
                    $("<button/>").attr("id", "schedule-button").addClass("btn btn-primary")
                    .attr("data-date", session.date).attr("data-time", session.time).attr("data-room", session.room).html("Schedule in this slot").appendTo($(element));
                }
                $(element).append($(_getCancelButton())).append("<br>")
                $(element).append(Conflicts.displayMoveModeSessionFullConflicts(MoveMode.getSwapValueBySession(session))); 
            }
        } else if (srcType == "empty") {
            if (type == "scheduled"){
                if (isLocked)
                    $("<div/>").addClass("alert alert-info").append("<strong>This is a locked session. Unlock to change the schedule.</strong>").appendTo($(element));
                else
                    $("<button/>").attr("id", "move-button").addClass("btn btn-primary").attr("data-session-id", session.id).html("Move this session").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>");
                $(element).append(Conflicts.displayMoveModeSessionFullConflicts(MoveMode.getSwapValueBySession(session)));
                if (Features.chair){
                    $(element).append(getChairList("move", session));
                }                
                $(element).append(getSubmissionList("move", session));                       
            } else if (type == "unscheduled"){
                if (isLocked)
                    $("<div/>").addClass("alert alert-info").append("<strong>This is a locked session. Unlock to change the schedule.</strong>").appendTo($(element));
                else
                    $("<button/>").attr("id", "schedule-button").addClass("btn btn-primary").attr("data-session-id", session.id).html("Schedule this session").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>");
                $(element).append(Conflicts.displayMoveModeSessionFullConflicts(MoveMode.getSwapValueBySession(session)))
                if (Features.chair){
                    $(element).append(getChairList("move", session));
                }                
                $(element).append(getSubmissionList("move", session));                    
            } else if (type == "empty"){
                console.log("Not supported");   
            }
        }
        //console.log(element.outerHTML);
        return element;
    }

    // get html for a session in the paper move mode
    function _getPaperMoveSessionDetail(type, session, srcType){
        var element = document.createElement("div");

        var isLocked = false;
        if (type != "unscheduled" && typeof session !== "undefined" && session != null){
            isLocked = scheduleSlots[session.date][session.time][session.room]['locked'];
        }
        if (isLocked)
            $("<div/>").addClass("alert alert-info").append("<strong>This is a locked session. Unlock to change the schedule.</strong>").appendTo($(element));
        
        $(element).append($(_getCancelButton())).append("<br>");
        if (Features.chair)
            $(element).append(getChairList("paperMove", session));
        $(element).append(getSubmissionList("paperMove", session, srcType));
        
        /*
        if (srcType == "paper-scheduled"){
            if (type == "scheduled"){
                //$("<button/>").attr("id", "swap-button").addClass("btn btn-primary").data("session-id", session.id).html("Swap with this session").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>").append(getSubmissionList("paperMove", session, srcType));
            } else if (type == "unscheduled"){
                $(element).append($(_getCancelButton())).append("<br>").append(getSubmissionList("paperMove", session, srcType));
            } else if (type == "empty"){
                //$("<button/>").attr("id", "move-button").addClass("btn btn-primary")
                //    .data("date", session.date).data("time", session.time).data("room", session.room).html("Move to this slot").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>").append(getSubmissionList("paperMove", session, srcType));
            } 

        } else if (srcType == "paper-unscheduled") {
            if (type == "scheduled"){
                //$("<button/>").attr("id", "swap-with-unscheduled-button").addClass("btn btn-primary").data("session-id", session.id).html("Swap with this session").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>").append(getSubmissionList("paperMove", session, srcType));                           
            } else if (type == "unscheduled"){
                $(element).append($(_getCancelButton())).append("<br>").append(getSubmissionList("paperMove", session, srcType));    
            } else if (type == "empty"){
                //$("<button/>").attr("id", "schedule-button").addClass("btn btn-primary")
                //    .data("date", session.date).data("time", session.time).data("room", session.room).html("Schedule in this slot").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>").append(getSubmissionList("paperMove", session, srcType));    
            }

        } else if (srcType == "paper-empty") {
            if (type == "scheduled"){
                //$("<button/>").attr("id", "move-button").addClass("btn btn-primary").data("session-id", session.id).html("Move this session").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>").append(getSubmissionList("paperMove", session, srcType));                        
            } else if (type == "unscheduled"){
                //$("<button/>").attr("id", "schedule-button").addClass("btn btn-primary").data("session-id", session.id).html("Schedule this session").appendTo($(element));
                $(element).append($(_getCancelButton())).append("<br>").append(getSubmissionList("paperMove", session, srcType));
            } else if (type == "empty"){
                $(element).append($(_getCancelButton())).append("<br>").append(getSubmissionList("paperMove", session, srcType));
                // console.log("Not supported");   
            }
        }
        */
        //console.log(element.outerHTML);
        return element;
    }


    // get html for a session in the paper move mode
    function _getChairMoveSessionDetail(type, session, srcType){
        var element = document.createElement("div");
        var isLocked = false;
        if (type != "unscheduled" && typeof session !== "undefined" && session != null){
            isLocked = scheduleSlots[session.date][session.time][session.room]['locked'];
        }
        if (isLocked)
            $("<div/>").addClass("alert alert-info").append("<strong>This is a locked session. Unlock to change the schedule.</strong>").appendTo($(element));
        
        $(element).append($(_getCancelButton())).append("<br>");
        if (Features.chair)
            $(element).append(getChairList("chairMove", session, srcType));
        $(element).append(getSubmissionList("chairMove", session, srcType));
        return element;
    }

    // Getting html for session details
    function getSessionDetail(mode, type, session, srcType){
        var element;
        if (mode == "view")
            element = _getViewSessionDetail(type, session);
        else if (mode == "move")
            element = _getMoveSessionDetail(type, session, srcType);
        else if (mode == "paperMove")
            element = _getPaperMoveSessionDetail(type, session, srcType);
        else if (mode == "chairMove")
            element = _getChairMoveSessionDetail(type, session, srcType);
        else
           return "";
        return outerHTML(element);
    }

    // get html for a submission in the view mode
    function _getViewSubmissionDetail(type, submission, session){
        var element; 
        var isLocked = false;
        // if the session is a single submission type special session (sig, panel, bof, ...), do not display buttons
        var isSpecial = false;
        if (typeof session !== "undefined" && session != null){
            if (!(session.id in unscheduled)) {
                isLocked = scheduleSlots[session.date][session.time][session.room]['locked'];
            }
            isSpecial = isSpecialSession(session);
        }

        if (type == "scheduled") {
            var stype = (submission.type == "paper") ? submission.subtype : submission.type;
            element = document.createElement("li");
            $(element).addClass("submission").attr("id", submission.id);
            $("<span/>").addClass("reorder-icon").appendTo($(element));
            $("<span/>").addClass("submission-type").html(stype).appendTo($(element));
            $("<span/>").addClass("submission-id").html(submission.id).appendTo($(element));
            if (submission.bestPaperAward)
                    $("<span/>").addClass("awards").html("<img src='img/best-paper.png' class='icon'/>").appendTo($(element));
                if (submission.bestPaperNominee)
                    $("<span/>").addClass("awards").html("<img src='img/nominee.png' class='icon'/>").appendTo($(element));
            if (!isLocked && !isSpecial){
                $("<button/>").addClass("btn btn-mini button-paper-unschedule").html("Unschedule").appendTo($(element));
                $("<button/>").addClass("btn btn-mini button-paper-propose-scheduled").html("Propose Move").appendTo($(element));
            }
            $("<br/>").appendTo($(element));
            $("<span/>").addClass("submission-title").html(submission.title).appendTo($(element));
            $("<br/>").appendTo($(element));
            $("<span/>").addClass("submission-authors").html(displayAuthors(submission.authors)).appendTo($(element));
            $(element).append(Conflicts.displayViewModeSubmissionFullConflicts(session, submission));

            // html += "<li class='submission' id='" + submission.id
            //      +"'><span class='reorder-icon'/> <span class='submission-type'>" + type + "</span> <button class='btn btn-mini button-paper-unschedule'>Unschedule</button> <button class='btn btn-mini button-paper-propose-scheduled'>Propose Move</button><br>" 
            //      + "<strong>" + submission.title + "</strong><br>"
            //      + displayAuthors(submission.authors) + "</li>";
        } else if (type == "unscheduled") {
            element = document.createElement("div");
            $(element).attr("id", submission.id);
            //$("<span/>").attr("id", "popover-submission-" + submission.id).addClass("hidden").appendTo($(element));
            if (!isLocked && !isSpecial)
                $("<button/>").addClass("btn btn-mini button-paper-propose-unscheduled").html("Propose Move").appendTo($(element));
            $("<div/>").addClass("conflicts").appendTo($(element));
            $("<br/>").appendTo($(element));
            if (submission.bestPaperAward)
                $("<span/>").addClass("awards").html("<img src='img/best-paper.png' class='icon'/>").appendTo($(element));
                if (submission.bestPaperNominee)
                $("<span/>").addClass("awards").html("<img src='img/nominee.png' class='icon'/>").appendTo($(element));
            $("<span/>").html("<strong>Authors</strong>: " + displayAuthors(submission.authors)).appendTo($(element));

            // console.log(typeof submission, submission == null);
            // if (typeof submission !== "undefined" && submission != null && typeof submission.id !== "undefined" && submission.id != null) {
            //      console.log( typeof submission.id, submission.id);
            //      html += "<span id='popover-session-" + submission.id + "' class='hidden'/>";
            // }
            // html += "<button class='btn btn-info button-paper-propose-unscheduled'>Propose Schedule</button>";
            // html += " <div class='conflicts'/>";
            // html += "<br><strong>Authors</strong>: " + displayAuthors(submission.authors);
        } else if (type == "empty") {
            if (isLocked || isSpecial){
                element = document.createElement("div");
            } else {
                element = document.createElement("li");
                $(element).addClass("submission-empty");
                $("<button/>").addClass("btn btn-small button-paper-propose-empty").html("<span class='icon-plus'/> Propose a paper to add").appendTo($(element));
            }
            // html += "<li class='submission-empty'><button class='btn btn-small button-paper-propose-empty'><span class='icon-plus'/> Propose a paper to add</button></li>";
        } else 
            document.createElement("div");
        return element;
    }

    // get html for a submission in the move mode
    function _getMoveSubmissionDetail(type, submission){
        var element;

        if (type == "scheduled"){
            var stype = (submission.type == "paper") ? submission.subtype : submission.type;
            element = document.createElement("li");
            $(element).addClass("submission").attr("id", submission.id)
            $("<span/>").addClass("reorder-icon").appendTo($(element));
            $("<span/>").addClass("submission-type").html(stype).appendTo($(element));
            $("<span/>").addClass("submission-id").html(submission.id).appendTo($(element));
            if (submission.bestPaperAward)
                $("<span/>").addClass("awards").html("<img src='img/best-paper.png' class='icon'/>").appendTo($(element));
            if (submission.bestPaperNominee)
                $("<span/>").addClass("awards").html("<img src='img/nominee.png' class='icon'/>").appendTo($(element));
            $("<br/>").appendTo($(element));
            $("<span/>").addClass("submission-title").html(submission.title).appendTo($(element));
            $("<br/>").appendTo($(element));
            $("<span/>").addClass("submission-authors").html(displayAuthors(submission.authors)).appendTo($(element));
        } else if (type == "unscheduled") {
            element = document.createElement("div");
            // console.log("return nothing");
        } else if (type == "empty") {
            element = document.createElement("div");
            // console.log("return nothing");
        }
        return element;
    }

    // get html for a submission in the paper move mode
    function _getPaperMoveSubmissionDetail(type, submission, srcType, session){
        var element;
        var proposedList = [];
        var isProposed = false;
        var isRecommended = false;
        // console.log("src:", srcType, "dst:", type);
        var isLocked = false;
        if (typeof session !== "undefined" && session != null){
            if (!(session.id in unscheduled)) {
                isLocked = scheduleSlots[session.date][session.time][session.room]['locked'];
            }
        }

        // unscheduled: session null, submission id
        if (type == "unscheduled" && session == null){
            isProposed = typeof $("#"+submission.id).attr("data-proposed-swap-paper") !== "undefined";
            // if (typeof $("#"+submission.id).find(".swap-total").attr("data-best-submission") !== "undefined" 
            //     && $("#"+submission.id).find(".swap-total").attr("data-best-submission") == "null")
            //     isRecommended = true;            
            // console.log(null, submission.id, isProposed);
        // empty: session id, submission null
        } else if (type == "empty" && submission == null){
            var $session = findCellByID(session.id);
            if (typeof $session.attr("data-proposed-swap-paper") === "undefined")
                isProposed = false;
            else {
                proposedList = $session.attr("data-proposed-swap-paper").split(",");
                // because attr returns all strings, "null" not null is returned.
                isProposed = $.inArray("null", proposedList) !== -1;
            }
            if (typeof $session.find(".swap-total").attr("data-best-submission") !== "undefined" 
                && $session.find(".swap-total").attr("data-best-submission") == "null")
                isRecommended = true;
            // console.log(session.id, null, isProposed, proposedList);
        // scheduled: session id, submission id
        } else if (type == "scheduled" && session != null && submission != null){
            var $session = findCellByID(session.id);
            if (typeof $session.attr("data-proposed-swap-paper") === "undefined")
                isProposed = false;
            else {
                proposedList = $session.attr("data-proposed-swap-paper").split(",");
                isProposed = $.inArray(submission.id, proposedList) !== -1;
            }
            if (typeof $session.find(".swap-total").attr("data-best-submission") !== "undefined" 
                && $session.find(".swap-total").attr("data-best-submission") == submission.id)
                isRecommended = true;            
            // console.log(session.id, submission.id, isProposed);
        } else {
            // console.log(session, submission, isProposed, type, srcType);
            console.log("IMPOSSIBLE");
        }

        if (srcType == "paper-scheduled"){
            if (type == "scheduled"){
                var stype = (submission.type == "paper") ? submission.subtype : submission.type;
                element = document.createElement("li");
                $(element).addClass("submission").attr("id", submission.id);
                $("<span/>").addClass("reorder-icon").appendTo($(element));
                $("<span/>").addClass("submission-type").html(stype).appendTo($(element));
                $("<span/>").addClass("submission-id").html(submission.id).appendTo($(element));
                if (submission.bestPaperAward)
                    $("<span/>").addClass("awards").html("<img src='img/best-paper.png' class='icon'/>").appendTo($(element));
                if (submission.bestPaperNominee)
                    $("<span/>").addClass("awards").html("<img src='img/nominee.png' class='icon'/>").appendTo($(element));
                if (isProposed && !isLocked)
                    $("<button/>").addClass("btn btn-mini button-paper-swap").html("Swap with this paper").appendTo($(element));
                $("<br/>").appendTo($(element));
                $("<span/>").addClass("submission-title").html(submission.title).appendTo($(element));
                $("<br/>").appendTo($(element));
                $("<span/>").addClass("submission-authors").html(displayAuthors(submission.authors)).appendTo($(element));
                $(element).append(Conflicts.displayMoveModeSubmissionFullConflicts(MoveMode.getSwapValueBySubmission(session, submission)));

            } else if (type == "unscheduled"){
                element = document.createElement("div");
                // console.log("No return");

            } else if (type == "empty"){
                // TODO: maybe also save date, time, room, and order info
                if (isProposed){
                    element = document.createElement("li");
                    $(element).addClass("submission-empty");
                    if (!isLocked)     
                        $("<button/>").addClass("btn btn-small button-paper-move").html("<span class='icon-plus'/> Move to this slot").appendTo($(element));
                    $(element).append(Conflicts.displayMoveModeSubmissionFullConflicts(MoveMode.getSwapValueBySubmission(session, submission)));
                } else {
                    element = document.createElement("div");
                }
            } 
        } else if (srcType == "paper-unscheduled") {
            if (type == "scheduled"){
                var stype = (submission.type == "paper") ? submission.subtype : submission.type;
                element = document.createElement("li");
                $(element).addClass("submission").attr("id", submission.id);
                $("<span/>").addClass("reorder-icon").appendTo($(element));
                $("<span/>").addClass("submission-type").html(stype).appendTo($(element));
                $("<span/>").addClass("submission-id").html(submission.id).appendTo($(element));
                if (submission.bestPaperAward)
                    $("<span/>").addClass("awards").html("<img src='img/best-paper.png' class='icon'/>").appendTo($(element));
                if (submission.bestPaperNominee)
                    $("<span/>").addClass("awards").html("<img src='img/nominee.png' class='icon'/>").appendTo($(element));
                if (isProposed && !isLocked)
                    $("<button/>").addClass("btn btn-mini button-paper-swap-with-unscheduled").html("Swap with this paper").appendTo($(element));
                $("<br/>").appendTo($(element));
                $("<span/>").addClass("submission-title").html(submission.title).appendTo($(element));
                $("<br/>").appendTo($(element));
                $("<span/>").addClass("submission-authors").html(displayAuthors(submission.authors)).appendTo($(element));
                $(element).append(Conflicts.displayMoveModeSubmissionFullConflicts(MoveMode.getSwapValueBySubmission(session, submission)));
            } else if (type == "unscheduled"){
                element = document.createElement("div");
                // console.log("No return");
            } else if (type == "empty"){
                // TODO: maybe also save date, time, room, and order info
                if (isProposed) {
                    element = document.createElement("li");
                    $(element).addClass("submission-empty");
                    if (!isLocked)     
                        $("<button/>").addClass("btn btn-small button-paper-schedule").html("<span class='icon-plus'/> Schedule in this slot").appendTo($(element));
                    $(element).append(Conflicts.displayMoveModeSubmissionFullConflicts(MoveMode.getSwapValueBySubmission(session, submission)));
                } else {
                    element = document.createElement("div");
                }
            }
        } else if (srcType == "paper-empty") {
            if (type == "scheduled"){
                var stype = (submission.type == "paper") ? submission.subtype : submission.type;
                element = document.createElement("li");
                $(element).addClass("submission").attr("id", submission.id);
                $("<span/>").addClass("reorder-icon").appendTo($(element));
                $("<span/>").addClass("submission-type").html(stype).appendTo($(element));
                $("<span/>").addClass("submission-id").html(submission.id).appendTo($(element));
                if (submission.bestPaperAward)
                    $("<span/>").addClass("awards").html("<img src='img/best-paper.png' class='icon'/>").appendTo($(element));
                if (submission.bestPaperNominee)
                    $("<span/>").addClass("awards").html("<img src='img/nominee.png' class='icon'/>").appendTo($(element));
                if (isProposed && !isLocked)
                    $("<button/>").addClass("btn btn-mini button-paper-move").html("Move this paper").appendTo($(element));
                $("<br/>").appendTo($(element));
                $("<span/>").addClass("submission-title").html(submission.title).appendTo($(element));
                $("<br/>").appendTo($(element));
                $("<span/>").addClass("submission-authors").html(displayAuthors(submission.authors)).appendTo($(element));
                $(element).append(Conflicts.displayMoveModeSubmissionFullConflicts(MoveMode.getSwapValueBySubmission(session, submission)));
            } else if (type == "unscheduled"){
                // TODO: maybe also save date, time, room, and order info
                if (isProposed) {
                    element = document.createElement("li");
                    // $(element).addClass("submission-empty").css("list-style-type", "none");
                    $(element).css("list-style-type", "none");  
                    if (!isLocked)                       
                        $("<button/>").addClass("btn btn-small button-paper-schedule").html("<span class='icon-plus'/> Schedule this paper").appendTo($(element));
                    $("<br/><br/>").appendTo($(element));
                    if (submission.bestPaperAward)
                        $("<span/>").addClass("awards").html("<img src='img/best-paper.png' class='icon'/>").appendTo($(element));
                    if (submission.bestPaperNominee)
                        $("<span/>").addClass("awards").html("<img src='img/nominee.png' class='icon'/>").appendTo($(element));                    
                    $("<span/>").html("<strong>Authors</strong>: " + displayAuthors(submission.authors)).appendTo($(element));                    
                    $(element).append(Conflicts.displayMoveModeSubmissionFullConflicts(MoveMode.getSwapValueBySubmission(session, submission)));

                } else {
                    element = document.createElement("div");
                }

            } else if (type == "empty"){
                element = document.createElement("div");
                // console.log("No return");   
            }
        }

        if (isProposed)
            $(element).addClass("proposed-swap-paper");

        if (isRecommended)
            $(element).addClass("recommended");
        return element;
    }


    // get html for a submission in the chair move mode
    function _getChairMoveSubmissionDetail(type, submission){
        var element;

        if (type == "scheduled"){
            var stype = (submission.type == "paper") ? submission.subtype : submission.type;
            element = document.createElement("li");
            $(element).addClass("submission").attr("id", submission.id)
            $("<span/>").addClass("reorder-icon").appendTo($(element));
            $("<span/>").addClass("submission-type").html(stype).appendTo($(element));
            $("<span/>").addClass("submission-id").html(submission.id).appendTo($(element));
            if (submission.bestPaperAward)
                $("<span/>").addClass("awards").html("<img src='img/best-paper.png' class='icon'/>").appendTo($(element));
            if (submission.bestPaperNominee)
                $("<span/>").addClass("awards").html("<img src='img/nominee.png' class='icon'/>").appendTo($(element));
            $("<br/>").appendTo($(element));
            $("<span/>").addClass("submission-title").html(submission.title).appendTo($(element));
            $("<br/>").appendTo($(element));
            $("<span/>").addClass("submission-authors").html(displayAuthors(submission.authors)).appendTo($(element));
        } else if (type == "unscheduled") {
            element = document.createElement("div");
            // console.log("return nothing");
        } else if (type == "empty") {
            element = document.createElement("div");
            // console.log("return nothing");
        }
        return element;
    }

    // Getting html for submission details
    function getSubmissionDetail(mode, type, submission, srcType, session){
        var element;
        if (mode == "view")
           element = _getViewSubmissionDetail(type, submission, session);
        else if (mode == "move")
           element = _getMoveSubmissionDetail(type, submission);
        else if (mode == "paperMove")
           element = _getPaperMoveSubmissionDetail(type, submission, srcType, session);
        else if (mode == "chairMove")
           element = _getChairMoveSubmissionDetail(type, submission);       
        else
           return "";
        return outerHTML(element);
    }


    // get html for a chair in the view mode
    function _getViewChairDetail(type, chair, session){
        var element = document.createElement("div");
        if (typeof chair !== "undefined" && chair != null && typeof chair.authorId !== "undefined" && chair.authorId != null) { // typeof session !== "undefined" && session != null && 
           $(element).attr("data-chair-id", chair.authorId);
        }
        var isLocked = false;
        var isSpecial = false;
        if (typeof session !== "undefined" && session != null){
            if (!(session.id in unscheduled)) {
                isLocked = scheduleSlots[session.date][session.time][session.room]['locked'];
            }
            isSpecial = isSpecialSession(session);
        }
        
        var chairButtonDisplay = "";
        if (type == "scheduled") {
            chairButtonDisplay = "Propose Move";
            $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));
            $(element).addClass("alert alert-info chair-display chair");
            if (!isLocked){
                $("<button/>").addClass("btn btn-mini button-chair-unschedule").html("Unschedule").appendTo($(element));                    
                $("<button/>").addClass("btn btn-mini button-chair-propose-scheduled").html(chairButtonDisplay).appendTo($(element));   
            }
            $(element).append(Conflicts.displayViewModeChairFullConflicts(session, chair));
        } else if (type == "unscheduled") {
            if (chair.chairs == ""){
              chairButtonDisplay = "Propose a chair";
            }else{
              chairButtonDisplay = "Propose Move";
            }
            if (!isLocked)
                $("<button/>").addClass("btn btn-mini button-chair-propose-unscheduled").html(chairButtonDisplay).appendTo($(element));
        } else if (type == "empty") {
            chairButtonDisplay = "Propose a chair";
            $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));
            $(element).addClass("alert alert-info chair-display chair");
            if (!isLocked)
                $("<button/>").addClass("btn btn-mini button-chair-propose-empty").html(chairButtonDisplay).appendTo($(element));
            $(element).append(Conflicts.displayViewModeChairFullConflicts(session, chair));
        }
        return element;
    }

    // get html for a chair in the view mode
    function _getMoveChairDetail(type, chair){
        var element = document.createElement("div");
        if (typeof chair !== "undefined" && chair != null && typeof chair.authorId !== "undefined" && chair.authorId != null) { // typeof session !== "undefined" && session != null && 
           $(element).attr("data-chair-id", chair.authorId);
        }

        if (type == "scheduled") {
            $(element).addClass("alert alert-info chair-display chair");
            $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));
        } else if (type == "unscheduled") {
            console.log("impossible");
        } else if (type == "empty") {
            $(element).addClass("alert alert-info chair-display chair");
            $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));
        }
        return element;
    }


    // get html for a chair in the view mode
    function _getPaperMoveChairDetail(type, chair){
        var element = document.createElement("div");
        if (typeof chair !== "undefined" && chair != null && typeof chair.authorId !== "undefined" && chair.authorId != null) { // typeof session !== "undefined" && session != null && 
           $(element).attr("data-chair-id", chair.authorId);
        }

        if (type == "scheduled") {
            $(element).addClass("alert alert-info chair-display chair");
            $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));
        } else if (type == "unscheduled") {
            console.log("impossible");
        } else if (type == "empty") {
            $(element).addClass("alert alert-info chair-display chair");
            $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));
        }
        return element;
    }


    // get html for a chair in the view mode
    function _getChairMoveChairDetail(type, chair, srcType, session){
        var element = document.createElement("div");
        if (typeof chair !== "undefined" && chair != null && typeof chair.authorId !== "undefined" && chair.authorId != null) { // typeof session !== "undefined" && session != null && 
           $(element).attr("data-chair-id", chair.authorId);
        }

        var isProposed = false;
        var isLocked = false;
        var isSpecial = false;
        if (typeof session !== "undefined" && session != null){
            if (!(session.id in unscheduled)) {
                isLocked = scheduleSlots[session.date][session.time][session.room]['locked'];
            }
            // TODO: isSpecial checking not needed because swapValues will take care and not return non-matching sessions anyway
            //isSpecial = isSpecialSession(session);
        }

        // unscheduled: session null, chair id
        if (type == "unscheduled" && session == null){
            isProposed = typeof $("#"+chair.authorId).attr("data-proposed-swap-chair") !== "undefined";
            // if (typeof $("#"+submission.id).find(".swap-total").attr("data-best-submission") !== "undefined" 
            //     && $("#"+submission.id).find(".swap-total").attr("data-best-submission") == "null")
            //     isRecommended = true;            
            // console.log(null, submission.id, isProposed);
        // empty: session id, chair null
        } else if (type == "empty" && chair == null){
            var $session = findCellByID(session.id);
            isProposed = (typeof $session.attr("data-proposed-swap-chair") !== "undefined");
        // scheduled: session id, submission id
        } else if (type == "scheduled" && session != null && chair != null){
            var $session = findCellByID(session.id);
            isProposed = (typeof $session.attr("data-proposed-swap-chair") !== "undefined");
            // console.log(session.id, submission.id, isProposed);
        } else {
            // console.log(session, submission, isProposed, type, srcType);
            console.log("IMPOSSIBLE");
        }

        if (srcType == "chair-scheduled"){
            if (type == "scheduled"){
                $(element).addClass("alert alert-info chair-display chair");
                $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));   
                if (!isLocked)     
                    $("<button/>").addClass("btn btn-mini button-chair-swap").html("Swap with this chair").appendTo($(element));  
                $(element).append(Conflicts.displayMoveModeChairFullConflicts(MoveMode.getSwapValueByChair(session, chair)));

            } else if (type == "unscheduled"){
                console.log("Now supported");
                $(element).addClass("alert alert-info chair-display chair");
                $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));     
                if (!isLocked)                
                    $("<button/>").addClass("btn btn-mini button-chair-swap-with-unscheduled").html("Swap with this chair").appendTo($(element));  
                $(element).append(Conflicts.displayMoveModeChairFullConflicts(MoveMode.getSwapValueByChair(session, chair)));
            } else if (type == "empty"){
                $(element).addClass("alert alert-info chair-display chair");
                $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));    
                if (isProposed){            
                    if (!isLocked)     
                        $("<button/>").addClass("btn btn-mini button-chair-move").html("<span class='icon-plus'/> Move to this slot").appendTo($(element));  
                } 
                $(element).append(Conflicts.displayMoveModeChairFullConflicts(MoveMode.getSwapValueByChair(session, chair)));
            } 
        } else if (srcType == "chair-unscheduled") {
            if (type == "scheduled"){
                $(element).addClass("alert alert-info chair-display chair");
                $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));     
                if (!isLocked)                
                    $("<button/>").addClass("btn btn-mini button-chair-swap-with-unscheduled").html("Swap with this chair").appendTo($(element));  
                $(element).append(Conflicts.displayMoveModeChairFullConflicts(MoveMode.getSwapValueByChair(session, chair)));
            } else if (type == "unscheduled"){
                console.log("No return");
            } else if (type == "empty"){
                $(element).addClass("alert alert-info chair-display chair");
                $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));      
                if (isProposed) {
                    if (!isLocked)     
                        $("<button/>").addClass("btn btn-mini button-chair-schedule").html("<span class='icon-plus'/> Schedule in this slot").appendTo($(element));  
                } 
                $(element).append(Conflicts.displayMoveModeChairFullConflicts(MoveMode.getSwapValueByChair(session, chair)));
            }
        } else if (srcType == "chair-empty") {
            if (type == "scheduled"){
                $(element).addClass("alert alert-info chair-display chair");
                $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));        
                if (!isLocked)             
                    $("<button/>").addClass("btn btn-mini button-chair-move").html("Move this chair").appendTo($(element));  
                $(element).append(Conflicts.displayMoveModeChairFullConflicts(MoveMode.getSwapValueByChair(session, chair)));
            } else if (type == "unscheduled"){
                $(element).addClass("alert alert-info chair-display chair");
                $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));                    
                if (isProposed) {          
                    if (!isLocked)     
                        $("<button/>").addClass("btn btn-mini button-chair-schedule").html("Schedule this chair").appendTo($(element));  
                }
                $(element).append(Conflicts.displayMoveModeChairFullConflicts(MoveMode.getSwapValueByChair(session, chair)));
            } else if (type == "empty"){
                $(element).addClass("alert alert-info chair-display chair");
                $("<span/>").addClass("chair-text").html(displayChairName(chair, true)).appendTo($(element));      
                $(element).append(Conflicts.displayMoveModeChairFullConflicts(MoveMode.getSwapValueByChair(session, chair)));
            }
        }
        if (isProposed)
            $(element).addClass("proposed-swap-chair");
        return element;
    }    

    // Getting html for chair details
    function getChairDetail(mode, type, chair, srcType, session){
        var element;
        if (mode == "view")
            element = _getViewChairDetail(type, chair, session);
        else if (mode == "move")
           element = _getMoveChairDetail(type, chair);
        else if (mode == "paperMove")
           element = _getPaperMoveChairDetail(type, chair);
        else if (mode == "chairMove")
           element = _getChairMoveChairDetail(type, chair, srcType, session);       
        else
           return "";
        return outerHTML(element);
    }

     // For each session item, render session display
    function getSessionCell(type, session, slotDate, slotTime, slotRoom){
	    var slotDate = typeof slotDate !== "undefined" ? slotDate : null;
        var slotTime = typeof slotTime !== "undefined" ? slotTime : null;
        var slotRoom = typeof slotRoom !== "undefined" ? slotRoom : null;
        var cell = document.createElement('td');
        $(cell).addClass("cell slot").append("<div class='user'/><div class='title'/><div class='display'/><div class='conflicts'/>");

        // Empty Session
		if (type == "empty" || session == -1){
            if(scheduleSlots[slotDate][slotTime][slotRoom]['locked'])
                $(cell).find(".title").addClass("locked");

            $(cell).addClass("empty").attr("data-date", slotDate).attr("data-time", slotTime).attr("data-room", slotRoom);                   
            $(cell).find(".title").append("<i class='icon-plus'></i>")     

            // Unavailable / Locked Session                         
        } else if (type == "unavailable" || session == "") {
            $(cell).addClass("unavailable");
       
        // Scheduled / Unscheduled Session
        } else {
            if(type !== "unscheduled" && scheduleSlots[session.date][session.time][session.room]['locked'])
                $(cell).find(".title").addClass("locked");
	 	
            $(cell).attr("id", "session-" + session.id)
                .addClass(type)
                .attr("data-session-id", session.id)                 
                .attr("data-date", slotDate).attr("data-time", slotTime).attr("data-room", slotRoom);
            
            if (typeof session.title !== "undefined")
                $(cell).find(".title").html(session.title);
		} 
		return cell;
    }

     // For each submission item, render submission display, only to be used for the unscheduled papers panel at the top
    function getSubmissionCell(type, submission){
        var cell = document.createElement('td');
        $(cell).addClass("cell slot-paper")
            .append("<div class='user'/><div class='title'/><div class='display'/><div class='conflicts'/>");

        // Empty Session
        if (type == "empty" || submission == -1){   
            console.log("empty submission display: not used");
        // Unavailable / Locked Session                         
        } else if (type == "unavailable" || submission == "") {
            console.log("unavailable submission display: not used");
        // Scheduled
        } else if (type == "scheduled") {
            console.log("scheduled submission display: not used");
        // Unscheduled
        } else {
            $(cell).attr("id", "" + submission.id).addClass(type);
            if (typeof submission.title !== "undefined")
                 $(cell).find(".title").html(submission.title);
       } 
       return cell;
    }

     // For each chair item, render chair display
    function getChairCell(type, chair){
        var cell = document.createElement('td');
        $(cell).addClass("cell slot-chair").append("<div class='user'/><div class='title'/><div class='display'/><div class='conflicts'/>");

        // Empty Session
        if (type == "empty" || chair == -1){
            console.log("unavailable chair display: not used");

        // Unavailable / Locked Session                         
        } else if (type == "unavailable" || chair == "") {
            console.log("unavailable chair display: not used");

        // Scheduled
        } else if (type == "scheduled") {
            console.log("scheduled chair display: not used");

        // Unscheduled Session
        } else {
            $(cell).attr("id", "" + chair.authorId).attr("data-chair-id", chair.authorId).addClass(type);            
            if (typeof chair !== "undefined")
                $(cell).find(".title").html(displayChairName(chair, false));
        } 
        return cell;
    }

     function displayAuthors(authors){
          var html = "";      
          $.each(authors, function(i, author){
               html += author.firstName + " " + author.lastName + ", ";
          }); 
          // remove the trailing comma at the end
          return html.slice(0, -2);
     }



     // Display textually the slot title. (slot data structure)
     // When session exists: Name of the session
     // When session is empty: show date, time, room
     function displaySlotTitle(slot) {
          if (slot.session === null) {
               return slot.date + " " + slot.time + " " + slot.room;
          } else {
               return allSessions[slot.session].title;
          }
     }

     // Display textually the session title.
     // When session exists: Name of the session
     // When session is empty: show date, time, room
     function displaySessionTitle(session) {
          if (session.hasClass("empty")) {
               return session.attr("data-date") + " " + session.attr("data-time") + " " + session.attr("data-room");
          } else {
               //console.log(session);
               return allSessions[getID(session)].title;
          }
     }

    // Update the unscheduled session count just by looking at the DOM nodes, not the database
     function updateUnscheduledCount(){
          count = $("#unscheduled .slot").length;
          $("#unscheduled-count").html(count);

          count = $("#unscheduled-papers .slot-paper").length;
          $("#unscheduled-papers-count").html(count);

        if (Features.chair){
          count = $("#unscheduled-chairs .slot-chair").length;
          $("#unscheduled-chairs-count").html(count);          
        }
     }


     // Display the unscheduled panel
     function displayUnscheduled(){
          var cell = null;
          keys(unscheduled).map(function(id){
               cell = getSessionCell("unscheduled", allSessions[id]);
               $("#unscheduled tr").append(cell);         
          });

          keys(unscheduledSubmissions).map(function(id){
               cell = getSubmissionCell("unscheduled", allSubmissions[id]);
               $("#unscheduled-papers tr").append(cell);         
          });

        if (Features.chair){
          keys(unscheduledChairs).map(function(id){
               cell = getChairCell("unscheduled", allChairs[id]);
               $("#unscheduled-chairs tr").append(cell);         
          });
        }
          updateUnscheduledCount();
     }


     // Display all scheduled sessions in the main grid
     function displayScheduled(){
          var days = {
            "Sunday": 0,
            "Monday": 1,
            "Tuesday": 2,
            "Wednesday": 3,
            "Thursday": 4,
            "Friday": 5,
            "Saturday": 6
          }
          //var orderedDates = keys(schedule).sort(function(a,b) {return new Date(a) - new Date(b);});
          //var orderedRooms = keys(allRooms).sort(function(a,b) {return allRooms[a] - allRooms[b];});
          var orderedDates = keys(schedule).sort(function(a,b) {return days[a] - days[b];});
          var orderedRooms = keys(allRooms).sort(function(a, b){
	       return desiredRoomOrder.indexOf(a) - desiredRoomOrder.indexOf(b);
	      });

          var i, cell;
          // Table Header
          var table = document.createElement('table'); 
          /*
          var header = document.createElement('tr');
          var firstcell = $(document.createElement('td')).addClass("cell header-col").append("<div>Room/<br>Time</div>");
          //var secondcell = $(document.createElement('td')).addClass("cell").append("<div>Conflicts</div>");
          $(header).addClass("header-row").append(firstcell); //.append(secondcell);
          for(var i = 0; i < orderedRooms.length; i++){
               var cell = document.createElement('td');
               $(cell).addClass("cell header-cell").append("<div>" + orderedRooms[i] + "</div>");
               $(header).append(cell);
          }
          $("#program").append(header);
          */
          addHeaderRow(orderedRooms);

          // Main content
          $.each(orderedDates, function(index, date){
            
            var orderedTimes = keys(schedule[date]).sort(function(a,b) {return a.split(":")[0] - b.split(":")[0];});
            $.each(orderedTimes, function(index2, time){
                // add an extra row for daily borders
                if (index2 == 0) {
                    addBorderRow(orderedRooms);
                    // var borderRow = document.createElement('tr');
                    // var borderSlot = document.createElement('td');
                    // $(borderSlot).attr("colspan", orderedRooms.length+1).addClass("header-day-border");
                    // $(borderRow).append(borderSlot);
                    // $('#program').append(borderRow);
                    //$(slot).addClass("header-day-border");
                }
                var row = document.createElement('tr');
                var slot = document.createElement('td');
//              var conflicts = document.createElement('td');
                $(slot).addClass("cell header-col").append(shortenDate(date) + " " + time);

                $(row).append(slot);
                //console.log(date, time);
                $.each(orderedRooms, function(index3, room){
                    var sessions = schedule[date][time][room];
                    //console.log(schedule[date][time][room]);
                    // if this room has an associated session, display it.
                    if (typeof sessions !== "undefined") {

                        if (keys(sessions).length === 0){
                            cell = getSessionCell("empty", null, date, time, room);
                        } else {
                            $.each(sessions, function(id, session){
                                cell = getSessionCell("scheduled", session, date, time, room);
                            });
                        }
                    } else { // otherwise, mark it unavailable.
                        cell = getSessionCell("unavailable", null);
                    }
                    $(row).append(cell);                    
                });

                $('#program').append(row);

            });
          });

                    // var borderRow = document.createElement('tr');
                    // var borderSlot = document.createElement('td');
                    // $(borderSlot).attr("colspan", orderedRooms.length+1).addClass("header-day-border");
                    // $(borderRow).append(borderSlot);
                    // $('#program').append(borderRow);

            addBorderRow(orderedRooms);
            addHeaderRow(orderedRooms);

  
     }

     function addHeaderRow(orderedRooms){
          var header = document.createElement('tr');
          var firstcell = $(document.createElement('td')).addClass("cell header-col").append("<div>Room/<br>Time</div>");
          //var secondcell = $(document.createElement('td')).addClass("cell").append("<div>Conflicts</div>");
          $(header).addClass("header-row").append(firstcell); //.append(secondcell);
          for(var i = 0; i < orderedRooms.length; i++){
               var cell = document.createElement('td');
               $(cell).addClass("cell header-cell").append("<div>" + orderedRooms[i] + "</div>");
               $(header).append(cell);
          }
          $("#program").append(header);       
     }

     function addBorderRow(orderedRooms){
            var borderRow = document.createElement('tr');
            var borderSlot = document.createElement('td');
            $(borderSlot).attr("colspan", orderedRooms.length+1).addClass("header-day-border");
            $(borderRow).append(borderSlot);
            $('#program').append(borderRow);
     }

    $(document).ready(function() {
        $("body").addClass("loading"); 
        Statusbar.initialize(); 
	    
        // triggered once initialize is complete
        // initialize() is async, thus the bind
        $(document).bind("fullyLoaded", function(){
            displayScheduled();
            displayUnscheduled();
            
            // should come before Sidebar initialization because we need to generate the conflicts list from here dynamically
            Conflicts.initialize();

            Sidebar.initialize(); 
            Searchbox.initialize();
            Polling.initialize();
            // default is view mode.
            ViewMode.initialize();   
            UnscheduledPanel.initialize(); 
 
            $(".user-display").append("<span class='icon-user icon-white'/>").append(getUsernameByUID(userData.id));
            Statusbar.display("Select a session for scheduling options and more information.");
            $("body").removeClass("loading");             
        });
        initialize();

	});


