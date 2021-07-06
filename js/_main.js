'use strict';

// Create global var to drive the healthBot
// This will be what from a client-side perspective
var scenario = {};
scenario.lang = 'en-us'

// scenario.customLocalizedString = (path) => {	
// 	const localization = scenario.localization;

// 	localization.filter(item => {
// 		console.log(item[''])
// 	});
// }

// Self invoking function
// Helps with global scope pollution
// (() => {
$(document).ready(() => {

	// The root element we will put most of our magic in
	const $root = $(`#root`);

	// Async ajax call to our JSON architecture
	$.ajax({
		type: 'get',
		url: './js/core_protocol.json',
		dataType: 'json',
		success: (data) => {
			console.log('Core Protocol retrieved...');

			// If our data is a string, we need to parse it something JS can understand
			if (typeof data === 'string') {
				console.log('Core Protocol is string. Converting parsing...');
				JSON.parse(data);
			}

			console.log(data);

			scenario.core = data[0];

			$.ajax({
				type: 'get',
				url: './js/localization.json',
				dataType: 'json',
				success: (data) => {
					console.log('Localized Messages retrieved...');

					// If our data is a string, we need to parse it something JS can understand
					if (typeof data === 'string') {
						console.log('Localized Messages is string. Converting parsing...');
						JSON.parse(data);
					}

					scenario.customLocalizedStrings = data;

					$.ajax({
						type: 'get',
						url: './js/questions_answers.json',
						dataType: 'json',
						success: (data) => {
							console.log('Questions and Answers retrieved...');
		
							// If our data is a string, we need to parse it something JS can understand
							if (typeof data === 'string') {
								console.log('Questions and Answers is string. Converting parsing...');
								JSON.parse(data);
							}
		
							scenario.questionsAndAnswers = data;
		
							initHealthBot();
						},
						error: (err) => {
							console.log('Error retrieving Questions and Answers.' , err);
						}
					});
				},
				error: (err) => {
					console.log('Error retrieving Localized Messages.' , err);
				}
			});
		},
		// On error
		error: (err) => {
			console.log('Error retrieving Core Protocol.', err);
		}
	});

	function initHealthBot() {
		console.log('HealthBot initialized...');

		// Clear root container
		// This will remove the loader too
		$root.html('');

		// Hit the first step
		console.log('Starting HealthBot steps...');
		initNextCard(scenario.core.steps[0]);
	}

	/* 
		Initializes the next card (step)
		Takes 2 params:
			1) Takes an the next targets' stored object
			2) An optional callback so we know when initialization is complete
	*/ 
	function initNextCard(card, callback) {
		const steps = scenario.core.steps;

		const $card = $(`<div class="card" data-id="${card.id}" data-type="${card.type}"></div>`);

		$card.append(`<p><strong>Type:</strong> ${card.type}</p>`);
		$card.append(`<p><strong>Current ID:</strong> ${card.id}</p>`);
		$card.append(`<p><strong>Next ID:</strong> ${card.designer.next}</p>`);
		$root.find('.card').removeClass('is-active');
		$card.addClass('is-active');
		$root.append($card);

		setTimeout(() => {
			processCurrentCard(card, () => {
				console.log('Processing card completed...');
	
				if (card.designer && card.designer.next) {
					const nextCard = steps.filter(step => step.id === card.designer.next)[0];

					scenario['nextCard'] = nextCard;
	
					if (card.type === 'prompt') return;

					initNextCard(nextCard, scrollToBottom());
				}
			});
		}, 500);

		// Optional callback
		// Check if callback exists && check if it's an actual function
		if (callback && typeof callback === 'function') callback();
	}

	/*
		Processes the current card, running through all the logic (if any)
		Takes 2 params:
			1) Takes the currentCard's object
			2) An optional callback so we know when initialization is complete
	*/
	function processCurrentCard(card, callback) {
		console.log('Processing Current Card...', card);

		scenario['currentCard'] = card

		switch (card.type) {
			case 'assignVariable':
				processAssignVariableCard(card);
				break;

			case 'action':
				processActionCard(card);
				break;

			case 'branch':
				console.log('Type: ', card.type);
				break;

			case 'prompt':
				processPromptCard(card);
				break;

			default:
				// Default propgations
				console.log('hello')
		}

		// Optional callback
		// Check if callback exists && check if it's an actual function
		if (callback && typeof callback === 'function') callback();
	}

	function processAssignVariableCard(card, target) {
		console.log(`Processing "${card.type}" card...`);

		// Check if the card needs to 'set' any 'variables' by default
		if (card && card.operation === 'set') {
			scenario[card.variable] = card.value;
		} else if (card && target) {

		}
	}

	// Initializes 'type: "action"' cards
	function processActionCard(card) {
		console.log(`Processing "${card.type}" card...`);

		// If our onInit exists
		if (card.onInit) {
			// Split it into an array so we can parse through it
			let oldInit = card.onInit.split(' ');
			// Create new empty array to push items to
			let newInit = [];
			
			// Iterate through the onInit value that has been split
			for (let i = 0; i < oldInit.length; i++) {
				// Set a var for the current item's string val we are iterating through
				let item = oldInit[i];

				// If our iteration item has a 'customLocalizedStrings' string 
				if (item.indexOf('customLocalizedStrings') !== -1) {
					// Get the message location blob
					// This is so we can map the items later
					let blob = item.substring(
						item.lastIndexOf('["') + 2, 
						item.lastIndexOf('"]')
					);

					// Replace the old string with the new string
					// This is so we can filter through the localizedStrings to grab the current items
					let newItemStart = item.replace(/customLocalizedStrings/g, `scenario.customLocalizedStrings.filter(string => string["String ID"] === "${blob}")`);

					// Remove the old blob because at this point we haven't removed it yet
					newItemStart = newItemStart.replaceAll(`["${blob}"]`, '');
					// Reassign the item string to the newly created string
					item = newItemStart;
				}

				// Push the each item to the newly created array
				newInit.push(item);
			}

			// Set the old onInit value to the newly created one
			// This has our new string assignments
			card.onInit = newInit.join(' ');
			
			// Create a new function with our new string value
			// At the point it is just JS logic stored as strings
			// We will want this run this
			const F = new Function(card.onInit);

			// Initialize the stored string as actual JS
			return (F());
		}
	}

	// Initializes 'type: "prompt"' cards
	function processPromptCard(card) {
		console.log('Processing "Prompt" card...');

		const $currentCard = $(`[data-id="${card.id}"]`);

		const currentText = safelyEvalString(card.text)[0];

		const currentPrompt = safelyEvalString(card.dataType)[0];

		// If prompt is a 'choice' type
		if (card.choiceType === 'choice') {
			$currentCard.append(`<p>${currentText[scenario.lang]}</p>`);

			currentPrompt[scenario.lang].map((prompt, index) => {
				const $btn = $(`<button data-index="${index}">${index} - ${prompt}</button>`);

				$currentCard.append($btn);

				$btn.on('click', (event) => {
					const $target = $(event.target);

					scenario[card.variable] = parseInt($target.attr('data-index'));

					const nextCard = scenario.core.steps.filter(step => step.id === card.designer.next)[0];
					initNextCard(nextCard);
				});
			});
		}
	}

	function safelyEvalString(str) {
		return Function(`'use strict'; return (${str})`)();
	}

	function scrollToBottom() {
		$("html, body").animate({ scrollTop: $(document).height() });
	}



































































	// /*
	// 	The below is for prototype purposes
	// 	may eventually use some of the logic for future
	// 	Next button is created dynamically
	// 	This binds event handler to the "Next" button
	// */
	// $(document).on('click', '.card button', (event) => {
	// 	// Get the button
	// 	const $target = $(event.target);

	// 	// If btn has data-next
	// 	if ($target.attr('data-next')) {			
	// 		// Initialize the next card
	// 		initNextCard($target.attr('data-next'), () => {
	// 			$("html, body").animate({
	// 				scrollTop: $(document).height()
	// 			});
				
	// 			$target.attr('disabled', true);
	// 			$target.removeAttr('data-next');
	// 		});
	// 	}	
	// });


	// function runReporting(data) {
	// 	const types = [];

	// 	for (let i = 0; i < data.steps.length; i++) {
	// 		const type = data.steps[i].type;
	// 		const attachment = data.steps[i].attachment;

	// 		if (types.indexOf(type) === -1) types.push(type);
	// 	}

	// 	console.log(`All step types: `, types);

	// 	// Loop through each type
	// 	for (let i in types) {
	// 		const type = types[i];
	// 		let count = 0;
	// 		let attachmentCount = 0;
	// 		let attachmentLabel = '';

	// 		// Loop through data and match EACH step to EACH type
	// 		// Increment the count
	// 		for (let i = 0; i < data.steps.length; i++) {
	// 			if (data.steps[i].type === type) {
	// 				count++;

	// 				if (data.steps[i].attachment) {
	// 					attachmentLabel = data.steps[i].attachment[0].type;
	// 					attachmentCount++
	// 				}
	// 			}
	// 		}

	// 		console.log(`Number of "${type}" occurences: ${count}`);

	// 		if (attachmentCount > 0) {
	// 			console.log(`» Number of ${attachmentLabel} inside "${type}": ${attachmentCount}`);
	// 		}
	// 	}
	// }

});
// })();
