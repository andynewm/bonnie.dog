var app = require('./app');

var server = app.start(8080, () => { console.log('bonnie started'); });