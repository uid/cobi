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
var ViewMode = function() {
    var isOn = false;

    // Initialize the view mode 
    function initialize(type){
        // If already on, do not register multiple events
        if (!ViewMode.isOn){
            ViewMode.isOn = true;
            //MoveMode.destroy();
            $(".main").addClass("view-mode");
            bindEvents();
            initDisplay(type);
        }
    }

    // Display is the bottom portion of the session display, which summarizes conflicts
    // type is the most recent moveMode operation. undefined for other cases
    function initDisplay(type){
        // default is the conflict view
        if (typeof type === "undefined"){
            $("#list-view-options li a").first().trigger("click");
        } else if (type.indexOf("chair") !== -1){
            $("#list-view-options li a").eq(2).trigger("click");
        } else {
            $("#list-view-options li a").first().trigger("click");
        }

    }

     // Add event handlers to each sidebar item
    function bindEvents(){
        $("body").on("click", ".slot", slotClickHandler);
        $("body").on("click", ".popover .button-unschedule", unscheduleHandler);
        $("body").on("click", ".popover .button-propose-scheduled", {type: "scheduled"}, proposeHandler);
        $("body").on("click", ".popover .button-propose-unscheduled", {type: "unscheduled"}, proposeHandler);
        $("body").on("click", ".popover .button-propose-empty", {type: "empty"}, proposeHandler);
        $("body").on("click", ".popover .button-lock", lockHandler);
        $("body").on("click", ".popover .button-unlock", unlockHandler);

        // paper-level operations
        $("body").on("click", ".slot-paper", paperSlotClickHandler);
        $("body").on("click", ".popover .button-paper-reorder", paperReorderHandler);
        $("body").on("click", ".popover .button-paper-unschedule", paperUnscheduleHandler);
        $("body").on("click", ".popover .button-paper-propose-scheduled", {type: "paper-scheduled"}, proposeHandler);
        $("body").on("click", ".popover .button-paper-propose-unscheduled", {type: "paper-unscheduled"}, proposeHandler);
        $("body").on("click", ".popover .button-paper-propose-empty", {type: "paper-empty"}, proposeHandler);

        // chair operations
        if (Features.chair){
            $("body").on("click", ".slot-chair", chairSlotClickHandler);
            $("body").on("click", ".popover .button-chair-unschedule", chairUnscheduleHandler); 
            $("body").on("click", ".popover .button-chair-propose-scheduled", {type: "chair-scheduled"}, proposeHandler);
            $("body").on("click", ".popover .button-chair-propose-unscheduled", {type: "chair-unscheduled"}, proposeHandler);
            $("body").on("click", ".popover .button-chair-propose-empty", {type: "chair-empty"}, proposeHandler);
        }
    }

     // Event handler for clicking an individual paper (only in the unscheduled panel)
    function paperSlotClickHandler(){
        // console.log("VM.slotpaperclick");
        // detect if the currently selected item is selected again.
        //var $selection = $(this).hasClass("unscheduled")? $("#unscheduled .selected"): $("#program .selected");
        //var $otherSelection = $(this).hasClass("unscheduled")? $("#program .selected"): $("#unscheduled .selected");

        // only one popover at a time? this allows multiple selections possible
        //$selection.removeClass("selected").popover("hide");
        var $selection = $(".selected");
        $(".selected").removeClass("selected").popover("hide");          

        // if reselected, do nothing.
        if ($selection[0] == $(this)[0])
           return;
        
        // do nothing for unavailable slots
        if ($(this).hasClass("unavailable"))
           return;

        var id = $(this).attr("id");
        var submission = allSubmissions[id];
        var submissionType = (submission.type == "paper") ? submission.subtype : submission.type;

        $(this).addClass("selected");
        $(this).popover({
          html:true,
          placement: "bottom",
          trigger: "manual",
           title:function(){
                if ($(this).hasClass("empty"))
                    return "Empty slot " 
                        + " <a class='close popover-close' data-dismiss='clickover' " 
                        + "data-date='"+$(this).attr("data-date")+"' data-time='"+$(this).attr("data-time")+"' data-room='"+$(this).attr("data-room")
                        + "' href='#''>&times;</a>";
                else
                    return "<strong>[" + submissionType + "] " + id + ". " + submission.title + "</strong>"
                        + "<a class='close popover-close' data-dismiss='clickover' data-session-id='" + id + "' href='#''>&times;</a>";
           },
           content:function(){
                if ($(this).hasClass("empty")){
                    console.log("impossible");
                    //return getSubmissionDetail("view", "empty", new slot($(this).attr("data-date"), $(this).attr("data-time"), $(this).attr("data-room"), null));
                } else if ($(this).hasClass("unscheduled")){
                    return getSubmissionDetail("view", "unscheduled", submission);
                } else{
                    console.log("impossible");
                    //return getSubmissionDetail("view", "scheduled", submission);
                }
           }
        });
        $(this).popover("show");          
    }

    function paperReorderHandler(event){
        var $session = $(".selected").first();
        var id = getID($session);  
        var $list = $(this).find("~ .list-submissions");
        $list.sortable();
        if ($(this).html() == "Reorder"){
            $(this).html("Save Order");

            $list.sortable({ cancel: ".submission-empty"});
            $list.sortable("enable").disableSelection();
            $list.attr("data-paper-order", _readPaperOrder($list).join());
            //console.log($list.attr("data-paper-order"));
            $list.find("li .reorder-icon").addClass("icon-align-justify");
        } else {
            $(this).html("Reorder");
            $list.sortable("disable").enableSelection();
            $list.find("li .reorder-icon").removeClass("icon-align-justify");

            var oldOrder = $list.attr("data-paper-order").split(",");
            var newOrder = _readPaperOrder($list);
            //console.log("Reordering: NEW", newOrder, "OLD", $list.attr("data-paper-order").split(","));
            // save only when the order changed
            if (!arraysEqual(oldOrder, newOrder)){
                // backend reorder (current session, new order, old order)
                reorderPapers(allSessions[id], newOrder, oldOrder);
                $list.attr("data-paper-order", newOrder.join());   
            }
        }
    }

    function paperUnscheduleHandler(event){
        $(this).click(false);     // avoiding multiple clicks            
        var $session = $(".selected").first();
        var id = getID($session);
        if (id === -1)
            return;

        var $paper = $(this).parent();
        var pid = $paper.attr("id");
        // console.log(id, $paper, pid, allSubmissions[pid]);
        // the backend unschedule paper
        unschedulePaper(allSessions[id], allSubmissions[pid]);
    }

    // When move is request, forward this request to MoveMode.
    // This is the only way to switch modes from ViewMode to MoveMode.
    function proposeHandler(event){  
        $(this).click(false);     // avoiding multiple clicks             
        var subId = "";
        if (event.data.type == "paper-scheduled" || event.data.type == "paper-unscheduled")
            subId = $(this).parent().attr("id");
        else if (event.data.type == "chair-scheduled" || event.data.type == "chair-unscheduled")
            subId = $(this).parent().attr("data-chair-id");
        // Don't need the actual target information because .selected detects this.
        MoveMode.initialize(event.data.type, subId);
    }

    // When the unschedule button is clicked. Move the item to the unscheduled workspace.
    function unscheduleHandler(){
        $(this).click(false);     // avoiding multiple clicks        
        var $session = $(".selected").first();
        var id = getID($session);
        if (id === -1)
            return;
        // the backend unschedule session
        unscheduleSession(allSessions[id]);  
    }


    // HQ: Handles a lock request
    function lockHandler(){
        $(this).click(false);     // avoiding multiple clicks          
        var $session = $(".selected").first();
        var id = getID($session);  
        var date, time, room; 
        if(id in allSessions){
            lockSlot(allSessions[id].date, allSessions[id].time, allSessions[id].room);
        } else {
            lockSlot($session.attr("data-date"), $session.attr("data-time"), $session.attr("data-room"));
        }
    }

    // HQ: handle an unlock request
    function unlockHandler(){
        $(this).click(false);     // avoiding multiple clicks            
        var $session = $(".selected").first();
        var id = getID($session);  
        if(id in allSessions){
            unlockSlot(allSessions[id].date, allSessions[id].time, allSessions[id].room);
        }else{
            unlockSlot($session.attr("data-date"), $session.attr("data-time"), $session.attr("data-room"));
        }
    }

     // Event handler for clicking an individual session
    function slotClickHandler(){
        // console.log("VM.slotclick");
        // detect if the currently selected item is selected again.
        //var $selection = $(this).hasClass("unscheduled")? $("#unscheduled .selected"): $("#program .selected");
        //var $otherSelection = $(this).hasClass("unscheduled")? $("#program .selected"): $("#unscheduled .selected");

        // only one popover at a time? this allows multiple selections possible
        //$selection.removeClass("selected").popover("hide");
        var $selection = $(".selected");
        $(".selected").removeClass("selected").popover("hide");          

        // if reselected, do nothing.
        if ($selection[0] == $(this)[0])
           return;
        
        // do nothing for unavailable slots
        if ($(this).hasClass("unavailable"))
           return;

        var id = getID($(this));
        var session = allSessions[id];
        $(this).addClass("selected");
        $(this).popover({
            html:true,
            placement: "bottom",
            trigger: "manual",
            title:function(){
                if ($(this).hasClass("empty"))
                    return "<strong> Empty slot </strong> " 
                        + " <a class='close popover-close' data-dismiss='clickover' " 
                        + "data-date='"+$(this).attr("data-date")+"' data-time='"+$(this).attr("data-time")+"' data-room='"+$(this).attr("data-room")
                        + "' href='#''>&times;</a>";
                else
                    return "<strong>[" + session.venue + "] " + id + ". <span contenteditable='false'>" + session.title + "</span></strong> "
                        + "<a class='close popover-close' data-dismiss='clickover' data-session-id='" + id + "' href='#''>&times;</a>"
                        + "<a class='save-button pull-right' data-session-id='" + id + "' href='#''>edit</a>";            
            },
            content:function(){
                if ($(this).hasClass("empty")){
                    return getSessionDetail("view", "empty", new slot($(this).attr("data-date"), $(this).attr("data-time"), $(this).attr("data-room"), null));
                } else if ($(this).hasClass("unscheduled")){
                    return getSessionDetail("view", "unscheduled", session);
                } else{
                    return getSessionDetail("view", "scheduled", session);
                }
            }
        });
        $(this).popover("show");          
    }



    function chairUnscheduleHandler(event){
        $(this).click(false);     // avoiding multiple clicks            
        var $session = $(".selected").first();
        var id = getID($session);
        if (id === -1)
            return;
        // console.log(id, $paper, pid, allSubmissions[pid]);
        // the backend unschedule paper
        unscheduleChair(allSessions[id], allChairs[allSessions[id].chairs]);
    }


     // Event handler for clicking an individual chair (only in the unscheduled panel)
    function chairSlotClickHandler(){
        // only one popover at a time? this allows multiple selections possible
        //$selection.removeClass("selected").popover("hide");
        var $selection = $(".selected");
        $(".selected").removeClass("selected").popover("hide");          

        // if reselected, do nothing.
        if ($selection[0] == $(this)[0])
           return;
        
        // do nothing for unavailable slots
        if ($(this).hasClass("unavailable"))
           return;

        var id = $(this).attr("data-chair-id");
        var chair = allChairs[id];
        $(this).addClass("selected");
        $(this).popover({
          html:true,
          placement: "bottom",
          trigger: "manual",
           title:function(){
                return "<strong>" + displayChairName(chair, false) + "</strong>"
                    + "<a class='close popover-close' data-dismiss='clickover' href='#''>&times;</a>";
           },
           content:function(){
                if ($(this).hasClass("empty")){
                    console.log("impossible");
                } else if ($(this).hasClass("unscheduled")){
                    return getChairDetail("view", "unscheduled", chair);
                } else{
                    console.log("impossible");
                }
           }
        });
        $(this).popover("show");          
    }

    // Reset any change created in this view mode
    function destroy(){
        ViewMode.isOn = false;

        $("body").off("click", ".slot", slotClickHandler); 
        $("body").off("click", ".popover .button-unschedule", unscheduleHandler); 
        $("body").off("click", ".popover .button-propose-scheduled", proposeHandler);
        $("body").off("click", ".popover .button-propose-unscheduled", proposeHandler);
        $("body").off("click", ".popover .button-propose-empty", proposeHandler);
        $("body").off("click", ".popover .button-lock", lockHandler);
        $("body").off("click", ".popover .button-unlock", unlockHandler);  

        $("body").off("click", ".slot-paper", paperSlotClickHandler);
        $("body").off("click", ".popover .button-paper-reorder", paperReorderHandler);  
        $("body").off("click", ".popover .button-paper-unschedule", paperUnscheduleHandler);  
        $("body").off("click", ".popover .button-paper-propose-scheduled", proposeHandler);
        $("body").off("click", ".popover .button-paper-propose-unscheduled", proposeHandler);
        $("body").off("click", ".popover .button-paper-propose-empty", proposeHandler);

        if (Features.chair){
            $("body").off("click", ".slot-chair", chairSlotClickHandler);
            $("body").off("click", ".popover .button-chair-unschedule", chairUnscheduleHandler); 
            $("body").off("click", ".popover .button-chair-propose-scheduled", proposeHandler);
            $("body").off("click", ".popover .button-chair-propose-unscheduled", proposeHandler);
            $("body").off("click", ".popover .button-chair-propose-empty", proposeHandler);            
            $(".slot-chair").popover("destroy"); 
        }

        $(".slot").popover("destroy");   
        $(".slot-paper").popover("destroy");    

        $(".main").removeClass("view-mode");    
    }

    return {
        isOn: isOn,
        initialize: initialize,
        destroy: destroy
    };
}();     