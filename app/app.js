'use strict';

let express = require('express'),
    bodyParser = require('body-parser'),
	voya401k = require('./voya401k');

let app = express();

app.set('port', process.env.PORT || 3000);

app.use(express.static('public'));

app.use(bodyParser.json({

}));


app.get('/', function(req, res) {
    res.json({ message: 'The forecaster is up and running.', since: (new Date()).toString() });
});

app.post('/voya401k', voya401k);

app.listen(app.get('port'), function() {
    console.log('Forecaster is up and running on port %d', app.get('port'));
});
