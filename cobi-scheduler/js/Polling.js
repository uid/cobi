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


var Polling = function() {
    // Initialize the frontend polling management module 
    function initialize(){
        bindEvents();
    }

    // Add event handlers to each sidebar item
    function bindEvents(){
        $(document).on("userLoaded", userLoadedHandler);
    }

    function userLoadedHandler(event){
        // console.log("userLoadedHandler", allUsers, userData);
    }

    function transactionAccepted(t){
        // console.log("transactionAccepted", t);
        Statusbar.updateStatus("updateStatusAccepted", t);
        Sidebar.updateHistory("updateHistoryAccepted", t);
    }

    function transactionFailed(t){
        // console.log("transactionFailed", t);
        var rollbackTransaction = new TransactionData(t.uid, t.previousType, t.previous, t.type, t.data);
        var isInterrupted = handleTransaction(rollbackTransaction);
        Statusbar.updateStatus("updateStatusFailed", t);
        Sidebar.updateHistory("updateHistoryFailed", t);        
    }

    function transactionUpdate(t){
        // console.log("transactionUpdate", t);
        //type: event type, uid: user who made the change, data: object
        var isInterrupted = handleTransaction(t);
        // Due to delayed handling, for the delayed ones do not call this here. 
        if (t.type != "schedulePaper" && t.type != "swapPapers" && t.type != "movePaper" && t.type != "swapWithUnscheduledPaper"
            && t.type != "scheduleChair" && t.type != "swapChair" && t.type != "moveChair" && t.type != "swapWithUnscheduledChair"){
            Statusbar.addStatus(t); 
            Sidebar.addHistory(t);   
            if (isInterrupted)
                Statusbar.updateStatus("moveCanceled", t);              
        }
    }  

    // Update is delayed for paper move operations
    function delayedTransactionUpdate(t, isInterrupted){
        Statusbar.addStatus(t); 
        Sidebar.addHistory(t);   
        if (isInterrupted)
            Statusbar.updateStatus("moveCanceled", t);   
    }


    function handleTransaction(t){
        var isInterrupted = false;
        var isMyChange = isTransactionMyChange(t);

        if (t.type == "lock"){
            isInterrupted = handlePollingLock(t, isMyChange);
        } else if (t.type == "unlock"){
            isInterrupted = handlePollingUnlock(t, isMyChange);
        } else if (t.type == "unschedule"){
            isInterrupted = handlePollingUnschedule(t, isMyChange);
        } else if (t.type == "schedule"){
            isInterrupted = handlePollingSchedule(t, isMyChange);
        } else if (t.type == "swap"){
            isInterrupted = handlePollingSwap(t, isMyChange);
        } else if (t.type == "move"){
            isInterrupted = handlePollingMove(t, isMyChange);
        } else if (t.type == "swapWithUnscheduled"){
            isInterrupted = handlePollingSwapWithUnscheduled(t, isMyChange);


        } else if (t.type == "reorderPapers"){
            isInterrupted = handlePollingReorderPapers(t, isMyChange);
        } else if (t.type == "unschedulePaper"){
            isInterrupted = handlePollingUnschedulePaper(t, isMyChange);
        } else if (t.type == "schedulePaper"){
            isInterrupted = handlePollingSchedulePaper(t, isMyChange);
        } else if (t.type == "swapPapers"){ 
            isInterrupted = handlePollingSwapPaper(t, isMyChange);
        } else if (t.type == "movePaper"){
            isInterrupted = handlePollingMovePaper(t, isMyChange);
        } else if (t.type == "swapWithUnscheduledPaper"){
            isInterrupted = handlePollingSwapWithUnscheduledPaper(t, isMyChange);
        } else if (t.type == "editSessionTitle"){
            isInterrupted = handleEditSessionTitle(t, isMyChange);


        } else if (t.type == "unscheduleChair"){
            isInterrupted = handlePollingUnscheduleChair(t, isMyChange);
        } else if (t.type == "scheduleChair"){
            isInterrupted = handlePollingScheduleChair(t, isMyChange);
        } else if (t.type == "swapChair"){ 
            isInterrupted = handlePollingSwapChair(t, isMyChange);
        } else if (t.type == "moveChair"){
            isInterrupted = handlePollingMoveChair(t, isMyChange);
        } else if (t.type == "swapWithUnscheduledChair"){
            isInterrupted = handlePollingSwapWithUnscheduledChair(t, isMyChange);            

        } else 
            console.log("unsupported transaction detected");
        return isInterrupted;
    }

    function postPollingMove(isMyChange){
        updateUnscheduledCount();
        UnscheduledPanel.refreshButtons();

        if (isMyChange || !MoveMode.isOn){
            Conflicts.clearConflictDisplay();        
            // the backend conflicts update
            getAllConflicts();
            // the frontend conflicts update: the row view of conflicts.
            Conflicts.updateConflicts(true, true, "conflict"); // only sidebar
        } else {
            // the backend conflicts update
            getAllConflicts();
            // the frontend conflicts update: the row view of conflicts.
            Conflicts.updateConflicts(true, false, "conflict"); // only sidebar

        }
    }

    function highlight(isMyChange, $cell, username){      
        if (typeof $cell === "undefined" || $cell == null || $cell == "")
            return;

        if (isMyChange)
            $cell.effect("highlight", {color: "yellow"}, 7000);
        else {
            //console.log(username);
            $cell.find(".user").html(username).show();
            $cell.effect("highlight", {color: "#FFDE49"}, 7000);
            setTimeout(function(){
               $cell.find(".user").html("").hide();// or fade, css display however you'd like.
            }, 7000);            
        }
    }

/******************************
 * Session level operations
 ******************************/

    function handleEditSessionTitle(t, isMyChange){
        var isInterrupted = false;
        var id = t.data.id;
        var $cell = findCellByID(id);

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == -1 && isEqualCell($cell, $(".move-src-selected").first()))  // me: empty, server: empty
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;
        $cell.find(".title").html(t.data.title);
        highlight(isMyChange, $cell, getUsernameByUID(t.uid));
        postPollingMove(isMyChange);     
        if (isMyChange) // shouldn't do MoveMode.destroy() because it's the user's own change.
            ; //MoveMode.destroy();
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();  

        // when popover is open when a server change occurs
        if (!isMyChange)
            $(".selected").removeClass("selected").popover("hide");
        return isInterrupted;           
    }

    function handlePollingLock(t, isMyChange){
        var isInterrupted = false;
        // TODO: lock needs to get id in t.data.id
        var id = null;
        for (s in schedule[t.data.date][t.data.time][t.data.room]){
            id = s;
        }    
        // empty cells can also be locked or unlocked
        var $cell = (id == null) ? findCellByDateTimeRoom(t.data.date, t.data.time, t.data.room): findCellByID(id);
        if ($cell == null || typeof $cell === "undefined")
            return;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == -1 && isEqualCell($cell, $(".move-src-selected").first()))  // me: empty, server: empty
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        VisualOps.lock($cell);
        highlight(isMyChange, $cell, getUsernameByUID(t.uid));
        postPollingMove(isMyChange);  
        if (isMyChange)
            $(".selected").removeClass("selected").popover("hide");
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();
            
        return isInterrupted;
    }

    function handlePollingUnlock(t, isMyChange){
        var isInterrupted = false;
        // TODO: lock needs to get id in t.data.id
        var id = null;
        for (s in schedule[t.data.date][t.data.time][t.data.room]){
            id = s;
        }    
        // empty cells can also be locked or unlocked
        var $cell = (id == null) ? findCellByDateTimeRoom(t.data.date, t.data.time, t.data.room): findCellByID(id);
        if ($cell == null || typeof $cell === "undefined")
            return isInterrupted;;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (id == selectedID) // IMPOSSIBLE. me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == -1 && isEqualCell($cell, $(".move-src-selected").first()))  // IMPOSSIBLE. me: empty, server: empty
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        VisualOps.unlock($cell);
        highlight(isMyChange, $cell, getUsernameByUID(t.uid));
        postPollingMove(isMyChange);  
        if (isMyChange)
            $(".selected").removeClass("selected").popover("hide");
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();

        return isInterrupted;
    }

    function handlePollingUnschedule(t, isMyChange){
        var isInterrupted = false;
        var id = t.data.id;
        var $cell = findCellByID(id);
        if ($cell == null || typeof $cell === "undefined")
            return isInterrupted;;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == -1 && isEqualCell($cell, $(".move-src-selected").first())) // IMPOSSIBLE. me: empty, server: scheduled
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        VisualOps.unschedule(allSessions[id], t.data.date, t.data.time, t.data.room);

        highlight(isMyChange, findCellByID(id), getUsernameByUID(t.uid));
        var $oldCell = findCellByDateTimeRoom(t.data.date, t.data.time, t.data.room);
        highlight(isMyChange, $oldCell, getUsernameByUID(t.uid));

        postPollingMove(isMyChange);  
        if (isMyChange)
            $(".selected").removeClass("selected");
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();

        return isInterrupted;
    }

    function handlePollingSchedule(t, isMyChange){
        var isInterrupted = false;
        var id = t.data.id;
        var $cell = findCellByID(id);
        if ($cell == null || typeof $cell === "undefined")
         return isInterrupted;;

        var $emptySlot = findCellByDateTimeRoom(t.data.date, t.data.time, t.data.room);

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (id == selectedID) // me: unscheduled, server: unscheduled
                isInterrupted = true;
            if (selectedID == -1 && isEqualCell($emptySlot, $(".move-src-selected").first()))  // me: empty, server: empty
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        VisualOps.scheduleUnscheduled(allSessions[id], $emptySlot);

        highlight(isMyChange, findCellByID(id), getUsernameByUID(t.uid));

        postPollingMove(isMyChange);  
        if (isMyChange)
            MoveMode.destroy();    
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();

        return isInterrupted;   
    }

    function handlePollingSwap(t, isMyChange){
        var isInterrupted = false;
        var s1id = t.data.s1id;
        var s2id = t.data.s2id;
        var $s1Cell = findCellByID(s1id);
        if ($s1Cell == null || typeof $s1Cell === "undefined")
         return isInterrupted;;
        var $s2Cell = findCellByID(s2id);
        if ($s2Cell == null || typeof $s2Cell === "undefined")
         return isInterrupted;;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (s1id == selectedID || s2id == selectedID) // me: scheduled, server: s1 and s2 both scheduled
                isInterrupted = true;
            // if (selectedID == -1 && isEqualCell($emptySlot, $(".move-src-selected").first()))  // IMPOSSIBLE me: empty, server: empty
            //     isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        VisualOps.swap(allSessions[s1id], allSessions[s2id]);

        highlight(isMyChange, findCellByID(s1id), getUsernameByUID(t.uid));
        highlight(isMyChange, findCellByID(s2id), getUsernameByUID(t.uid));

        postPollingMove(isMyChange);  
        if (isMyChange)
            MoveMode.destroy();
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();

        return isInterrupted;       
    }

    function handlePollingMove(t, isMyChange){
        var isInterrupted = false;
        var id = t.data.id;
        var $cell = findCellByID(id);
        if ($cell == null || typeof $cell === "undefined")
         return isInterrupted;;

        var $oldCell = findCellByDateTimeRoom(t.data.sdate, t.data.stime, t.data.sroom);
        var $emptySlot = findCellByDateTimeRoom(t.data.tdate, t.data.ttime, t.data.troom);

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            // me: empty, server: empty
            // console.log(selectedID == -1, isEqualCell($emptySlot, $(".move-src-selected").first()), isEqualCell($oldCell, $(".move-src-selected").first()));
            if (selectedID == -1 && (isEqualCell($emptySlot, $(".move-src-selected").first()) || isEqualCell($oldCell, $(".move-src-selected").first())))  
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        VisualOps.swapWithEmpty(allSessions[id], $emptySlot, t.data.sdate, t.data.stime, t.data.sroom);

        highlight(isMyChange, findCellByID(id), getUsernameByUID(t.uid));
        highlight(isMyChange, findCellByDateTimeRoom(t.data.sdate, t.data.stime, t.data.sroom), getUsernameByUID(t.uid));
        postPollingMove(isMyChange);  
        if (isMyChange)
            MoveMode.destroy();
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();       

        return isInterrupted;   
    }

    function handlePollingSwapWithUnscheduled(t, isMyChange){
        var isInterrupted = false;
        var scheduledId = t.data.s2id;
        var unscheduledId = t.data.s1id;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (scheduledId == selectedID || unscheduledId == selectedID) // me: scheduled, server: s1 and s2 both scheduled
                isInterrupted = true;
            // if (selectedID == -1 && isEqualCell($emptySlot, $(".move-src-selected").first()))  // IMPOSSIBLE me: empty, server: empty
            //     isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        VisualOps.swapWithUnscheduled(allSessions[unscheduledId], allSessions[scheduledId]);
        highlight(isMyChange, findCellByID(scheduledId), getUsernameByUID(t.uid));
        highlight(isMyChange, findCellByID(unscheduledId), getUsernameByUID(t.uid));
        postPollingMove(isMyChange);  
        if (isMyChange)
            MoveMode.destroy();
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();  

        return isInterrupted;         
    }

