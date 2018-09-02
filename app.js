const express = require('express');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'static', 'img');
let images = [];

function loadImages() {
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error(err);
    } else {
      images = files.filter(x => /\.jpg$/i.test(x));
      console.log(`Loaded images - there are ${images.length} Bonnies.`);
    }
  });
}

fs.watch(imagesDir, { persistent: false }, loadImages);
loadImages();

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/vids', (request, response) => {
  const image = images[Math.floor(Math.random() * images.length)];
  response.render('vids', { image });
});

app.get('/', (request, response) => {
  if (!images.length) {
    response.status(500).send('no images');
  } else {
    const image = images[Math.floor(Math.random() * images.length)];
    response.render('pics', { image });
  }
});

app.use('/', express.static(path.join(__dirname, 'static')));

module.exports = app;
