var paths = [];
var tasks = [];
var pathIndex = 0;
var taskIndex = 0;
var running = true;

var loadTests = () => {

    $.extend($.expr[':'], {
        'containsi': function (elem, i, match, array) {
            return (elem.textContent || elem.innerText || '').toLowerCase()
                .indexOf((match[3] || "").toLowerCase()) >= 0;
        }
    });

    $(".pathList").empty();

    var data = $("#testData").val()
    data = data.replace(/\t/g, '');

    paths = [];
    tasks = [];
    pathIndex = 0;
    taskIndex = 0;

    paths = data.split("\n")
    paths = paths.filter(e => e);

    $(".pathCount").text("Path Count: " + paths.length)

    var band = true;
    paths.forEach(p => {

        var c = band ? "light" : "dark"; band = !band;
        $(".pathList").append($("<div class='listItem " + c + "'><div class='status'></div>" + p + "</div>"));

    });

    function changeScenarioStart(event, scenario) {
        console.log("getting scenario: "  + scenario.scenario);
        var $scenDiv = $("<div class='scenarioTag working'>"+ scenario.scenario +"</div>");
        $(".tasklist .working").parent().append($scenDiv);


    }
    function changeScenarioEnd(event, scenario) {
        $(".scenarioTag.working").last().removeClass("working").addClass("completed");
    }

    $(document).bind('change_scenario_start', changeScenarioStart)
    $(document).bind('change_scenario_end', changeScenarioEnd)

}

function pauseTests(){
    running=false;
}


function runTests() {
    running=true;
    $(".pathList .listItem:eq(" + pathIndex + ") .status").addClass("working");
    parseTest();

}

function parseTest() {
    $(".taskList").empty();
    tasks = [];
    var taskIndex = 0;

    tasks = JSON.parse(paths[pathIndex]);
    var band = true;
    tasks.forEach(itm => {
        var c = band ? "light" : "dark"; band = !band;
        $(".taskList").append($("<div class='listItem " + c + "'><div class='status'></div>" + itm + "&nbsp;</div>"));
    });

    window.scenario = {};

    loadChatBot();
    $(".taskList .listItem:eq(" + taskIndex + ") .status").addClass("working")
    setTimeout(function () {
        findNext();
    }, 5000);
}


function findNext() {

    if(!running){return;}

    if (!tasks[taskIndex]) {
        alert('here');
    }

    var taskCompleted = false;

    // get elements for possible interaction
    var $cbxList = $("#root").find(':checkbox:enabled');
    var $opt = $("#root").find('select:enabled option[value="' + tasks[taskIndex] + '"]');
    var $btn = $("#root").find('button:enabled:contains("' + tasks[taskIndex] + '")');
    if ($btn.length == 0) {
        $btn = $("#root").find('button:enabled:containsi("' + tasks[taskIndex] + '")') // case insensitive
    }
    var $input = $("#root").find('input:text:enabled');


    if (tasks[taskIndex].toString().indexOf("MSG: ") > -1) {
        var txt = tasks[taskIndex].split("MSG: ")[1];
        if ($("#root").find("div:contains('" + unescape(txt) + "')").length > 0) {
            console.log("found result MSG: " + unescape(txt));
            taskCompleted = true;
        }
    }
    else if ($cbxList.length > 0
        && $("#root").find(':checkbox:enabled:checked').length == 0) {
        var selected = tasks[taskIndex].split(",");
        selected.forEach((o, i) => {
            console.log("found '" + o + "' in checkbox list");
            $("#root").find(':checkbox:enabled[value="' + o + '"]').prop("checked", true);            
        });
        $cbxList.prop('disabled', true);
        taskCompleted = true;
    }
    else if ($opt.length > 0) {
        console.log("found '" + tasks[taskIndex] + "' in select");
        $opt.prop('selected', true);
        taskCompleted = true;
    }
    else if ($btn.length > 0) {
        console.log("found '" + tasks[taskIndex] + "' button");
        $btn.click()
        taskCompleted = true;
    }
    else if ($input.length > 0) {
        $input.val(tasks[taskIndex]);
        $input.prop('disabled', true);
        console.log("found input for '" + tasks[taskIndex] + "'");
        taskCompleted = true;
    }

    if(taskCompleted){
        $(".taskList .listItem:eq(" + taskIndex + ") .status").removeClass("working").addClass("completed");
        taskIndex += 1;
        if (!tasks[taskIndex]){ // done with this test
            if (taskCompleted) {
                $(".pathList .listItem:eq(" + pathIndex + ") .status").removeClass("working").addClass("completed").off()
            } else {
                $(".pathList .listItem:eq(" + pathIndex + ") .status").removeClass("working").addClass("failed").off().on('click',function(){
                    taskIndex = 0;        
                    runTests();
                    return;
                });
                return;
            }
            taskIndex = 0;
            pathIndex += 1;
            runTests();
            return;
        }    
    } else {
        $(".taskList .listItem:eq(" + taskIndex + ") .status").removeClass("working").addClass("failed");
        $(".pathList .listItem:eq(" + pathIndex + ") .status").removeClass("working").addClass("failed").off().on('click',function(){
            taskIndex = 0;        
            runTests();
            return;
        });
    }

    $(".taskList .listItem:eq(" + taskIndex + ") .status").addClass("working");    
 
    setTimeout(function () {
        
        findNext();
    }, 5000);
}