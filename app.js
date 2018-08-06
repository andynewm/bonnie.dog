var express =  require('express');
var fs = require('fs');
var path = require('path');

function getServer(images) {
  var app = express();
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');
  app.use('/', express.static(path.join(__dirname, 'static')));

  app.get('/', function(request, response) {
    response.render('index', { images: shuffle(images) });
  });

  return app;
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    let j = Math.floor(Math.random() * (i + 1))
    let temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }

  return copy;
}

function start(port, callback) {
  fs.readdir(path.join(__dirname, 'static', 'img'), function (err, files) {
    var server = getServer(files.filter(x => /\.jpg$/i.test(x)));
    server.listen(port, callback);
  });
}

exports.start = start;