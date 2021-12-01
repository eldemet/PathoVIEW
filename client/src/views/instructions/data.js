export const devices = {
    pathotestick: {
        name: 'PathoTeSTICK',
        image: './assets/instructions/instructions-pathotestick.png',
        description: 'The PathoTeSTICK was designed to protect first responders, since it is a portable device which can be used when approaching a possible contaminated site for the first time.',
        pathogens: [
            'E. coli',
            'Pseudomonas aeruginosa',
            'Campylobacter',
            'protozoa species'
        ],
        detectionLimits: [
            '106 CFU/mL',
            '105 CFU/mL, for E. coli and Pseudomonas aeruginosa, respectively'
        ],
        checklist: {
            name: 'Sampling Checklist',
            items: [
                {
                    name: 'To use the PathoTeSTICK, it is necessary to wear Individual Protection Equipment (IPEs), including but not limited to:',
                    subItems: [
                        'Disposable gloves',
                        'Splash resistant goggles',
                        'Disposable shoe covers or adequate shoes',
                        'Disposable laboratory coats'
                    ]
                },
                {
                    name: 'There are some materials which may be necessary during the in-field analysis. Those materials are listed below.',
                    subItems: [
                        'Antiseptic wipes',
                        'Squirt bottle with rinse water',
                        'Paper towels',
                        'Flashlight/headlamp',
                        'Device for grab sampling (in case samples are collected in a large waterbody)'
                    ]
                },
                {
                    name: 'It is necessary to check that the PathoTeSTICK field test kit is complete, and that it contains the following material:',
                    subItems: [
                        'Disposable 10 mL plastic sample containers (4)',
                        'PathoTeSTICK (disposable sticks - supplied in separate containers, labelled depending on the pathogen that can be detected with each one)',
                        'Mini-potentiostat - powered by the Smartphone (not disposable)',
                        'Smartphone with the application installed'
                    ]
                }
            ]
        },
        samplingInstructions: [
            {
                step: 'Sample collection: once the sampling procedure from section XX has been follow, the specific procedure for PathoTeSTICK kit is detailed.',
                subSteps: [
                    'If the sample must be collected from a large water body, take the device for grab sampling.',
                    'Rinse the plastic container with the sample a couple of times.',
                    'Fill in the container with the sample.'
                ]
            },
            {
                step: 'Sample analysis with PathoTeSTICK:',
                subSteps: [
                    'Connect the potentiostat to the Smartphone. The potentiostat turns on automatically when connected to the Smartphone.',
                    'Open the app and select the target pathogen, or the method of detection of the respective pathogen, properly named and saved in the application menu.',
                    'Introduce the stick in the plastic container. Immerse it only up to the marked line, to avoid splashing the stick.',
                    'Start the test by pressing the Play button.',
                    'Wait until the result appears in the screen.'
                ]
            },
            {
                step: 'Waste management',
                subSteps: [
                    'Since the PathoTeSTICK is a use and throw device and does not use any reactant, it does not require any specific waste management procedure.',
                    'The used stick can be thrown in the hazardous waste bin if there is presence of pathogens in the analysed sample.'
                ]
            }
        ]
    },
    bactcontrol: {
        name: 'BactControl',
        image: './assets/instructions/instructions-bactcontrol.png',
        description: 'Not defined'
    },
    aquatrack: {
        name: 'AquaTrack',
        image: './assets/instructions/instructions-aquatrack.png',
        description: 'Not defined'
    }
};
