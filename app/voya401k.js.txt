'use strict';

let request = require('request');
var XLSX = require('xlsx');
const inputId = '2222';
const VERSION = '1.0';

module.exports = function(req, res) {

    console.log('New request for the Voya 401k:\n', req.body);

    if (req.body.request.type === 'LaunchRequest') {
		
		res.json(
            buildResponse(
                {},
                '<speak>Welcome to Voya 401k service, to get started please say the four digit PIN you setup to enabling the skill? </speak>',
                {},
				'<speak>to get started please say the four digit PIN you setup to enabling the skill?</speak>',
                false
            )
        );

	else if (req.body.request.type === 'IntentRequest' ) {
		
		if (req.body.request.intent.name === 'VoyaPINIntent') {
			var dataRow = readData(req.body.request.intent.slots.pin.value);
			if (dataRow) {
				var greet = "";
				var currentTime = new Date();
				var hrs = currentTime.getHours();
				res.json(
					buildResponse(
						{voayPin : dataRow.No},
						'<speak>Hi '+dataRow.FirstName+', '+greet+'!! how can I help you with your ' +dataRow.PlanName+ ' today</speak>',
						{},
						'<speak>You can say, things like tell me how my account is doing? </speak>',
						false
					)
				);
			} 
		} else if ( req.body.session.attributes ) {
			var dataRow = readData(req.body.session.attributes.voayPin);
				var value = new Date();
				var dateVal =  value.getMonth()+1 + "/" + value.getDate() + "/" + value.getFullYear();
				res.json( 
					buildResponse( 
						{ questionNo: '1', voayPin : dataRow.No }, 
						'<speak>Sure '+dataRow.FirstName+', As of '+dateVal+', your account balance is '+dataRow.Accountbalance+'. Your rate of return for the past 12 months is '+dataRow.PersonalRateofReturn+', which is above the average portfolio benchmark for this period. Nice job making your money work for you! It looks like you are currently projected to have enough money to retire at age '+dataRow.ActualAge+'. Would you like to hear suggestions to be able retire a little sooner?</speak>', 
						{}, 
						'<speak>Would you like to hear suggestions to be able retire a little sooner?</speak>',
						false )
					);
			
			} else if (req.body.request.intent.name === 'VoyaNoIntent') {
				res.json( 
						buildResponse( 
							{}, 
							'<speak>Ok '+dataRow.FirstName+'!, I understand thank you for using Voya 401k service, have a nice day!</speak>', 
							{}, 
							'',
							true )
						);
				
			} else if (req.body.request.type === 'HelpIntent') {
				res.json(
					buildResponse(
						{},
						'<speak>Welcome to Voya 401k service, you can ask me in different ways like Please tell me how my account is doing?</speak>',
						{},
						'',
						false
					)
				);

			} else if (req.body.request.type === 'StopIntent' || req.body.request.type === 'CancelIntent') {
				res.json(
					buildResponse(
						{},
						'<speak>Ok, thank you for using Voya 401k service, have a nice day! </speak>',
						{},
						'',
						true
					)
				);

			} else {
				res.json( 
					buildResponse( 
						{}, 
						'<speak>Ok, thank you for using Voya 401k service, have a nice day!</speak>', 
						{}, 
						'',
						true )
				);
			}
		} else {
			res.json(
				buildResponse(
					{},
					'<speak>Invalid PIN or No Account setup!</speak>',
					{},
					'',
					true
				)
			);
		}
    } else {
        console.error('Intent not implemented: ', req.body);
        res.status(504).json({ message: 'Intent Not Implemented' });
    }

};

function readData(id) {
	//console.log('id: ', id);
	var workbook = XLSX.readFile('./Master.xlsx');
	var sheet_name_list = workbook.SheetNames;
	var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
	//console.log(xlData);
	var outData;
	xlData.forEach(function(row) { 
		//console.log(row.No);
		if (id == row.No) {
			//console.log('inside loop:', row.No);
		}
	});
	
	return outData;
    
}

function buildResponse(session, speech, card, reprompt, end) {
    return {
        version: VERSION,
        sessionAttributes: session,
        response: {
            outputSpeech: {
                type: 'SSML',
                ssml: speech
            },
			reprompt : {
				outputSpeech: {
					type: 'SSML',
					ssml: reprompt
				}
			},
            //card: card,
            shouldEndSession: !!end
        }
    };
}