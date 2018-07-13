'use strict';

let express = require('express'),
    bodyParser = require('body-parser'),
	voya401k = require('./voya401k');

let app = express();

app.set('port', process.env.PORT || 3000);

app.use(express.static('public'));

app.use(bodyParser.json({
    verify: function getRawBody(req, res, buf) {
        req.rawBody = buf.toString();
    }
}));


app.get('/', function(req, res) {
    res.json({ message: 'The forecaster is up and running.', since: (new Date()).toString() });
});

app.post('/forecast', verify, function(req, res) {
    // We'll fill this out later!
	console.log('Forecaster is up and running on port %d', req.body.request.type);
    res.json({
			response: {
				outputSpeech: {
					type: 'PlainText',
					text: 'Hi Srini, how can I help you with your Voya 401(K) Savings Plan today'
				},
				shouldEndSession: true
			}
        });
});

//app.post('/forecast', verify, forecaster);

app.post('/voya401k', verify, voya401k);

app.listen(app.get('port'), function() {
    console.log('Forecaster is up and running on port %d', app.get('port'));
});