/******************************
 * Paper level operations
 ******************************/

    function handlePollingReorderPapers(t, isMyChange){
        var isInterrupted = false;
        // no frontend work is necessary because it's already updated.
        
        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (t.data.id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == -1 && isEqualCell($cell, $(".move-src-selected").first())) // IMPOSSIBLE. me: empty, server: scheduled
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        // Add frontend functionality to reorder manually because server updates will be applied this way?
        // It's actually okay not to add this functionality because the frontend gets canceled anyway.
        
        highlight(isMyChange, findCellByID(t.data.id), getUsernameByUID(t.uid));
        postPollingMove(isMyChange);     

        if (isMyChange) // shouldn't do MoveMode.destroy() because it's the user's own change.
            ; //MoveMode.destroy();
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();  

        // when popover is open when a server change occurs
        if (!isMyChange)
            $(".selected").removeClass("selected").popover("hide");
        return isInterrupted;       
    }

    function handlePollingUnschedulePaper(t, isMyChange){
        var isInterrupted = false;    

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (t.data.sid == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == -1 && isEqualCell($cell, $(".move-src-selected").first())) // IMPOSSIBLE. me: empty, server: scheduled
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        PaperVisualOps.unschedule(allSubmissions[t.data.pid]);
        highlight(isMyChange, findCellByID(t.data.sid), getUsernameByUID(t.uid));
        highlight(isMyChange, $("#" + t.data.pid), getUsernameByUID(t.uid));

        postPollingMove(isMyChange);  
        if (isMyChange) // shouldn't do MoveMode.destroy() because it's the user's own change.
            ; //MoveMode.destroy();
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();      
   
        return isInterrupted;       
    }

    function handlePollingSchedulePaper(t, isMyChange){
        var isInterrupted = false;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            // console.log(selectedID, $(".move-src-selected").first().attr("id"), t.data.pid, $(".move-src-selected").first().attr("id")==t.data.pid, $(".move-src-selected").first().attr("id").length, t.data.pid.length);
            if (t.data.sid == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == "" && $(".move-src-selected").first().attr("id") == t.data.pid)  // me: unscheduled paper, server: empty
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        PaperVisualOps.scheduleUnscheduled(allSubmissions[t.data.pid], t.data.pos);
        
        highlight(isMyChange, findCellByID(t.data.sid), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.pid), getUsernameByUID(t.uid));

        setTimeout(function (){
            postPollingMove(isMyChange);  
            if (isMyChange)
                MoveMode.destroy();
            if (isInterrupted)
                MoveMode.destroy();
            delayedTransactionUpdate(t, isInterrupted);
        }, 2300); 
        return isInterrupted;            
    }

    function handlePollingSwapPaper(t, isMyChange){
        var isInterrupted = false;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (t.data.s1id == selectedID || t.data.s2id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        PaperVisualOps.swap(allSubmissions[t.data.p1id], allSubmissions[t.data.p2id]);  

        highlight(isMyChange, findCellByID(t.data.s1id), getUsernameByUID(t.uid));
        highlight(isMyChange, findCellByID(t.data.s2id), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.p1id), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.p2id), getUsernameByUID(t.uid));
        setTimeout(function (){
            postPollingMove(isMyChange);  
            if (isMyChange)
                MoveMode.destroy();
            if (isInterrupted)
                MoveMode.destroy();
            delayedTransactionUpdate(t, isInterrupted);
        }, 2300);
          
        return isInterrupted;                          
    }

    function handlePollingMovePaper(t, isMyChange){
        var isInterrupted = false;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());          
            if (t.data.s1id == selectedID || t.data.s2id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        PaperVisualOps.swapWithEmpty(allSubmissions[t.data.p1id], t.data.pos); 

        highlight(isMyChange, findCellByID(t.data.s1id), getUsernameByUID(t.uid));
        highlight(isMyChange, findCellByID(t.data.s2id), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.p1id), getUsernameByUID(t.uid));

        setTimeout(function (){
            postPollingMove(isMyChange);  
            if (isMyChange)
                MoveMode.destroy();
            if (isInterrupted)
                MoveMode.destroy();
            delayedTransactionUpdate(t, isInterrupted);
        }, 2300);
          
        return isInterrupted;  
    }

    function handlePollingSwapWithUnscheduledPaper(t, isMyChange){
        var isInterrupted = false;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());         
            if (t.data.s2id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == "" && ($(".move-src-selected").first().attr("id") == t.data.p1id || $(".move-src-selected").first().attr("id") == t.data.p2id))  // me: unscheduled paper, server: empty
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        PaperVisualOps.swapWithUnscheduled(allSubmissions[t.data.p1id], allSubmissions[t.data.p2id]); 

        highlight(isMyChange, findCellByID(t.data.s2id), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.p1id), getUsernameByUID(t.uid));
        highlight(isMyChange, $("#" + t.data.p2id), getUsernameByUID(t.uid));

        setTimeout(function (){
            postPollingMove(isMyChange);  
            if (isMyChange)
                MoveMode.destroy();
            if (isInterrupted)
                MoveMode.destroy();
            delayedTransactionUpdate(t, isInterrupted);
        }, 2300);

        return isInterrupted;  
    }


