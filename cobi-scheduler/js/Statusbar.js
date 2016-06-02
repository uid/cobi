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
var Statusbar = function() {

	var $bar;
    var pendingQueue = [];

    // Initialize the view mode 
    function initialize(){
		$bar = $("#statusbar");
		display("Loading conference data... This might take up to 15-20 seconds.");
        bindEvents();
    }

    function bindEvents(){
        // $(document).on("addStatus", addStatusHandler);  
        // $(document).on("updateStatusAccepted", updateStatusHandler);      
        // $(document).on("updateStatusFailed", updateStatusHandler);  
        $(document).on("addMoveStatus", addMoveStatusHandler);
        $(document).on("addPaperMoveStatus", addPaperMoveStatusHandler);
        if (Features.chair)
            $(document).on("addChairMoveStatus", addChairMoveStatusHandler);
    }

    // Display message in the following way:
    // Display immediately if nothing is pending in the queue. After a delay, add a class that indicates removal possible. Delay of -1 indicates blocking.
    // Otherwise, queue up and wait until I become the top

    // [[ message kinds ]]
    // Delay 0, initial loading message
    // Delay 0, viewmode: default message w/ instruction
    // Delay -1, movemode: with cancel
    // Delay -1, paper movemode: with cancel
    // Delay 3, transaction from server (mine, other's)
    // Delay N/A, transaction update from server (only affects status) -- no need to take care, working at the visual level
    function process(item, delay){
        // if currently displayed item expired, remove from the queue and display the new top item. 
    }


    function updateStatus(type, t){
        // the current transaction is still displayed
        var $status = $bar.find(".status").first();
        if ($status.attr("data-local-hash") == t.localHash){
            if (type == "updateStatusAccepted")
                $status.find(".label").removeClass("label-info").addClass("label-success").html("Success");
            else if (type == "updateStatusFailed")
                $status.find(".label").removeClass("label-info").addClass("label-warning").html("Failed");
            else if (type == "moveCanceled") // You got kicked out of the move mode because server changed collided with my selection
                $status.find(".label").removeClass("label-info").addClass("label-important").html("Your Move Canceled by Someone's Change");
        }

    }


    function addStatus(t){
        // console.log("STATUS", t, MoveMode.isOn, !isTransactionMyChange(t));
        if (MoveMode.isOn) {
            // TODO: stack up messages so that once MoveMode is over, it is displayed
            return;
        }
        if (isTransactionSessionLevel(t))
            displaySessionStatus(t);
        else if (isTransactionPaperLevel(t))
            displayPaperStatus(t);
        else if (isTransactionChairLevel(t))
            displayChairStatus(t);
        else
            console.log("addStatus error");
    }

    function addStatusInterrupted(t){

    }

    // function updateStatusHandler(event, t){
    //     // the current transaction is still displayed
    //     var $status = $bar.find(".status").first();
    //     if ($status.attr("data-local-hash") == t.localHash){
    //         if (event.type == "updateStatusAccepted")
    //             $status.find(".label").removeClass("label-info").addClass("label-success").html("Success");
    //         else if (t.type == "updateStatusFailed")
    //             $status.find(".label").removeClass("label-info").addClass("label-warning").html("Failed");
    //     }
    // }

    // function addStatusHandler(event, t){
    //     console.log("STATUS", t, MoveMode.isOn, !isTransactionMyChange(t));
    //     // TODO: do something also for move mode without touching the cancel button
    //     if (MoveMode.isOn && !isTransactionMyChange(t))
    //         return;

    //     if (isTransactionSessionLevel(t))
    //         displaySessionStatus(t);
    //     else 
    //         displayPaperStatus(t);
    // }


    function addMoveStatusHandler(event, id){
        var $statusLabel = $("<span/>").addClass("label label-info").html("Scheduling session");
        var $status = $("<div/>").addClass("status").append($statusLabel).append();
        var $session = $(".selected").first();
        var $link = (typeof $session.attr("data-session-id") === "undefined") ? getCellLinkByDateTimeRoom($session.attr("data-date"), $session.attr("data-time"), $session.attr("data-room")) : getCellLinkByID($session.attr("data-session-id"));
        $status.append(" ").append($link)
            .append("&nbsp;&nbsp;&nbsp;Number: change in # of conflicts. <span class='palette recommended'>&nbsp;</span>: recommended." + MoveMode.getCancelButtonHTML());
        $bar.html($status);
    }

    function addPaperMoveStatusHandler(event, id, paperId){
        var $statusLabel = $("<span/>").addClass("label label-info").html("Scheduling submission");
        var $status = $("<div/>").addClass("status").append($statusLabel).append();
        var $session = $(".selected").first();
        var $link = getPaperCellLinkByID($session.attr("data-session-id"), paperId);
        $status.append(" ").append($link)
            .append("&nbsp;&nbsp;&nbsp;Number: change in # of conflicts. <span class='palette recommended'>&nbsp;</span>: recommended." + MoveMode.getCancelButtonHTML());
        $bar.html($status);
    }

    function addChairMoveStatusHandler(event, id, chairId){
        var $statusLabel = $("<span/>").addClass("label label-info").html("Scheduling chair");
        var $status = $("<div/>").addClass("status").append($statusLabel).append();
        var $session = $(".selected").first();
        var $link = getChairCellLinkByID($session.attr("data-session-id"), chairId);
        $status.append(" ").append($link)
            .append("&nbsp;&nbsp;&nbsp;Number: change in # of conflicts. <span class='palette recommended'>&nbsp;</span>: recommended." + MoveMode.getCancelButtonHTML());
        $bar.html($status);
    }

    function displaySessionStatus(t){
        var $link, $link2, $li;
        var $statusLabel = isTransactionMyChange(t) ? $("<span/>").addClass("label label-info").html("In progress") : $("<span/>").addClass("label label-info").html("Updated");

        var user = isTransactionMyChange(t) ? "You" : getUsernameByUID(t.uid);
        $li = $("<div/>").addClass("status").attr("data-local-hash", t.localHash).append($statusLabel).append(" " + user + " ").append($("<strong/>").wrapInner(typeDisplayList[t.type])).append(": ");

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

        $bar.html($li);
    }

    function displayPaperStatus(t){
        var $link, $link2, $li;
        var $statusLabel = isTransactionMyChange(t) ? $("<span/>").addClass("label label-info").html("In progress") : $("<span/>").addClass("label label-info").html("Updated");

        var user = isTransactionMyChange(t) ? "You" : getUsernameByUID(t.uid);
        $li = $("<div/>").addClass("status").attr("data-local-hash", t.localHash).append($statusLabel).append(" " + user + " ").append($("<strong/>").wrapInner(typeDisplayList[t.type])).append(": ");

        //console.log(t.type, t.data);
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

        $bar.html($li);        
    }

    function displayChairStatus(t){
        var $link, $link2, $li;
        var $statusLabel = isTransactionMyChange(t) ? $("<span/>").addClass("label label-info").html("In progress") : $("<span/>").addClass("label label-info").html("Updated");

        var user = isTransactionMyChange(t) ? "You" : getUsernameByUID(t.uid);
        $li = $("<div/>").addClass("status").attr("data-local-hash", t.localHash).append($statusLabel).append(" " + user + " ").append($("<strong/>").wrapInner(typeDisplayList[t.type])).append(": ");

        //console.log(t.type, t.data);
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

        $bar.html($li);        
    }

    // Display the given html with given type
    function display(html, type){
    	$bar.html(html);
    }

    function destroy(){

    }

    return {
        initialize: initialize,
        updateStatus: updateStatus,
        addStatus: addStatus,
        display: display,
        destroy: destroy
    };
}();       