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
                            {name: 'Disposable gloves', image: './assets/instructions/equipment-gloves.jpg'},
                            {name: 'Splash resistant goggles', image: './assets/instructions/equipment-goggles.jpg'},
                            {name: 'Disposable shoe covers or adequate shoes'},
                            {name: 'Disposable laboratory coats'}
                        ]
                    },
                    {
                        section: 'In-field analysis',
                        description: 'There are some materials which may be necessary during the in-field analysis. Those materials are listed below.',
                        checklistItems: [
                            {name: 'Antiseptic wipes'},
                            {name: 'Squirt bottle with rinse water'},
                            {name: 'Paper towels'},
                            {name: 'Flashlight/headlamp'},
                            {name: 'Device for grab sampling (in case samples are collected in a large waterbody)'}
                        ]
                    },
                    {
                        section: ' PathoTeSTICK field test kit',
                        description: 'It is necessary to check that the PathoTeSTICK field test kit is complete, and that it contains the following material:',
                        checklistItems: [
                            {name: 'Disposable 10 mL plastic sample containers (4)'},
                            {name: 'PathoTeSTICK (disposable sticks - supplied in separate containers, labelled depending on the pathogen that can be detected with each one)'},
                            {name: 'Mini-potentiostat - powered by the Smartphone (not disposable)'},
                            {name: 'Smartphone with the application installed'}
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
        name: 'AQUA-Sense1',
        image: './assets/instructions/instructions-aquasense.png',
        description: '',
        instructions: [
            {
                type: 'commissioning',
                name: 'Start-up of AQUA-Sense1',
                items: [
                    {
                        section: 'Connect hardware',
                        image: './assets/instructions/instructions-aquasense-inside.jpg',
                        steps: [
                            'Connect a partial flow 2-3 litres/min, through a stop/open valve, having a pressure of 1-2 bars of your filtered water or drinking water stream to the inlet of AQUA-Sense1 (AQ-S)',
                            'Connect AQ-S to 230V AC power connection',
                            'Connect the sampler unit AQUA-Sampler (water in and water out to AQUA-Sense1) water out to drain',
                            'Connect AQUA-Sampler to 230V AC power connection on the wall',
                            'Connect the AQUA-sampler with AQUA-Sense1 with the grey cable.'
                        ]
                    },
                    {
                        section: 'Start software',
                        image: './assets/instructions/instructions-aquasense-software.jpg',
                        steps: [
                            'Press the start key of the sensor, after a blip sound the system runs and numerical values will appear on the monitor of sensor. If the flow is not around 60 ml/min adjust by lifting the flow regulator for higher flow or lowering the flow regulator to get a lower flow. Adjust the flow to around 60 +/- 2 ml/min.',
                            'Start the PC and log in with: !WaterFall75. Two measuring points will appear as two dots of different colour on the screen, after 10 dots, it will be combined with a line and below in the left corner values will appear in black as CH-1 & CH-2. Adjust the scale in the Y axis in the Graph settings to the right at the screen of PC by pressing the arrows up or down and then press Apply.',
                            'Different colours for the lines can be set in the square Serie by clicking under colour.'
                        ]
                    },
                    {
                        section: 'Sample for 15 minutes',
                        image: './assets/instructions/instructions-aquasense-sampler.jpg',
                        steps: [
                            'Let the system run with the flow of water for about 15 minutes, dis-regard the initial values, 15-20 minutes are required for stability.',
                            'You can either draw the alarm line (-----) on the screen by pointing at the alarm level with the pencil and draw the line up or down. Or you can log in to Settings with the password security 3422. You choose alarm line Threshold above 10% of your current measured values for Cluster 1, likewise for cluster 2.',
                            'If the measured values go above the alarm line the system will react and capture water sample for analyse and alarm the operator.'
                        ]
                    },
                    {
                        section: 'Define alarm receivers',
                        steps: [
                            'Alarm Types you can choose SMS Delay (minutes) if you want 0 Sample Delay (minutes) or choose another number.',
                            'Install a SIM card in the modem and place the Antenna at the top of the AQUA-Sense free from other electrical disturbances. Connect to your network.',
                            'In the program set the name and the mobile number to whom the message should go. Also choose which alarm type should be sent.'
                        ]
                    }
                ]
            }
        ]
    }
};
