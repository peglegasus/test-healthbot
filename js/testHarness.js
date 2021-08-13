var paths = [];
var tasks = [];
var pathIndex = 0;
var taskIndex = 0;

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
    paths = data.split("\n")
    paths = paths.filter(e => e);

    $(".pathCount").text("Path Count: " + paths.length)

    var band = true;
    paths.forEach(p => {
        
            var c = band ? "light" : "dark"; band = !band;
            $(".pathList").append($("<div class='listItem " + c + "'><div class='status'></div>" + p + "</div>"));
        
    });

}

function runTests() {

    //$(".listItem").removeClass("selected");
    //$(".listItem:eq(0)").addClass("selected");
    $(".pathList .listItem:eq("+ pathIndex +") .status").css("background-color","orange")
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
    $(".taskList .listItem:eq("+ taskIndex +") .status").css("background-color","orange")
    setTimeout(function () {
        findNext();
    }, 5000);
}


function findNext() {

    var $cbxList = $("#root").find(':checkbox:enabled');
    var $opt = $("#root").find('select:enabled option[value="' + tasks[taskIndex] + '"]');

    var $btn = $("#root").find('button:enabled:contains("' + tasks[taskIndex] + '")');
    if($btn.length==0){
        $btn = $("#root").find('button:enabled:containsi("' + tasks[taskIndex] + '")') // case insensitive
    }
    
    var $input = $("#root").find('input:enabled');   

    if (tasks[taskIndex].toString().indexOf("MSG: ") > -1) {
        var txt = tasks[taskIndex].split("MSG: ")[1];
        if ($("#root").find("div:contains('" + unescape(txt) + "')").length > 0) {
            console.log("found result MSG: " + unescape(txt));            
        }
    }
    else if ($cbxList.length > 0
        && $("#root").find(':checkbox:enabled:checked').length == 0) {
        var selected = tasks[taskIndex].split(",");
        selected.forEach((o, i) => {
            console.log("found '" + o + "' in checkbox list");
            $("#root").find(':checkbox:enabled[value="' + o + '"]').prop("checked", true);
        });
    }
    else if ($opt.length > 0) {
        console.log("found '" + tasks[taskIndex] + "' in select");
        $opt.prop('selected', true);
    }
    else if ($btn.length > 0) {
        console.log("found '" + tasks[taskIndex] + "' button");
        $btn.click()
    }
    else if ($input.length > 0) {
        $input.val(tasks[taskIndex]);
        $input.prop('disabled', true);
        console.log("found input for '" + tasks[taskIndex] + "'");
    }
    else {
        if (taskIndex >= tasks.length - 1) {
            taskIndex = 0;
            tasks = [];

            $(".pathList .listItem:eq("+ pathIndex +") .status").css("background-color","green")
            pathIndex += 1;
            runTests();
            return;
        }
    }

    $(".taskList .listItem:eq("+ taskIndex +") .status").css("background-color","green")

    taskIndex += 1;
    $(".taskList .listItem:eq("+ taskIndex +") .status").css("background-color","orange")
    setTimeout(function () {
        findNext();
    }, 5000);
}