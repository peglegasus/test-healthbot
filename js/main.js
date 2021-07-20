'use strict';

$(document).ready(() => {

	// The root element we will put most of our magic in
	const $root = $(`#root`);

	window.scenarios = {
		covid19: "./js/covid_19_cdc_wrapper.json",
		localization: "./js/localization.json",
		covid19_core: "./js/covid_19_core_protocol.json",
		covid19_vax_core: "./js/covid_19_core_vaccinated_protocol.json",
		covid19_core_pediatric: "covid_19_core_pediatric_protocol.json",
		covid19_core_asymptomatic: "covid_19_core_asymptomatic_protocol.json"
	}

	window.scenario = window.scenario || {};
	window.scenario.lang = 'en-us';

	window.customLocalizedStrings = [];
	window.conversation = window.conversation || {}; // healthbot conversation log

	window.session = window.session || {
		logOutcomeEvent: () => {
			console.log('logOutcomeEvent');
		}
	}; // healthbot metrics hook
	window.session.logCustomEvent = function () { };
	window.session.trace = function () { };

	function getResource(url, callback) {

		var request = $.ajax({
			url: url,
			dataType: 'json',
			success: (response) => {
				console.log('Retrieved data from :' + url);
			},
			error: (err) => {
				console.log('Error retrieving data from: ' + url + '. Error = ', err);
			}
		});
		request.done(function (res) {
			callback(res);
		});
		request.fail(function (jqXHR, textStatus) {
			console.error(jqXHR);
			callback({ err: true, message: "Request failed: " + textStatus });
		});

	}

	getResource(scenarios.localization, function (response) {
		scenario.localization = response;
		scenario.localization.forEach(function (value) {
			customLocalizedStrings[value["String ID"]] = value[scenario.lang];
		});

		getResource(scenarios.covid19, function (response) {
			scenario[response.scenario_trigger] = JSON.parse(response.code);
			initHealthBot(response.scenario_trigger);
		});
	});

	function initHealthBot(scope) {
		console.log('HealthBot scope:' + scope + ' initialized...');

		// Set the scope of our project
		// Scopes are for example core_wrapper, core_protocol, etc
		scenario['scope'] = scope;

		// Clear root container
		// This will remove the loader too
		const cards = $root.find('.cards');

		if (cards.length < 1) {
			$root.html(``);
			$root.append(`<ul class="cards"></ul>`);
		}

		// Hit the first step
		console.log('Starting HealthBot steps...');

		initNextStep(scenario[scenario.scope].steps[0]);
	}

	/* 
		Initializes the next card (step)
		Takes 2 params:
			1) Takes an the next targets' stored object
			2) Data we want to pass back and do some calculations
			2) An optional callback so we know when initialization is complete
	*/
	function initNextStep(card, vals, callback) {
		const $card = $(`
			<li class="card" id="${card.id}" data-type="${card.type}"></li>
		`);
		const steps = scenario[scenario.scope].steps;

		// Set the current card
		const currentCard = card;
		scenario['currentCard'] = currentCard;

		// Set the next card
		const nextCard = steps.filter(step => step.id === card.designer.next)[0];
		scenario['nextCard'] = nextCard;

		// Set the prev card
		// Set the prev item as the one in the DOM instead
		// Because there could be multiple reference points in the designer.next value
		const previousDomItem = $card.prev() ? $card.prev() : null;
		const prevCard = steps.filter(step => step.id === previousDomItem.attr('id'))[0];
		scenario['prevCard'] = prevCard || null;

		handleScrollToBottom();

		$card.append(`<p><small><strong>Type:</strong> ${card.type} | <strong>Current ID:</strong> ${card.id} | <strong>Next ID:</strong> ${card.designer.next ? card.designer.next : 'endcap'}</small></p>`);
		$root.find('.cards').find('.card').removeClass('is-active');
		$card.addClass('is-active');
		$root.find('.cards').append($card);

		console.log(`# ~~~~~~~~~~~~~~~~~~~~~~~ Initializing current "${card.type}" card...`, card);

		// Process the card
		switch (card.type) {
			case 'assignVariable':
				processAssignVariableCard(card);
				break;

			case 'action':
				processActionCard(card);
				break;

			case 'statement':
				processStatementCard(card);
				break;

			case 'branch':
				processBranchCard(card);
				break;

			case 'prompt':
				processPromptCard(card);
				break;

			case 'replaceScenario':
				processReplaceScenarioCard(card);
				return;

			default:
				// Default propgations
				console.log('Do something default when processing!');
		}


		// these resource objects contain localization data that needs to be remapped.
		function doLocalizationMapping(obj) {
			if (obj.localized) { return; }
			for (const key in obj) {
				if (Array.isArray(obj[`${key}`])) {
					try {
						if (obj[`${key}`][0]) {
							let mapped = obj[`${key}`][0][scenario.lang];
							obj[`${key}`] = mapped;
						}
					} catch (error) {
						console.log(`failed to set: ${key}`);
					}
				} else {
					if (typeof obj[`${key}`] === 'object' && obj[`${key}`] !== null)
						doLocalizationMapping(obj[`${key}`]);
				}
			}
			obj.localized = true;
		}

		if (scenario.messages && !scenario.messages.localized) doLocalizationMapping(scenario.messages);
		if (scenario.dictionary && !scenario.dictionary.localized) doLocalizationMapping(scenario.dictionary);
		if (scenario.state_list && !scenario.state_list.localized) doLocalizationMapping(scenario.state_list);



		// if we have a next card
		if (scenario.nextCard) {
			if (card.type === 'prompt') return;

			// const $btn = $(`<button>Next</button>`);
			// $card.append($btn);
			// $btn.focus();
			// $btn.on('click', () => {
			initNextStep(scenario.nextCard);
			//});
		}

		// Optional callback
		// Check if callback exists && check if it's an actual function
		if (callback && typeof callback === 'function') callback();
	}

	function processAssignVariableCard(card, vals) {
		console.log(`Processing "${card.type}" card...`);

		// Check if the card needs to 'set' any 'variables' by default
		if (card.operation === 'set') {

			scenario[card.variable] = parseInt(card.value);

		} else if (card.operation === 'incrementBy') {

			const val = parseInt(card.value);

			if (!scenario[card.variable]) {
				scenario[card.variable] = 0;
			}

			scenario[card.variable] += val;

		}
	}

	// Initializes 'type: "action"' cards
	function processActionCard(card) {
		console.log(`Processing "${card.type}" card...`);

		// If our onInit exists
		if (card.onInit) {

			const reg = /customLocalizedStrings\[["']([^'"]*)["']]/g
			card.onInit = card.onInit.replace(reg, `scenario.localization.filter(string => string["String ID"] === "$1")`);

			// Create a new function with our new string value
			// At the point it is just JS logic stored as strings
			// We will want this run this
			const F = new Function(card.onInit);

			// Initialize the stored string as actual JS
			return (F());
		}
	}

	function processStatementCard(card) {
		console.log(`Processing "${card.type}" card...`);

		let currentDomElement = $(`[id="${card.id}"]`);
		currentDomElement = $(currentDomElement[currentDomElement.length - 1]);

		if (card.text) {

			const currentText = safelyConvertEval(card.text);
			var md = window.markdownit();
			var result = md.render(currentText);
			currentDomElement.append(`<p>${result}</p>`);

		} else if (card.attachment && card.attachment[0].type == 'AdaptiveCard') {

			currentDomElement.append('<p>adaptiveCard:</p>');
			const adaptiveCard = processAdaptiveContent(card);
			currentDomElement.append(adaptiveCard);

		}

		// if(card.designer.next){
		// 	const nextCard = scenario.scope.steps.filter(step => step.id === card.designer.next)[0];
		// 	initNextStep(nextCard);
		// }

	}

	// Initializes 'type: "prompt"' cards
	function processPromptCard(card) {
	
		console.log(`Processing "${card.type}" card...`);

		const currentText = safelyConvertEval(card.text);
		const currentPrompt = card.dataType !== 'object' ? safelyConvertEval(card.dataType) : null;

		let currentDomElement = $(`[id="${card.id}"]`);
		currentDomElement = $(currentDomElement[currentDomElement.length - 1]);
		currentDomElement.append(`<p>${currentText}</p>`);

		if (!scenario[card.variable]) {
			scenario[card.variable] = {};
		}

		// If prompt is a 'choice' type : button list
		if (card.choiceType === 'choice' && currentPrompt) {			
			currentPrompt.map((prompt, index) => {
				const $btn = $(`<button value="${index}">${prompt} (${index})</button>`);

				currentDomElement.append($btn);

				$btn.on('click', (event) => {
					const $target = $(event.target);

					scenario[card.variable].index = parseInt($target.attr('value'));

					processUserResponse(card, $target);

					initNextStep(scenario.nextCard);
				});
			});
		} else if (card.choiceType === 'multi-choice' && currentPrompt) {

/*
{
  "id": "605e233e0f3f-697f7bccbc0bab5e-fd64",
  "type": "prompt",
  "dataType": "scenario.symptom_lists.ethnicity.text",
  "designer": {
    "xLocation": 1228,
    "yLocation": 769,
    "listStyle": 5,
    "next": "138a202802d7-6ab8fc3a06db11f4-51a0"
  },
  "text": "scenario.questions.ethnicity_question",
  "variable": "ethnicity",
  "stringId": "stringId_4d064ea244c6a142",
  "choiceType": "multi-choice",
  "label": "Q44 ethnicity",
  "submitTitle": "scenario.dictionary.submit_button"
}
*/
			currentPrompt.map((prompt, index) => {
				let valueString = "0" + (index+1);
				const $cbx = $(`<div style="display: flex; align-items: center;"><input id="${index}_${card.id}" type="checkbox" value="${valueString}" aria-label="${prompt}"><label class="" for="${index}_${card.id}"><p>${prompt}</p></label></div>`)
				currentDomElement.append($cbx);
			});

			const $btn = $(`<button>${scenario.dictionary.submit_button}</button>`);

			currentDomElement.append($btn);

			$btn.on('click', (event) => {
				scenario[card.variable] = [];

				var checkedBoxes = document.getElementById(card.id).querySelectorAll('input:checked');
				checkedBoxes.forEach((cbx, index)=>{
					scenario[card.variable].push({index:cbx.value});
				});

				const $target = $(event.target);
				processUserResponse(card, $target); // or here?
				initNextStep(scenario.nextCard);
			});
			
		} else if (card.attachment && card.attachment[0].type === 'AdaptiveCard') {

			currentDomElement.append('<p>adaptiveCard:</p>');
			const adaptiveCard = processAdaptiveContent(card);
			currentDomElement.append(adaptiveCard);

		}
	}

	function processBranchCard(card) {
		console.log(`Processing "${card.type}" card...`);

		if (card.condition) {

			let funct = new Function("return " + card.condition);
			let nextCardId = "";

			if (funct()) {
				nextCardId = card.targetStepId;
			} else {
				nextCardId = card.designer.next;
			}
			const nextCard = scenario[scenario.scope].steps.filter(step => step.id === nextCardId)[0];

			scenario.nextCard = nextCard;
		}
	}

	function processReplaceScenarioCard(card) {

		scenario.scenarioArgs = {};

		console.log(`Processing "${card.type}" card...`);

		let funct = new Function("return " + card.args);
		let args = funct();
		for (const key in args) {
			scenario.scenarioArgs[`${key}`] = args[`${key}`];
		}

		getResource(scenarios[card.scenario], function (response) {
			scenario[response.scenario_trigger] = JSON.parse(response.code);
			initHealthBot(response.scenario_trigger);
		});
	}

	// Function to help process the AdaptiveCard
	// Takes the attachment object as a param that lices inside type="AdaptiveCard" types
	function processAdaptiveContent(card) {
		const cardCode = safelyConvertEval(card.attachment[0].cardCode);

		// Create a AdaptiveCard instance
		const adaptiveCard = new AdaptiveCards.AdaptiveCard();

		// // Set its hostConfig property unless you want to use the default Host Config
		// // Host Config defines the style and behavior of a card
		// adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
		// 	fontFamily: "Segoe UI, Helvetica Neue, sans-serif"
		// 	// More host config options
		// });

		// Set the adaptive card's event handlers. onExecuteAction is invoked
		// whenever an action is clicked in the card
		adaptiveCard.onExecuteAction = function (action) {
			scenario[card.variable] = {};
			for (const key in action._processedData) {
				scenario[card.variable][`${key}`] = action._processedData[`${key}`];
			}

			initNextStep(scenario.nextCard);
		}

		// Parse the card payload
		adaptiveCard.parse(cardCode);

		// Render the card to an HTML element:
		const renderedCard = adaptiveCard.render();

		// And finally insert it somewhere in your page:
		// console.log(renderedCard)
		return renderedCard
	}

	function processUserResponse(card, target) {
		let currentDomElement = $(`[id="${card.id}"]`);
		currentDomElement = $(currentDomElement[currentDomElement.length - 1]);
		const $card = $(`<li class="card card--response"></li>`);

		if(!Array.isArray(scenario[card.variable])){
			$card.append(`<p>You said: ${target.text()}</p>`);
		} else {
			let selected=[];
			let checkedBoxes = document.getElementById(card.id).querySelectorAll('input:checked');
			checkedBoxes.forEach((cbx, index) => {
				selected.push($('label[for="'+ cbx.id+'"]')[0].innerText);
			});
			$card.append(`<p>You said: ${selected.join(",")}</p>`);
		}
		$root.find('.cards').append($card);
	}

	function safelyConvertEval(stringToConvert) {
		return Function(`'use strict'; return (${stringToConvert})`)();
	}

	function handleScrollToBottom(speed) {
		$("html, body").animate({ scrollTop: $(document).height() }, speed ? speed : 0);
	}

});
