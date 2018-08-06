var express =  require('express');
var fs = require('fs');
var path = require('path');

function getServer(images) {
  var app = express();
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  app.get('/', function(request, response) {
    var image = images[Math.floor(Math.random() * images.length)];
    response.render('index', { image });
  });

  return app;
}

function start(port, callback) {
  fs.readdir(path.join(__dirname, 'static', 'img'), function (err, files) {
    var server = getServer(files.filter(x => /\.jpg$/i.test(x)));
    server.listen(port, callback);
  });
}

exports.start = start;