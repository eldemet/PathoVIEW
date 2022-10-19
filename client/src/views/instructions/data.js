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
        instructions: [
            {
                type: 'checklist',
                name: 'Sampling Checklist',
                items: [
                    {
                        section: 'Individual Protection Equipment (IPEs)',
                        description: 'To use the PathoTeSTICK, it is necessary to wear Individual Protection Equipment (IPEs), including but not limited to:',
                        checklistItems: [
                            'Disposable gloves',
                            'Splash resistant goggles',
                            'Disposable shoe covers or adequate shoes',
                            'Disposable laboratory coats'
                        ]
                    },
                    {
                        section: 'In-field analysis',
                        description: 'There are some materials which may be necessary during the in-field analysis. Those materials are listed below.',
                        checklistItems: [
                            'Antiseptic wipes',
                            'Squirt bottle with rinse water',
                            'Paper towels',
                            'Flashlight/headlamp',
                            'Device for grab sampling (in case samples are collected in a large waterbody)'
                        ]
                    },
                    {
                        section: ' PathoTeSTICK field test kit',
                        description: 'It is necessary to check that the PathoTeSTICK field test kit is complete, and that it contains the following material:',
                        checklistItems: [
                            'Disposable 10 mL plastic sample containers (4)',
                            'PathoTeSTICK (disposable sticks - supplied in separate containers, labelled depending on the pathogen that can be detected with each one)',
                            'Mini-potentiostat - powered by the Smartphone (not disposable)',
                            'Smartphone with the application installed'
                        ]
                    }
                ]
            },
            {
                type: 'sampling',
                name: 'On field sampling procedure',
                items: [
                    {
                        section: 'Sample collection',
                        description: 'Once the sampling procedure has been followed, the specific procedure for PathoTeSTICK kit is detailed.',
                        steps: [
                            'If the sample must be collected from a large water body, take the device for grab sampling.',
                            'Rinse the plastic container with the sample a couple of times.',
                            'Fill in the container with the sample.'
                        ]
                    },
                    {
                        section: 'Sample analysis with PathoTeSTICK',
                        steps: [
                            'Connect the potentiostat to the Smartphone. The potentiostat turns on automatically when connected to the Smartphone.',
                            'Open the app and select the target pathogen, or the method of detection of the respective pathogen, properly named and saved in the application menu.',
                            'Introduce the stick in the plastic container. Immerse it only up to the marked line, to avoid splashing the stick.',
                            'Start the test by pressing the Play button.',
                            'Wait until the result appears in the screen.'
                        ]
                    },
                    {
                        section: 'Waste management',
                        steps: [
                            'Since the PathoTeSTICK is a use and throw device and does not use any reactant, it does not require any specific waste management procedure.',
                            'The used stick can be thrown in the hazardous waste bin if there is presence of pathogens in the analysed sample.'
                        ]
                    }
                ]
            }
        ]
    },
    bactcontrol: {
        name: 'BactControl',
        image: './assets/instructions/instructions-bactcontrol.png',
        description: 'The BACTcontrol is an on-line automated instrument for the detection of microbiological activity in water.',
        pathogens: [
            'β-galactosidase (coliforms)',
            'β-glucoronidase (E.coli)',
            'ß-glucosidase (Enterococci)',
            'alkaline phosphatase (Total Activity, biomass)'
        ],
        detectionLimits: [],
        instructions: [
            {
                type: 'commissioning',
                name: 'Commissioning',
                items: [
                    {
                        section: 'Introduction',
                        description: 'Installation of the BACTcontrol system is performed by engineers of microLAN or qualified engineers of the local distributor. The procedures in this section should only carried out by authorized engineers.'
                    },
                    {
                        section: 'Connection Of the Water Sample Inlet, Outlet & Waste',
                        steps: [
                            'The waste can be separately connected to a container',
                            'Make sure the tubing is pushed completely into the connectors!'
                        ]
                    }
                ]
            },
            {
                type: 'maintenance',
                name: 'Maintenance',
                items: [
                    {
                        section: 'Cleaning Reaction Chamber',
                        image: './assets/instructions/instructions-bactcontrol-chamber.png',
                        steps: [
                            'Opening reaction chamber and remove filter',
                            'Remove the cover of the reaction chamber. (unscrew nuts)',
                            'Remove the ceramic filter with the C-ring and check if they are still suitable (not cracked/broken).'
                        ]
                    },
                    {
                        section: 'Remove stirrer',
                        steps: [
                            'Remove the stirrer with the stirrer removal tool! Be careful! Stirrer is very small'
                        ]
                    },
                    {
                        section: 'Cleaning reaction chamber and stirrer',
                        steps: [
                            'Check for possible biofilm or pollution inside the reaction chamber.',
                            'Clean the measurement cell, the glass of the lens and the stirrer with the cleaning solution and dry with a paper cloth'
                        ]
                    }
                ]
            }
        ]
    },
    aquatrack: {
        name: 'AquaTrack',
        image: './assets/instructions/instructions-aquatrack.png',
        description: 'Not defined'
    }
};
