const express = require('express');
const fs = require('fs');
const path = require('path');
const loadVideos = require('./videos');
const arrayUtils = require('./arrayUtils');

const imagesDir = path.join(__dirname, 'static', 'img');
let images = [],
  videos = [];

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
loadVideos().then(x => {
  videos = x;
});

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/', express.static(path.join(__dirname, 'static')));

app.get('/vids', (request, response) => {
  const vids = {
    mp4: { init: videos.mp4.init, parts: getShuffled(videos.mp4.parts) },
    webm: { init: videos.webm.init, parts: getShuffled(videos.webm.parts) }
  };

  response.render('vids', { vids });
});

function getShuffled(parts) {
  const shuffledVideos = arrayUtils.shuffle(parts);

  return {
    [360]: arrayUtils.flatten(shuffledVideos.map(x => x['360'])),
    [580]: arrayUtils.flatten(shuffledVideos.map(x => x['580'])),
    [720]: arrayUtils.flatten(shuffledVideos.map(x => x['720']))
  };
}

app.get('/', (request, response) => {
  if (!images.length) {
    response.status(500).send('no images');
  } else {
    const image = images[Math.floor(Math.random() * images.length)];
    response.render('pics', { image });
  }
});

module.exports = app;