/******************************
 * Chair level operations
 ******************************/

    function handlePollingUnscheduleChair(t, isMyChange){
        var isInterrupted = false;    

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (t.data.id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == -1 && isEqualCell($cell, $(".move-src-selected").first())) // IMPOSSIBLE. me: empty, server: scheduled
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        ChairVisualOps.unschedule(allChairs[t.data.chairId]);
        highlight(isMyChange, findCellByID(t.data.id), getUsernameByUID(t.uid));
        highlight(isMyChange, $("#" + t.data.chairId), getUsernameByUID(t.uid));

        postPollingMove(isMyChange);  
        if (isMyChange) // shouldn't do MoveMode.destroy() because it's the user's own change.
            ; //MoveMode.destroy();
        if (isInterrupted) // current selection affected by the server change
            MoveMode.destroy();      
   
        return isInterrupted;       
    }

    function handlePollingScheduleChair(t, isMyChange){
        var isInterrupted = false;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            // console.log(selectedID, $(".move-src-selected").first().attr("id"), t.data.pid, $(".move-src-selected").first().attr("id")==t.data.pid, $(".move-src-selected").first().attr("id").length, t.data.pid.length);
            if (t.data.id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == "" && $(".move-src-selected").first().attr("id") == t.data.chairId)  // me: unscheduled paper, server: empty
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        ChairVisualOps.scheduleUnscheduled(allChairs[t.data.chairId]);
        
        highlight(isMyChange, findCellByID(t.data.id), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.chairId), getUsernameByUID(t.uid));

        setTimeout(function (){
            postPollingMove(isMyChange);  
            if (isMyChange)
                MoveMode.destroy();
            if (isInterrupted)
                MoveMode.destroy();
            delayedTransactionUpdate(t, isInterrupted);
        }, 2300); 
        return isInterrupted;            
    }

    function handlePollingSwapChair(t, isMyChange){
        var isInterrupted = false;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());
            if (t.data.s1id == selectedID || t.data.s2id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        ChairVisualOps.swap(allChairs[t.data.chair1Id], allChairs[t.data.chair2Id]);  

        highlight(isMyChange, findCellByID(t.data.s1id), getUsernameByUID(t.uid));
        highlight(isMyChange, findCellByID(t.data.s2id), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.chair1Id), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.chair2Id), getUsernameByUID(t.uid));
        setTimeout(function (){
            postPollingMove(isMyChange);  
            if (isMyChange)
                MoveMode.destroy();
            if (isInterrupted)
                MoveMode.destroy();
            delayedTransactionUpdate(t, isInterrupted);
        }, 2300);
          
        return isInterrupted;                          
    }

    function handlePollingMoveChair(t, isMyChange){
        var isInterrupted = false;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());          
            if (t.data.s1id == selectedID || t.data.s2id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        ChairVisualOps.swapWithEmpty(allChairs[t.data.chairId]); 

        highlight(isMyChange, findCellByID(t.data.s1id), getUsernameByUID(t.uid));
        highlight(isMyChange, findCellByID(t.data.s2id), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.chairId), getUsernameByUID(t.uid));

        setTimeout(function (){
            postPollingMove(isMyChange);  
            if (isMyChange)
                MoveMode.destroy();
            if (isInterrupted)
                MoveMode.destroy();
            delayedTransactionUpdate(t, isInterrupted);
        }, 2300);
          
        return isInterrupted;  
    }

    function handlePollingSwapWithUnscheduledChair(t, isMyChange){
        var isInterrupted = false;

        var selectedID = -1;
        if ($(".move-src-selected").first().length != 0){
            selectedID = getID($(".move-src-selected").first());         
            if (t.data.s1id == selectedID) // me: scheduled, server: scheduled
                isInterrupted = true;
            if (selectedID == "" && ($(".move-src-selected").first().attr("id") == t.data.chair1Id || $(".move-src-selected").first().attr("id") == t.data.chair2Id))  // me: unscheduled paper, server: empty
                isInterrupted = true;
        }
        isInterrupted = isInterrupted && !isMyChange && MoveMode.isOn;

        // the order is reversed from the paper-level equivalent
        ChairVisualOps.swapWithUnscheduled(allChairs[t.data.chair2Id], allChairs[t.data.chair1Id]); 

        highlight(isMyChange, findCellByID(t.data.s1id), getUsernameByUID(t.uid));
        highlight(isMyChange, $(".popover-inner #" + t.data.chair2Id), getUsernameByUID(t.uid));
        highlight(isMyChange, $("#" + t.data.chair1Id), getUsernameByUID(t.uid));

        setTimeout(function (){
            postPollingMove(isMyChange);  
            if (isMyChange)
                MoveMode.destroy();
            if (isInterrupted)
                MoveMode.destroy();
            delayedTransactionUpdate(t, isInterrupted);
        }, 2300);

        return isInterrupted;  
    }
    return {
        initialize: initialize,
        transactionUpdate: transactionUpdate,
        transactionAccepted: transactionAccepted,
        transactionFailed: transactionFailed
    };
}();
