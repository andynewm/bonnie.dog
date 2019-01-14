const express = require('express');
const fs = require('fs');
const path = require('path');
const loadVideos = require('./videos');
const arrayUtils = require('./arrayUtils');
const sharp = require('sharp');
const bodyParser = require('body-parser');

const getPassword = () => process.env.password || 'bonnie';

const imagesDir = path.join(__dirname, 'static', 'img');
let images = [],
  videos = [];

const getNumber = filename => Number(filename.replace(/\D/g, ''));

function loadImages() {
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error(err);
    } else {
      images = files
        .filter(x => /\.jpg$/i.test(x) && !/\.preview\.jpg$/.test(x))
        .sort((a, b) => getNumber(a) - getNumber(b));
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
app.use(bodyParser.raw({ type: 'image/jpeg', limit: '20MB' }));
app.post('/admin/pic', async (request, response) => {
  const password = getPassword();
  if (password !== request.header('password')) {
    response.status('401').send();
    return;
  }

  const sha = sharp(request.body);

  const fileName =
    Math.max(
      0,
      ...images.map(x => Number(x.slice(0, -4))).filter(x => !isNaN(x)),
    ) + 1;

  await Promise.all([
    sha
      .clone()
      .resize(2000, 2000, { withoutEnlargement: true, fit: 'outside' })
      .jpeg({ quality: 93 })
      .toFile(path.join(__dirname, 'static', 'img', `${fileName}.jpg`)),
    sha
      .clone()
      .resize(300, 300, { withoutEnlargement: true, fit: 'outside' })
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, 'static', 'img', `${fileName}.preview.jpg`)),
  ]);

  const url = `${fileName}.jpg`;

  images.push(url);

  response.status(201).json({ url });
});

app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/', express.static(path.join(__dirname, 'static')));

app.post('/admin/password', (request, response) => {
  const password = getPassword();
  response.status(request.body.password === password ? 204 : 401).send();
});

app.get('/admin', (request, response) => {
  response.render('admin', { images });
});

app.get('/admin/images', (request, response) => {
  response.json(images);
});

app.get('/vids', (request, response) => {
  const vids = {
    mp4: { init: videos.mp4.init, parts: getShuffled(videos.mp4.parts) },
    webm: { init: videos.webm.init, parts: getShuffled(videos.webm.parts) },
  };

  response.render('vids', { vids });
});

function getShuffled(parts) {
  const shuffledVideos = arrayUtils.shuffle(parts);

  return {
    [360]: arrayUtils.flatten(shuffledVideos.map(x => x['360'])),
    [580]: arrayUtils.flatten(shuffledVideos.map(x => x['580'])),
    [720]: arrayUtils.flatten(shuffledVideos.map(x => x['720'])),
  };
}

app.get('/', (request, response) => {
  if (!images.length) {
    response.status(500).send('no images');
  } else {
    let image;
    if (request.query.i) {
      image = request.query.i + '.jpg';
    } else {
      image = images[Math.floor(Math.random() * images.length)];
    }
    response.render('pics', { image });
  }
});

module.exports = app;
