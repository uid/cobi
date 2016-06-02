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
var Searchbox = function() {

// $(".searchbox .select2-choice").click(function(){
//     $(".searchbox abbr").trigger("click");
// });


    // Initialize the search box functionality
    function initialize(){
        $("#searchbox").select2({
            width: "copy",
            containerCssClass: "searchbox",
            placeholder: "search by session / paper / author name",
            minimumInputLength: 2,
            allowClear: true,
            dropdownCssClass: "dropdown-item",
            query: function (query) {
                var q = query.term.toLowerCase();
                var data = search(q);
                query.callback(data);
            }
            //formatSelection: format
            //formatResult: format
        });

        $(window).scroll(function() {
            $(".select2-container.select2-dropdown-open").not($(this)).select2('positionDropdown');
        });
        
        $("#searchbox").on("change", function(e){
            var id = e.val;
            //console.log(JSON.stringify({val:e.val, added:e.added, removed:e.removed}));
            if (id == "")
                return;
            var $cell = findCellByID(id);
            // not a session, so a submission
            if ($cell.length == 0) {
                // something wrong, so just return
                if (typeof allSubmissions[id] === "undefined")
                    return;
                else {
                    // unscheduled paper
                    if (allSubmissions[id].session == "null"){
                        $cell = $("#" + id);
                    } else{
                        $cell = findCellByID(allSubmissions[id].session);
                    }
                }
                    
            }
            $("body").animate({
                scrollTop:$cell.offset().top - 100
            }, 500);   
            $cell.effect("highlight", {color: "#aec7e8"}, 3000);          
            // highlight already issued, so empty the value so that multiple runs for the same search still highlights.
            $("#searchbox").val("");
        });
    }

    // t: string to compare against, q: query string
    function runDist(t, q) {
        var len = q.length;
        var threshold = len > 3 ? Math.min(len-3, 2) : 0;
        var curDist = 10000;
        var curIndex = -1;
        var success = false;
        for (var i=0; i<t.length-len+1; i++){
            var dist = StringDist.levenshtein(t.substr(i, len), q);
            if (dist <= threshold && curDist > dist){
                success = true;
                curDist = dist;
                curIndex = i;
            }
        }                
        return {
            success: success, 
            index: curIndex,
            dist: curDist};
    }

    function sortByDist(a, b){
        return (a.dist - b.dist);
    }

    // Perform search, using a modified version of fuse.js, not fuse.min.js
    function search(q) {
        var data = {results: []};
        var sessionData = {text: "Sessions", children:[]};
        var submissionData = {text: "Submissions", children:[]};
        var result = {};


        $.each(allSessions, function(index, session){
            var isMatch = false;
            //console.log(session.id, session.title);
            var t = session.title.toLowerCase();
            result = runDist(t,q);

            // id matching
            var id = session.id.toLowerCase();
            var index = id.indexOf(q);

            if (index !== -1)                
                sessionData.children.push({id: session.id, text: id + " " + session.title, authors: "", match: "id", index: index, dist: 0, q:q});  
            else if (result.success)
                sessionData.children.push({id: session.id, text: id + " " + session.title, authors: "", match: "title", index: result.index, dist: result.dist, q:q});  
            
        });
        $.each(allSubmissions, function(index, submission){
            var isMatch = false;
            var t = submission.title.toLowerCase();
            var authors = displayAuthors(submission.authors); //.replace(/,/g,'');
            result = runDist(t, q);
            var text = "<strong>" + submission.title + "</strong><br>" + authors;
            

            // id matching
            var id = submission.id.toLowerCase();
            var index = id.indexOf(q);

            if (index !== -1)                
                sessionData.children.push({id: submission.id, text: id + " " + text, authors: authors, match: "id", index: index, dist: 0, q:q});  
            else if (result.success)
                submissionData.children.push({id: submission.id, text: id + " " + text, authors: authors, match: "title", index: result.index, dist: result.dist, q:q});  
            result = runDist(authors.toLowerCase(), q);
            if (result.success)
                submissionData.children.push({id: submission.id, text: id + " " + text, authors: authors, match: "authors", index: result.index, dist: result.dist, q:q});  
            
            //console.log(submission.id, authors, submission.title);
            
            sessionData.children.sort(sortByDist);
            submissionData.children.sort(sortByDist);
            
        });
        // console.log(sessionData, submissionData);

/*    
        // exact match    
        $.each(allSessions, function(index, session){
            //console.log(session.id, session.title);
            if (session.title.toLowerCase().indexOf(q) != -1)
                sessionData.children.push({id: session.id, text: session.title});  
        });
        $.each(allSubmissions, function(index, submission){

            var authors = displayAuthors(submission.authors).toLowerCase(); //.replace(/,/g,'');
            //console.log(submission.id, authors, submission.title);
            if (submission.title.toLowerCase().indexOf(q) != -1)
                submissionData.children.push({id: submission.id, text: submission.title, authors: authors});              
            if (authors.toLowerCase().indexOf(q) != -1)
                submissionData.children.push({id: submission.id, text: submission.title, authors: authors});  
        });
        //console.log(sessionData, submissionData);
*/        
/*
        // fuzzy query match
        var options = {
          keys: ["title"],   
          id: "id",          
          threshold: "0.2"
        }
        var f = new Fuse(allSessions, options);
        var result = f.search(q); 
        // console.log("FUSE", q, result);
        for (id in result) {
            sessionData.children.push({id: result[id], text: allSessions[result[id]].title});  
        }


        // construct objects to be inserted for submissions. flattening author information out to the front so that it's searchable
        var submissions = {};
        $.each(allSubmissions, function(index, submission){
            // strip commas
            var authors = displayAuthors(submission.authors).replace(/,/g,'');
            var s = {
                id: submission.id, 
                title: submission.title, 
                authors: authors
            };
            submissions[submission.id] = s;
        });
        console.log(submissions);
        options = {
            keys: ["authors"],
            id: "id",
            threshold: "0.2"
        }        
        f = new Fuse(submissions, options);
        result = f.search(q);
        // console.log("FUSE2", q, result);


        for (id in result) {
            submissionData.children.push({id: result[id], text: submissions[result[id]].title, authors: submissions[result[id]].authors});   
        }
*/            
        data.results.push(sessionData);
        data.results.push(submissionData);
        return data;
    }

    // function addSpan(item){
    //     var src = (item.match == "title") ? item.text : item.authors;
    //     console.log(src, item);
    //     var text = src.slice(0, item.index) 
    //         + "<span style='text-decoration: underline;'>"
    //         + src.slice(item.index, item.index+item.q.len) 
    //         + "</span>" 
    //         + src.slice(item.index+item.q.len);

    //     return text;
    // }

    // function format(item) { 
    //     console.log(item);
    //     if (typeof allSubmissions[item.id] === "undefined")
    //         return "<strong>" + addSpan(item) + "</strong>"; 
    //     else {
    //         if (item.match == "title")
    //             return "<strong>" + addSpan(item) + "</strong><br>" + item.authors;
    //         else
    //             return "<strong>" + item.text + "</strong><br>" + addSpan(item);
    //     }
    // }

    function destroy(){

    }

    return {
        initialize: initialize,
        destroy: destroy
    };
}();       