'use strict';

const cdcLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 77 47"><path fill="#FFF" d="M2.9 2.2h69.6v42.5H2.9V2.2z"></path><path fill="#105EAB" d="M3.5 2.9h68.2V44H3.5V2.9z"></path><path fill="#FFF" d="M31.5 44L71.7 3.3v-.4h-.2L30.9 44h.6zM6.2 44L8.9 2.9h-.4L5.8 44h.4zm2.2 0l5.9-41.1h-.4L7.9 44h.5zm2.3 0l9.2-41.1h-.4L10.3 44h.4zm2.5 0L26.3 2.9h-.4L12.8 44h.4zm2.5 0L32.5 2.9H32L15.2 44h.5zm2.7 0L39.5 2.9H39L17.9 44h.5zM50 2.9h-.5L22.2 44h.5L50 2.9zm9.7 0h-.5L26 44h.5L59.7 2.9zm12 15.6V18L38.9 44h.7l32.1-25.5zm0 11.3v-.5L48.1 44h.8l22.8-14.2zm0 10.6V40L63 44h1l7.7-3.6z"></path><path fill="#FFF" d="M23.9 27.6c-.8.8-3 1.7-4.5 1.7-4.5 0-6.6-3.9-6.7-9.7 0-5.6 2.3-9.1 6.2-9.1 2.8 0 4.2 1.6 4.9 2.6l.8 1.1V9.1l-.2-.1c-1.6-.8-3.7-1.1-5.5-1.1-7 0-12.4 5.1-12.4 12.2 0 7.3 5.1 11.9 12.4 11.9 3.6 0 5.5-1.1 6.4-1.8l.3-.2-1.2-2.7-.5.3zm19.7-17.1c-2.4-1.7-5.3-2.2-7.8-2.2h-8.6v23.3h9.2c4.4 0 11.3-2.8 11.3-11.7 0-4.7-1.7-7.7-4.1-9.4zM32.9 28.8v-18c4.2.1 8.6.6 8.7 9.1-.1 8.2-4.7 8.8-8.7 8.9zm34.4-1.6l-.5.4c-.8.8-3 1.7-4.5 1.7-4.5 0-6.7-3.9-6.7-9.7 0-5.6 2.3-9.1 6.2-9.1 2.8 0 4.2 1.6 4.9 2.6l.8 1.1V9.1l-.1-.1c-1.6-.8-3.7-1.1-5.5-1.1-7 0-12.4 5.1-12.4 12.2 0 7.3 5.1 11.9 12.4 11.9h.1c3.6 0 5.4-1.1 6.4-1.8l.3-.2-1.4-2.8z"></path><path fill="#0033A0" d="M72.9 42.9h.8v.1h-.3v.9h-.1V43H73v-.1zm1.8 1V43l-.3.8h-.1L74 43v.8h-.1v-1h.2l.3.9.3-.9h.2v1h-.2v.1z"></path></svg>`;

