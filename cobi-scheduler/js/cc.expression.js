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
// Expression Interface for Constraints

var Expression = function() {


var conflictObjectMappingList = {};
var relationMappingList = {};
var entityList = {};
var entityMappingList = {};

    // Initialize the sidebar with a default view 
    function initialize(){
        var lists = registerLists();
        conflictObjectMappingList = lists.conflictObjectMappingList;
        relationMappingList = lists.relationMappingList;
        entityList = lists.entityList;
        entityMappingList = lists.entityMappingList;

        createShouldDisplay();
        createEntityDisplay();
        createConstraintObjectDisplay();

        $("select").chosen();     

        bindEvents();
     
    }

    function bindEvents(){
        $("body").on("click", ".save-button", saveConstraint);
    }

function registerLists(){

    // schedule-level
    var conflictObjectMappingList = {
        // date-level
        "date-is-Monday":{
            name:"date-is-Monday",
            level:"date",
            key:"date",
            comp:Comp.dateEquals,
            display:"on Monday",
            valueType:"none"
        },
        "date-is-Tuesday":{
            name:"date-is-Tuesday",
            level:"date",
            key:"date",
            comp:Comp.dateEquals,
            display:"on Tuesday",
            valueType:"none"
        },
        "date-is-Wednesday":{
            name:"date-is-Wednesday",
            level:"date",
            key:"date",
            comp:Comp.dateEquals,
            display:"on Wednesday",
            valueType:"none"
        },
        "date-is-Thursday":{
            name:"date-is-Thursday",
            level:"date",
            key:"date",
            comp:Comp.dateEquals,
            display:"on Thursday",
            valueType:"none"
        },                        
        "date-first":{
            name:"date-first",
            level:"date",
            key:"date",
            comp:Comp.dateFirst,
            display:"on the first day",
            valueType:"none"
        },
        "date-last":{
            name:"date-last",
            level:"date",
            key:"date",
            comp:Comp.dateLast,
            display:"on the last day",
            valueType:"none"
        }, 
        // time-level
        "time-is-9":{
            name:"time-is-9",
            level:"time",
            key:"time",
            comp:Comp.timeEquals,
            display:"in the 9:00-10:20 session",
            valueType:"none"
        },
        "time-is-11":{
            name:"time-is-11",
            level:"time",
            key:"time",
            comp:Comp.timeEquals,
            display:"in the 11:00-12:20 session",
            valueType:"none"
        },
        "time-is-14":{
            name:"time-is-14",
            level:"time",
            key:"time",
            comp:Comp.timeEquals,
            display:"in the 14:00-15:20 session",
            valueType:"none"
        },
        "time-is-16":{
            name:"time-is-16",
            level:"time",
            key:"time",
            comp:Comp.timeEquals,
            display:"in the 16:00-17:20 session",
            valueType:"none"
        },                        
        "time-morning":{
            name:"time-morning",
            level:"time",
            key:"time",
            comp:Comp.timeMorning,
            display:"in the morning session",
            valueType:"none"
        },
        "time-afternoon":{
            name:"time-afternoon",
            level:"time",
            key:"time",
            comp:Comp.timeAfternoon,
            display:"in the afternoon session",
            valueType:"none"
        },                       
        // room-level
        // "room-is":{
        //     name:"room-is",
        //     level:"room",
        //     key:"room",
        //     comp:Comp.stringEquals,
        //     display:"assigned room # ...",
        //     valueType:"select",
        //     values:roomList // TODO: should be a plain array
        // },      
        "room-lower-floor":{
            name:"room-lower-floor",
            level:"room",
            key:"room",
            comp:Comp.roomLowerFloor,
            display:"assigned a second floor room",
            valueType:"none"
        },    
        "room-upper-floor":{
            name:"room-upper-floor",
            level:"room",
            key:"room",
            comp:Comp.roomUpperFloor,
            display:"assigned a third floor room",
            valueType:"none"
        },    
        "room-type-is":{
            name:"room-type-is",
            level:"room",
            key:"room",
            comp:Comp.stringEquals,
            display:"assigned a room whose type is ...",
            valueType:"select",
            values:roomTypeList
        },                
        "room-size-small":{
            name:"room-size-small",
            level:"room",
            key:"room",
            comp:Comp.roomSizeSmall,
            display:"assigned a small-sized room",
            valueType:"none"
        },      
        "room-size-medium":{
            name:"room-is",
            level:"room",
            key:"room",
            comp:Comp.roomSizeMedium,
            display:"assigned a medium-sized room",
            valueType:"none"
        },     
        "room-size-large":{
            name:"room-size-large",
            level:"room",
            key:"room",
            comp:Comp.roomSizeLarge,
            display:"assigned a large-sized room",
            valueType:"none"
        },                                                          
    };

    // describing the relationship between two entities
    var relationMappingList = {
        // TODO: before, after, opposing
    };

    var entityList = {
        "session":{
            name:"session",
            level:"session",
            display:"All sessions"
        },
        "submission":{
            name:"submission",
            level:"submission",
            display:"All submissions"
        },
        "author":{
            name:"author",
            level:"author",
            display:"All authors"
        },
        "my-session":{
            name:"my-session",
            level:"my",
            display:"My session"
        },
        "my-submission":{
            name:"my-submission",
            level:"my",
            display:"My submission"
        },
        "my-author":{
            name:"my-author",
            level:"my",
            display:"I"
        },
    }

    var entityMappingList = {
        // session-level
        "session-has-award":{
            name:"session-has-award",
            level:"session",
            key:"hasAward",
            comp:Comp.booleanEquals,
            display:"that include best papers",
            valueType:"none"
        },
        "session-has-honorable-mention":{
            name:"session-has-honorable-mention",
            level:"session",
            key:"hasHonorableMention",
            comp:Comp.booleanEquals,
            display:"that include honorable mention papers",
            valueType:"none"
        },
        // TODO: submission length

        "session-title-is":{
            name:"session-title-is",
            level:"session",
            key:"title",
            comp:Comp.stringEquals,
            display:"whose title is ...",
            valueType:"text"
        },
        "session-title-contains":{
            name:"session-title-contains",
            level:"session",
            key:"title",
            comp:Comp.stringContains,
            display:"whose title contains ...",
            valueType:"text"
        },
        "session-title-starts-with":{
            name:"session-title-starts-with",
            level:"session",
            key:"title",
            comp:Comp.stringStartsWith,
            display:"whose title starts with ...",
            valueType:"text"
        },                
        "session-persona-is":{
            name:"session-persona-is",
            level:"session",
            key:"persona",
            comp:Comp.stringEquals,
            display:"whose persona is ...",
            valueType:"select",
            values:personaList
        },
        "session-community-is":{
            name:"session-community-is",
            level:"session",
            key:"persona",
            comp:Comp.stringEquals,
            display:"whose community is ...",
            valueType:"select",
            values:communityList
        },        
        "session-venue-is":{
            name:"session-venue-is",
            level:"session",
            key:"venue",
            comp:Comp.stringEquals,
            display:"whose type is ...",
            valueType:"select",
            values:sessionTypeList
        },        
        "session-venue-is-regular":{
            name:"session-venue-is-regular",
            level:"session",
            key:"venue",
            comp:Comp.sessionTypeRegular,
            display:"that contain papers and notes",
            valueType:"none"
        }, 
        "session-venue-is-special":{
            name:"session-venue-is-special",
            level:"session",
            key:"venue",
            comp:Comp.sessionTypeSpecial,
            display:"that are non-paper sessions (course, panel, SIG, ...)",
            valueType:"none"
        }, 
        "session-duration-full":{
            name:"session-duration-full",
            level:"session",
            key:"duration",
            comp:Comp.numEquals,
            display:"that are fully scheduled",
            valueType:"none"
        },   
        "session-duration-over":{
            name:"session-duration-over",
            level:"session",
            key:"duration",
            comp:Comp.numGreaterThan,
            display:"that are over-scheduled",
            valueType:"none"
        }, 
        "session-duration-under":{
            name:"session-duration-under",
            level:"session",
            key:"duration",
            comp:Comp.numLessThan,
            display:"that are under-scheduled",
            valueType:"none"
        },      

        // Submission-level
        "submission-abstract-contains":{
            name:"submission-abstract-contains",
            level:"submission",
            key:"abstract",
            comp:Comp.stringContains,
            display:"whose abstract contains ...",
            valueType:"text"
        },  
        // TODO: author length (==, >, <)
        "submission-has-best-paper-award":{
            name:"submission-has-best-paper-award",
            level:"submission",
            key:"bestPaperAward",
            comp:Comp.booleanEquals,
            display:"that are awarded best paper",
            valueType:"none"
        },  
        "submission-has-honorable-mention":{
            name:"submission-has-honorable-mention",
            level:"submission",
            key:"bestPaperNominee",
            comp:Comp.booleanEquals,
            display:"that are awarded honorable mention",
            valueType:"none"
        },  
        "submission-candb-contains":{
            name:"submission-candb-contains",
            level:"submission",
            key:"cAndB",
            comp:Comp.stringContains,
            display:"whose contributions and benefits statement contains ...",
            valueType:"text"
        },  
        "submission-core-communities-is":{
            name:"submission-core-communities-is",
            level:"submission",
            key:"coreCommunities",
            comp:Comp.stringEquals,
            display:"whose core community is ...",
            valueType:"select",
            values:communityList
        },  
        "submission-featured-communities-is":{
            name:"submission-featured-communities-is",
            level:"submission",
            key:"coreCommunities",
            comp:Comp.stringEquals,
            display:"whose featured community is ...",
            valueType:"select",
            values:communityList
        },          
        "submission-keyword-contains":{
            name:"submission-keyword-contains",
            level:"submission",
            key:"keywords",
            comp:Comp.stringContains,
            display:"whose keyword contains ...",
            valueType:"text"
        },   
        "submission-type-is":{
            name:"submission-type-is",
            level:"submission",
            key:"type",
            comp:Comp.stringEquals,
            display:"whose type is ...",
            valueType:"select",
            values:submissionTypeList
        },        
        "submission-type-is-regular":{
            name:"submission-type-is-regular",
            level:"submission",
            key:"type",
            comp:Comp.submissionTypeRegular,
            display:"that are papers and notes",
            valueType:"none"
        }, 
        "submission-type-is-special":{
            name:"submission-type-is-special",
            level:"submission",
            key:"type",
            comp:Comp.submissionTypeSpecial,
            display:"that are non-paper submissions (course, panel, SIG, ...)",
            valueType:"none"
        }, 
        "submission-title-is":{
            name:"submission-title-is",
            level:"submission",
            key:"title",
            comp:Comp.stringEquals,
            display:"whose title is ...",
            valueType:"text"
        },           
        "submission-title-contains":{
            name:"submission-title-contains",
            level:"submission",
            key:"title",
            comp:Comp.stringContains,
            display:"whose title contains ...",
            valueType:"text"
        },  
        "submission-title-starts-with":{
            name:"submission-title-starts-with",
            level:"submission",
            key:"title",
            comp:Comp.stringStartsWith,
            display:"whose title starts with ...",
            valueType:"text"
        },            
        "submission-order-is":{
            name:"submission-order-is",
            level:"submission",
            key:"order",
            comp:Comp.numEquals,
            display:"whose presentation order is ...",
            valueType:"select",
            values:submissionOrderList
        },    
        "submission-order-first":{
            name:"submission-order-first",
            level:"submission",
            key:"order",
            comp:Comp.orderFirst,
            display:"that are the first presentation in the session",
            valueType:"none"
        },   
        "submission-order-last":{
            name:"submission-order-last",
            level:"submission",
            key:"order",
            comp:Comp.orderLast,
            display:"that are the last presentation in the session",
            valueType:"none"
        },   
        // TODO: before and after

        // author-level
        // TODO: first or last name?
        "author-name-is":{
            name:"author-name-is",
            level:"author",
            key:"name",
            comp:Comp.stringEquals,
            display:"whose name is ...",
            valueType:"text"
        },
        "author-name-contains":{
            name:"author-name-contains",
            level:"author",
            key:"name",
            comp:Comp.stringContains,
            display:"whose name contains ...",
            valueType:"text"
        },
        "author-name-starts-with":{
            name:"author-name-starts-with",
            level:"author",
            key:"name",
            comp:Comp.stringStartsWith,
            display:"whose name starts with ...",
            valueType:"text"
        },  
        "author-role-is":{
            name:"author-role-is",
            level:"author",
            key:"role",
            comp:Comp.stringEquals,
            display:"whose role is ...",
            valueType:"select",
            values:authorRoleList
        },         
        "author-role-is-presenter":{
            name:"author-role-is-presenter",
            level:"author",
            key:"role",
            comp:Comp.stringEquals,
            display:"who are presenters",
            valueType:"none"
        },  
        "author-role-is-backup-presenter":{
            name:"author-role-is-backup-presenter",
            level:"author",
            key:"role",
            comp:Comp.stringEquals,
            display:"who are backup presenters",
            valueType:"none"
        },         
        "author-affiliation-is":{
            name:"author-affiliation-is",
            level:"author",
            key:"affiliation",
            comp:Comp.stringEquals,
            display:"whose affiliation is ...",
            valueType:"text"
        },
        "author-affiliation-contains":{
            name:"author-affiliation-contains",
            level:"author",
            key:"affiliation",
            comp:Comp.stringContains,
            display:"whose affiliation contains ...",
            valueType:"text"
        },
        "author-affiliation-starts-with":{
            name:"author-affiliation-starts-with",
            level:"author",
            key:"affiliation",
            comp:Comp.stringStartsWith,
            display:"whose affiliation starts with ...",
            valueType:"text"
        },                                                                 
    };
    console.log(entityMappingList);

    return {
        conflictObjectMappingList: conflictObjectMappingList,
        relationMappingList: relationMappingList,
        entityList: entityList,
        entityMappingList: entityMappingList
    };
}


// based on the enabled display components, detect constraint type
function detectConstraintType(){
    return "singleEntity";
}

// organize and send to the backend to create a constraint 
function saveConstraint(event){
    console.log(checkSingleConflicts(example));
    // console.log(checkPairConflicts(example2));
    // console.log(checkFilteredPairConflicts(example3));    
    console.log("saving a constraint");
    var $expression = $(this).closest(".expression");

    // entity
    if ($expression.find(".entity-begin").length > 0){
        console.log("- entity-begin detected");
        // type and all conditions
        var $entity = $expression.find(".entity-begin");
        var level = $entity.find(".type .dropdown option:selected").val();
        $expression.find(".cond").each(function(index, cond){
            var key = $(cond).find(".cond-property .dropdown option:selected").val();
            var val = $(cond).find(".cond-value").val();
            //entityMappingList[key]
            console.log("-- saving a condition", entityMappingList[key]);
        });
    }

    if ($expression.find(".constraints-object").length > 0){
        console.log("- constraints-object detected");
    }

    // likewise for relations, filters, entity-end

    // now create a constraint 

    var cType = detectConstraintType();
    if (cType == "singleEntity"){
        var c = new SingleEntityConstraint("don11", 
            "Submissions whose title begin with 'Don' should be at 11am",
            10,
            "because it's my favorite time and I am a don",
            [new Rule('submission', 
               function(x){ 
                   return x.title.indexOf("Don") != -1
               }),
            ],
            [new Rule('session',
               function (x){
                   return x.time == '11:00-12:20'
               }),
            new Rule('session',
               function(x){ // assume a session, a submission, or an author
                   return x.date != "Monday"
               })]);
    }
    // all done, so add to the list of existing constraints and initialize expression
    // $(".expression").html("");
}

function createShouldDisplay(){
    var $unit = $(".expression .should");
    var $dropdown = $("<select/>").addClass("dropdown span12");
    $("<option/>").val("should").html("should be").appendTo($dropdown);
    $("<option/>").val("should-not").html("should NOT be").appendTo($dropdown);
    $dropdown.appendTo($unit);
}


function createEntityDisplay(){

    // when entity type updates
    $("body").on("change", ".expression .entity-begin .type .dropdown", function(){
        var $entity = $(this).closest(".entity-begin");
        console.log("selected", $(this).val());
        $entity.find(".cond").remove();
        if ($(this).val().indexOf("my") === 0) // personal context, no condition added
            $entity.find(".plus-button").hide();
        else {
            $entity.find(".plus-button").show();
            $entity.find(".plus-button").trigger("click");
        }
        return false;
    });

    // when plus button for entity condition clicked
    $("body").on("click", ".expression .entity-begin .type .plus-button", function(){
        var $entity = $(this).closest(".entity-begin");
        var selectedEntity = $entity.find(".type .dropdown option:selected").val();

        var $cond = $("<div/>").addClass("cond").appendTo($entity);
        console.log("adding a condition");
        $cond.append("<div class='cond-property'/><div class='cond-value'/><span class='close-button icon-remove'/>");
        $cond.find(".cond-property").append("<select class='dropdown'/>");
        var $dropdown = $cond.find(".cond-property .dropdown");

        $.each(entityMappingList, function(index, mapping){
            if (mapping.level == selectedEntity)
                $("<option/>").val(mapping.name).html(mapping.display).appendTo($dropdown);
        });    
        $dropdown.chosen();
        $dropdown.trigger("change");
        return false;
    });

    // when entity property updates
    $("body").on("change", ".expression .entity-begin .cond .cond-property .dropdown", function(){
        console.log($(this), "dropdown changed");
        var $cond = $(this).closest(".cond");
        var selectedCond = $(this).find("option:selected").val();     
        $cond.find(".cond-value").html("");
        console.log(selectedCond, entityMappingList[selectedCond]);
        if (entityMappingList[selectedCond].valueType == "text"){
            $("<input/>").attr("type", "text").attr("placeholder", "type value")
                .appendTo($cond.find(".cond-value"));
        } else if (entityMappingList[selectedCond].valueType == "select"){
            var $dropdown = $("<select/>").addClass("dropdown");
            $.each(entityMappingList[selectedCond].values, function(i,v){
                $("<option/>").val(i).html(v).appendTo($dropdown);
            });
            $dropdown.appendTo($cond.find(".cond-value"));
            $dropdown.chosen();
        }
        return false;
    });

    // closing a condition
    $("body").on("click", ".expression .entity-begin .cond .close-button", function(){
        var $cond = $(this).closest(".cond");
        $cond.remove();
        return false;
    });


    // create an entity list
    var $unit = $(".expression .entity-begin");
    $("<div/>").addClass("type").append("<select class='dropdown'/><i class='icon-plus plus-button'/>").appendTo($unit);
    $.each(entityList, function(index, entity){
        $("<option/>").val(index).html(entity.display).appendTo($unit.find(".dropdown"));
    });
    $unit.find(".type .dropdown").trigger("change");

}

function createConstraintObjectDisplay(){

    // create an entity list
    var $unit = $(".expression .constraints-object");
    // $("<div/>").addClass("type").append("<select class='dropdown'/><i class='icon-plus plus-button'/>").appendTo($unit);
    var $cond = $("<div/>").addClass("cond").appendTo($unit);
    $cond.append("<div class='cond-property'/><div class='cond-value'/>");
    $cond.find(".cond-property").append("<select class='dropdown'/>")
    $cond.find(".cond-value").html("");

    $.each(conflictObjectMappingList, function(index, entity){
        $("<option/>").val(index).html(entity.display).appendTo($unit.find(".cond-property .dropdown"));
    });
    $unit.find(".cond-property .dropdown").trigger("change");

    // when entity type updates
    $("body").on("change", ".expression .constraints-object .cond-property .dropdown", function(){
        console.log($(this), "dropdown changed");
        var $cond = $(this).closest(".cond");
        var selectedCond = $(this).find("option:selected").val();     
        $cond.find(".cond-value").html("");
        console.log(selectedCond, conflictObjectMappingList[selectedCond]);
        if (conflictObjectMappingList[selectedCond].valueType == "text"){
            $("<input/>").attr("type", "text").attr("placeholder", "type value")
                .appendTo($cond.find(".cond-value"));
        } else if (conflictObjectMappingList[selectedCond].valueType == "select"){
            var $dropdown = $("<select/>").addClass("dropdown");
            $.each(conflictObjectMappingList[selectedCond].values, function(i,v){
                console.log(i,v);
                $("<option/>").val(i).html(v).appendTo($dropdown);
            });
            $dropdown.appendTo($cond.find(".cond-value"));
            $dropdown.chosen();
        }
        return false;
    });

    // // when plus button for entity condition clicked
    // $("body").on("click", ".expression .constraints-object .type .plus-button", function(){
    //     var $entity = $(this).closest(".constraints-object");
    //     var selectedEntity = $entity.find(".type .dropdown option:selected").val();

    //     var $cond = $("<div/>").addClass("cond").appendTo($entity);
    //     $cond.append("<div class='cond-property'/><div class='cond-value'/><span class='close-button icon-remove'/>");
    //     // $cond.find(".cond-property").append("<select class='dropdown'/>");
    //     // var $dropdown = $cond.find(".cond-property .dropdown");

    //     // $.each(entityMappingList, function(index, mapping){
    //     //     if (mapping.level == selectedEntity)
    //     //         $("<option/>").val(mapping.name).html(mapping.display).appendTo($dropdown);
    //     // });    
    //     // $dropdown.trigger("change");

    //     $cond.find(".cond-value").html("");
    //     console.log(selectedEntity, conflictObjectMappingList[selectedEntity]);
    //     if (conflictObjectMappingList[selectedEntity].valueType)
    //         $("<input/>").attr("type", "text").attr("placeholder", "type value")
    //             .appendTo($cond.find(".cond-value"));
    // });

    // // when entity property updates
    // $("body").on("change", ".expression .constraints-object .cond .cond-property .dropdown", function(){
    //     console.log($(this), "dropdown changed");
    //     var $cond = $(this).closest(".cond");
    //     var selectedCond = $(this).find("option:selected").val();     
    //     $cond.find(".cond-value").html("");
    //     console.log(selectedCond, entityMappingList[selectedCond]);
    //     if (entityMappingList[selectedCond].valueType)
    //         $("<input/>").attr("type", "text").attr("placeholder", "type value")
    //             .appendTo($cond.find(".cond-value"));

    // });

    // closing a condition
    $("body").on("click", ".expression .constraints-object .cond .close-button", function(){
        var $cond = $(this).closest(".cond");
        $cond.remove();
        return false;
    });

}

    function destroy(){
        // off all event handlers

    }


    return {
        initialize: initialize       
    };
}();       


