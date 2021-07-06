scenario.age_list = [
	'lt_2',
	'two_4',
	'five_9',
	'ten_12',
	'thirteen_17',
	'eighteen_29',
	'thirty_39',
	'forty_49',
	'fifty_59',
	'sixty_64',
	'sixty_five_69',
	'seventy_79',
	'eighty_plus'
];

scenario.ages = scenario.dictionary.responses.age_response.map((age, i) => ({ value: i.toString(), title: age }));

scenario.dictionary.age_dropdown_list = [
	{
		value: 'default_message',
		title: customLocalizedStrings["CDC/Please_select_an_age"]
	},
	...ages
];
