const dict = scenario.dictionary

const symptom_lists = {
	COV_symptoms: {
		lookup: 'covid_symptoms',
		indices: [],
		text: [
			'fever',
			'cough',
			'mild_mod_breathing',
			'sore_throat',
			'muscle_aches',
			'headache',
			'vomiting',
			'new_loss_taste_smell',
			'runny_nose',
			'other_symptoms'
		]
	},

	ped_COV_symptoms: {
		lookup: 'covid_symptoms',
		indices: [],
		text: [
			'fever',
			'cough',
			'mild_mod_breathing_ped',
			'sore_throat',
			'muscle_aches',
			'vomiting',
			'abdominal_pain',
			'new_loss_taste_smell',
			'rash',
			'conjunctivitis',
			'runny_nose',
			'other_symptoms'
		]
	},
	old_COV_symptoms: {
		lookup: 'covid_symptoms',
		indices: [],
		text: [
			'fever',
			'cough',
			'mild_mod_breathing',
			'sore_throat',
			'muscle_aches',
			'headache',
			'vomiting',
			'new_loss_taste_smell',
			'runny_nose',
			'rash',
			'fatigue',
			'joint_pain',
			'unusual_chest_pain',
			'brain_fog',
			'depression',
			'palpitations',
			'other_symptoms',
			'no_symptoms'
		]
	},

	comorbidity: {
		lookup: 'comorbidity',
		indices: [],
		text: [
			'chronic_lung',
			'serious_heart',
			'weak_immune',
			'severe_obesity',
			'underlying_conditions',
			'high_blood_pressure',
			'cancer',
			'HIV',
			'blood_disorder',
			'cerebrovascular',
			'smoking',
			'down_syndrome',
			'pregnancy',
			'none_of_above'
		]
	},

	ped_comorbidity: {
		lookup: 'comorbidity',
		indices: [],
		text: [
			'ped_chronic_lung',
			'premature',
			'ped_serious_heart',
			'weak_immune',
			'severe_obesity',
			'underlying_conditions',
			'cancer',
			'HIV',
			'blood_disorder',
			'ped_neurologic',
			'smoking',
			'down_syndrome',
			'pregnancy',
			'none_of_above'
		]
	},

	ethnicity: {
		lookup: 'ethnicity',
		indices: [],
		text: [
			'white',
			'black',
			'nativeamerican',
			'asian',
			'pacificislander',
			'prefernotsay'
		]
	}

}

for (const list in symptom_lists) {
	const symptom = symptom_lists[list]
	symptom.text = symptom.text.map((text, i) => {
		symptom.indices[i] = scenario.index_lookup[symptom.lookup][text]
		return dict[symptom.lookup][text]
	})
}

scenario.symptom_lists = symptom_lists