$(document).ready(() => {

	// The root element we will put most of our magic in
	const $root = $(`#root`);

	window.scenarios = {
		covid19: "./js/covid_19_cdc_wrapper.json",
		localization: "./js/localization.json",
		covid19_core: "./js/covid_19_core_protocol.json",
		covid19_vax_core: "./js/covid_19_core_vaccinated_protocol.json",
		covid19_core_pediatric: "./js/covid_19_core_pediatric_protocol.json",
		covid19_core_asymptomatic: "./js/covid_19_core_asymptomatic_protocol.json"
	}

	// Flag to turn on/off development mode
	window.devMode = false;
	
	window.scenario = window.scenario || {};
	window.scenario.lang = 'en-us'; // set to english by default - TODO: figure out localization later
	window.customLocalizedStrings = [];
	window.conversation = window.conversation || {}; // healthbot conversation log
	
	// Custom session events we arent sure of yet
	// Possible healthbot metrics hook
	window.session = window.session || {};
	window.session.logCustomEvent = () => { };
	window.session.logOutcomeEvent = () => { };
	window.session.trace = () => { };

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
		const cards = $root.find('.chatboxes');

		if (cards.length < 1) {
			$root.html(``);
			$root.append(`<ul class="chatboxes"></ul>`);
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
	function initNextStep(card, callback) {
		handleScrollToBottom();

		const $card = $(`<li id="${card.id}" class="chatbox" data-type="${card.type}"></li>`);
		const steps = scenario[scenario.scope].steps;

		// Set the current card
		const currentCard = card;
		scenario['currentCard'] = currentCard;

		// Set the next card
		const nextCard = steps.filter(step => step.id === card.designer.next)[0];
		scenario['nextCard'] = nextCard;

		$card.append(`
			<span class="chatbox-icon">${cdcLogo}</span>
			<div class="chatbox-body">
				${devMode ? `
					<p><small> <strong>Type:</strong> ${card.type} | <strong>Current ID:</strong> ${card.id} | <strong>Next ID:</strong> ${card.designer.next ? card.designer.next : 'endcap'}
					</small></p>
				` : ``}
			</div>
		`);

		if (
			devMode ||
			card.type === 'prompt' ||
			card.type === 'statement' ||
			(card.type === 'prompt' && card.attachment[0].type === 'AdaptiveCard') ||
			(card.type === 'statement' && card.attachment[0].type === 'AdaptiveCard')
		) {
			$root.find('.chatboxes').append($card);

		}

		// Set the prev card
		// Because there could be multiple reference points in the designer.next key value
		// We map the prevCard as the previous DOM item's id value instead
		const previousDomItem = $card.prev().length > 0 ? $card.prev() : null;

		if (previousDomItem) {
			const prevCard = steps.filter(step => step.id === previousDomItem.attr('id'))[0];
			scenario['prevCard'] = prevCard;
		}

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
		if (scenario.messages && !scenario.messages.localized) doLocalizationMapping(scenario.messages);
		if (scenario.dictionary && !scenario.dictionary.localized) doLocalizationMapping(scenario.dictionary);
		if (scenario.state_list && !scenario.state_list.localized) doLocalizationMapping(scenario.state_list);

		// if we have a next card
		if (scenario.nextCard) {

			if (card.type === 'prompt') return;

			initNextStep(scenario.nextCard);
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

		let currentDomElement = $(`#${card.id}`);
		currentDomElement = $(currentDomElement[currentDomElement.length - 1]).find('.chatbox-body');

		if (card.text) {

			const currentText = safelyConvertEval(card.text);
			const md = window.markdownit();
			const result = md.render(currentText);
			
			currentDomElement.append(`${result}`);

		} else if (card.attachment && card.attachment[0].type == 'AdaptiveCard') {

			if (devMode) currentDomElement.append('<p>adaptiveCard:</p>');
			
			const adaptiveCard = processAdaptiveContent(card);
			currentDomElement.append(adaptiveCard);

			const ro = new ResizeObserver(() => {console.log('resize ocurred');handleScrollToBottom();});
			ro.observe(adaptiveCard);


		}

	}

	// Initializes 'type: "prompt"' cards
	function processPromptCard(card) {
	
		console.log(`Processing "${card.type}" card...`);

		const currentText = safelyConvertEval(card.text);
		const md = window.markdownit();
		const result = md.render(currentText);

		const currentPrompt = card.dataType !== 'object' ? safelyConvertEval(card.dataType) : null;

		let currentDomElement = $(`[id="${card.id}"]`);
		currentDomElement = $(currentDomElement[currentDomElement.length - 1]).find('.chatbox-body');
		currentDomElement.append(`${result}`);

		if (!scenario[card.variable]) {
			scenario[card.variable] = {};
		}

		// If prompt is a 'choice' type : button list
		if (card.choiceType === 'choice' && currentPrompt) {			
			currentPrompt.map((prompt, index) => {
				const $btn = $(`<button class="chatbox-btn" value="${index}">${prompt}</button>`);

				currentDomElement.append($btn);

				$btn.on('click', (event) => {
					const target = $(event.target);

					scenario[card.variable].index = parseInt(target.attr('value'));

					processUserResponse(card, target);

					initNextStep(scenario.nextCard);
				});
			});
		} else if (card.choiceType === 'multi-choice' && currentPrompt) {

			/*{
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
			}*/
			currentPrompt.map((prompt, index) => {
				let valueString = "0" + (index+1);
				const $cbx = $(`<div style="display: flex; align-items: center;"><input id="${index}_${card.id}" type="checkbox" value="${valueString}" aria-label="${prompt}"><label class="" for="${index}_${card.id}"><p>${prompt}</p></label></div>`)
				currentDomElement.append($cbx);
			});

			const $btn = $(`<button class="chatbox-btn">${scenario.dictionary.submit_button}</button>`);

			currentDomElement.append($btn);

			$btn.on('click', (event) => {
				scenario[card.variable] = [];

				var checkedBoxes = document.getElementById(card.id).querySelectorAll('input:checked');
				checkedBoxes.forEach((cbx, index)=>{
					scenario[card.variable].push({index:cbx.value});
				});

				const target = $(event.target);
				processUserResponse(card, target); // or here?
				initNextStep(scenario.nextCard);
			});
			
		} else if (card.attachment && card.attachment[0].type === 'AdaptiveCard') {

			const adaptiveCard = processAdaptiveContent(card);
			currentDomElement.append(adaptiveCard);

			const ro = new ResizeObserver(() => {console.log('resize ocurred');handleScrollToBottom();});
			ro.observe(adaptiveCard);


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

		// Set its hostConfig property unless you want to use the default Host Config
		// Host Config defines the style and behavior of a card
		adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
			// fontFamily: "Segoe UI, Helvetica Neue, sans-serif",
			// More host config options
			fontSizes: {
				"small": 12,
				"default": 16,
				"medium": 18,
				"large": 24,
				"extraLarge": 32
			},
			spacing: {
				"padding": "none"
			}
		});

		// Set the adaptive card's event handlers.
		// onExecuteAction is invoked whenever an action is clicked in the card
		// Provide an onExecuteAction handler to handle the Action.Submit
		adaptiveCard.onExecuteAction = (action) => {
			
			handleScrollToBottom();

			scenario[card.variable] = {};

			for (const key in action._processedData) {
				scenario[card.variable][`${key}`] = action._processedData[`${key}`];
			}

			// // Scroll to bottom after nextStep completed
			initNextStep(scenario.nextCard);
		}


		doLocalizationMapping(cardCode);

		// Parse the card payload
		adaptiveCard.parse(cardCode);

		// Render the card to an HTML element:
		const renderedCard = adaptiveCard.render();

		// And finally insert it somewhere in your page:
		return renderedCard
	}

	function processUserResponse(card, target) {
		let currentDomElement = $(`[id="${card.id}"]`);
		currentDomElement = $(currentDomElement[currentDomElement.length - 1]).find('.chatbox-body');
		const $card = $(`
			<li class="chatbox chatbox--response" data-type="response">
				<div class="chatbox-body"></div>
				<span class="chatbox-icon">You</span>
			</li>
		`);

		if(!Array.isArray(scenario[card.variable])){
			$card.find('.chatbox-body').append(`<p>You said: ${target.text()}</p>`);
	 	} else {
			let selected = [];
			let checkedBoxes = document.getElementById(card.id).querySelectorAll('input:checked');
			checkedBoxes.forEach((cbx, index) => {
				selected.push($('label[for="'+ cbx.id+'"]')[0].innerText);
			});
			$card.find('.chatbox-body').append(`<p>You said: ${selected.join(", ")}</p>`);
		}

		$root.find('.chatboxes').append($card);
	}

	function doLocalizationMapping(obj) {
		if (obj.localized) { return; }

		for (const key in obj) {
			if (Array.isArray(obj[`${key}`])) {
				try {
					if (obj[`${key}`][0] && obj[`${key}`][0].hasOwnProperty(scenario.lang)) {
						let mapped = obj[`${key}`][0][scenario.lang];
						obj[`${key}`] = mapped;
					} else {
						//console.log(obj[`${key}`]);
						doLocalizationMapping(obj[`${key}`]);						
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

	function safelyConvertEval(stringToConvert) {
		return Function(`'use strict'; return (${stringToConvert})`)();
	}

	function handleScrollToBottom() {
		const cards = $('.chatboxes').children('.chatbox');
		const lastCard = cards[cards.length - 1];

		// window.scrollTo(0, document.body.scrollHeight);
		
		if (lastCard) {
			$('html, body').animate({
				scrollTop: $(lastCard).offset().top + $(lastCard).outerHeight()
			}, 200);
		}


		// const lastCard = cards[cards.length - 1];
		// console.log( $(cards[0]).offset().top );

		// window.scrollTo(0, document.body.scrollHeight);

		// $('html, body').animate({
		// 	scrollTop: lastCard.offset().top + lastCard.outerHeight()
		// }, 125)
	}

});
