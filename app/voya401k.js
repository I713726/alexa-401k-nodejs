'use strict';

let request = require('request');
var XLSX = require('xlsx');
const inputId = '2222';
const VERSION = '1.0';


/**
Question Numbers:
    0 - PIN
    1 - Would you like to hear suggestions to help you retire sooner?
    2 - reccomends that you increase savings by 2%, yes/no
    3 - option to save 1% more a year from now
**/

module.exports = function(req, res) {

    console.log('New request for the Voya 401k:\n', req.body);

    //handle launch requests
    if (req.body.request.type === 'LaunchRequest') {
		res.json(
            buildResponse(
                {questionNo: '0'},
                '<speak>Welcome to Voya 401k service, to get started please say the four digit PIN you setup to enabling the skill? </speak>',
                {},
				'<speak>to get started please say the four digit PIN you setup to enabling the skill?</speak>',
                false
            )
        );
    }
    //make sure to exit app if we get a SessionEndedRequest. Otherwise it will hang if it recieves one.
    if(req.body.request.type == 'SessionEndedRequest') {
      res.json(
          buildResponse(
            {},
            '<speak>Ok, have a nice day!</speak>',
            {},
            '',
            true )
          );
    }

  //Handle all types of intent requests in a massive nested if statement
	if (req.body.request.type === 'IntentRequest' ) {
    //handles the setting of the user's PIN in the session data
		if (req.body.request.intent.name === 'VoyaPINIntent') {
			var dataRow = readData(req.body.request.intent.slots.pin.value);
			if (dataRow) {
				var greet = "";
				var currentTime = new Date();
				var hrs = currentTime.getHours();
				res.json(
          //TODO: REMEMBER THIS IS HERE
					buildTestNotification(
						{voyaPin : dataRow.No},
						'<speak>Hi '+dataRow.FirstName+', '+greet+'!! how can I help you with your ' +dataRow.PlanName+ ' today</speak>',
						{},
						'<speak>You can say, things like tell me how my account is doing? </speak>',
						false
					)
				);
			}
      else {
        res.json(
          buildResponse(
            { questionNo: '0'},
            '<speak>Sorry, that\'s not a valid pin</speak>',
            {},
            '',
            false )
          );
      }
    }
    //Next thing to check for is if the user is trying to quit, and if so let them
    else if(req.body.request.intent.name === 'VoyaQuitIntent') {
      res.json(
          buildResponse(
            {},
            '<speak>Ok, have a nice day!</speak>',
            {},
            '',
            true )
          );
    }
    //If the user is answering no, depending on what question we are on, the result
    //should be different.
    else if (req.body.request.intent.name === 'VoyaNoIntent') {
      var dataRow = readData(req.body.session.attributes.voyaPin);
      var question = req.body.session.attributes.questionNo;
      if(question == 0) {
        res.json(
            buildResponse(
              {},
              '<speak>Ok, have a nice day!</speak>',
              {},
              '',
              true )
            );
      }
      if(question === '1') {
        res.json(
            buildResponse(
              {},
              '<speak>Ok '+dataRow.FirstName+'!, I understand thank you for using Voya 401k service, have a nice day!</speak>',
              {},
              '',
              true )
            );
      }
      else if(question === '2') {
        res.json(
            buildResponse(
              {questionNo: '3', voyaPin: dataRow.No},
              '<speak>Ok, I understand. Would you want to save more in the future? '
              +'I can sign you up to save 1% more a year from now?</speak>',
              {},
              '',
              false )
            );
      }
      else {
        res.json(
            buildResponse(
              {},
              '<speak>Ok '+dataRow.FirstName+'!, I understand thank you for using Voya 401k service, have a nice day!</speak>',
              {},
              '',
              true )
            );
      }
    }
    //Handle a yes answer based on the question number.
    else if (req.body.request.intent.name === 'VoyaYesIntent') {
      var question = req.body.session.attributes.questionNo;
      if(question == '0') {
        res.json(
          buildResponse(
            {questionNo: '0'},
            '<speak>OK, just say the PIN</speak>',
            {},
            '',
            false)
        );
      }
      var dataRow = readData(req.body.session.attributes.voyaPin);
      if(question === '1') {
        res.json(
          buildResponse(
            //maybe we should calculate these values instead of pulling them
            //from the spreadsheet
            {questionNo: '2', voyaPin : dataRow.No},
            '<speak>You are doing a great job of saving '
             + dataRow.CurrentSaving + ' from your pay.' +
             ' if you increase your savings rate to' + dataRow.IncreaseSaving +
             ' you could retire at age ' + dataRow.ActualAge + '. Would you like to'
             +' increase your savings rate by '+ dataRow.SavingsRate + ' now?'
             + '</speak>',
            {},
            '',
            false)
        );
      }
      else if(question === '2' || question === '3') {
        res.json(
          buildResponse(
            {voyaPin : dataRow.No},
            '<speak>OK, great. I\'ve done that for you. Congratulations,' +
            ' your future self will thank you!</speak>',
            {},
            '',
            true)
        );
      }
      else {
        res.json(
        buildResponse(
          {questionNo: question, voyaPin : dataRow.No},
          '<speak>I\'m sorry?</speak>',
          {},
          '',
          false)
      );
      }
    }
    //Check to see if the pin is uninitialized. If the pin is uninitialized, all
    //of the previously checked intents should still be interpreted, but anything
    //else could be interpreted as an invalid pin.
    else if (!req.body.session.attributes.hasOwnProperty('voyaPin')) {
      res.json(
        buildResponse(
          {},
          '<speak>Sorry, that\'s not a valid pin</speak>',
          {},
          '',
          false )
        );
    }
    //Handle an account inquiry, this gives an account summary.
    else if ( req.body.request.intent.name === 'VoyaHowMyAccountIntent' ) {
			var dataRow = readData(req.body.session.attributes.voyaPin);
				var value = new Date();
				var dateVal =  value.getMonth()+1 + "/" + value.getDate() + "/" + value.getFullYear();
				res.json(
					buildResponse(
						{ questionNo: '1', voyaPin : dataRow.No },
						'<speak>Sure '+dataRow.FirstName+', As of '+dateVal+', your account balance is '+dataRow.Accountbalance+'. Your rate of return for the past 12 months is '+dataRow.PersonalRateofReturn+', which is above the average portfolio benchmark for this period. Nice job making your money work for you! It looks like you are currently projected to have enough money to retire at age '+dataRow.ActualAge+'. Would you like to hear suggestions to be able retire a little sooner?</speak>',
						{},
						'<speak>Would you like to hear suggestions to be able retire a little sooner?</speak>',
						false )
					);

			}
      //if the user asks for help
      else if (req.body.request.type === 'HelpIntent') {
				res.json(
					buildResponse(
						{},
						'<speak>Welcome to Voya 401k service, you can ask me different things, like Please tell me how my account is doing?</speak>',
						{},
						'',
						false
					)
				);
        //basically the same thing as the VoyaQuitIntent
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
      }
    }
  }


//This function reads data from the spreadsheet
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
      outData = row;
		}
	});

	return outData;

}

//builds a JSON response based on the given parameters.
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

function buildTestNotification(session, speech, card, reprompt, end) {
    return {
        version: VERSION,
        sessionAttributes: session,
        response: {
            outputSpeech: {
                type: 'SSML',
                ssml: speech
            },
            directive: {
                header: {
                    namespace: Notifications,
                    name: SetIndicator,
                    messageId: 'test'
                },
                payload: {
                    persistVisualIndicator: true,
                    playAudioIndicator: false
                    /*
                    asset: {
                        assetId: {{STRING}},
                        url: {{STRING}}
                          }
                        }
                      }
                      */
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
