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
     var allRooms = [];

     function keys(obj){
       var keys = [];

       for(var key in obj){
		   if(obj.hasOwnProperty(key)){
		       keys.push(key);
		   }
       }
       return keys;
     }

     function getAllRooms(){
          var rooms = {};
          var index = 0;
          for(var day in sessions){
               for(var time in sessions[day]){
                for(var room in sessions[day][time]){
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

    $(document).ready(function() {

        $("body").addClass("loading"); 
        // Statusbar.initialize(); 
         
        // triggered once initialize is complete
        // initialize() is async, thus the bind
        $(document).bind("fullyLoaded", function(){
            Comp.initialize();

            CCOps.initialize();
            Expression.initialize();

            $(".user-display").append("<span class='icon-user icon-white'/>").append(getUsernameByUID(userData.id));
            // Statusbar.display("Select a session for scheduling options and more information.");
            $("body").removeClass("loading");             
        });
        initialize();
	});
