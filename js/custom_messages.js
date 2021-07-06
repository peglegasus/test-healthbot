/********** 
Add a custom message that will clinical disposition outcome that are displayed to the user.
Set the value to a static string or build it dynamically based on user responses. 
 
scenario.custom_message = "My Healthcare Organizations Custom Message";

You can choose to display the message from the wrapping scenario 
by setting show_core_message to false in the wrapping scenario.
**********/ 


//Swapping out testing message for International testing message if outside the US


scenario.show_message27 = true
scenario.show_message = scenario.scenarioArgs.show_core_message
scenario.custom_message = scenario.scenarioArgs.custom_outcome_message || ""
scenario.country = scenario.scenarioArgs.country || 0

if(scenario.scenarioArgs.outsideUS === 1)
{
    scenario.messages.t2 = ""
    scenario.messages.t3 = ""
    scenario.messages.t4 = ""
    scenario.messages.t5 = ""
    scenario.messages.t6 = ""
    scenario.messages.msg27 = ""
    scenario.messages.msg27_addnl = ""
    scenario.messages.msg28 = ""
    scenario.messages.msg29 = ""
    scenario.messages.msg30 = ""
    scenario.messages.msg31 = ""
    scenario.custom_message = ""
    scenario.show_message27 = false
}

// Add custom message to scenario outcomes
/*scenario.messages.msg0 += scenario.custom_message
scenario.messages.msg1 += scenario.custom_message
scenario.messages.msg5 += scenario.custom_message
scenario.messages.msg7 += scenario.custom_message
scenario.messages.msg8 += scenario.custom_message
scenario.messages.msg9 += scenario.custom_message
scenario.messages.msg9a += scenario.custom_message
scenario.messages.msg10 += scenario.custom_message
scenario.messages.msg15 += scenario.custom_message
scenario.messages.msg17 += scenario.custom_message
scenario.messages.msg18 += scenario.custom_message
scenario.messages.msg23 += scenario.custom_message
scenario.messages.msg25 += scenario.custom_message
scenario.messages.msg26 += scenario.custom_message 
*/
scenario.messages.endcap += scenario.custom_message
