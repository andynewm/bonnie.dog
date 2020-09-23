const fs = require('fs');
const path = require('path');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const fetch = require('node-fetch');
const loadVideos = require('./videos');
const arrayUtils = require('./arrayUtils');

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'https://bonnie.dog/auth'
);

const scopes = ['https://www.googleapis.com/auth/photoslibrary.readonly'];

const imagesDir = path.join(__dirname, 'static', 'img');
let images = [],
  videos = [];

const getNumber = (filename) => Number(filename.replace(/\D/g, ''));

function loadImages() {
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error(err);
    } else {
      images = files
        .filter(
          (x) =>
            /\.jpg$/i.test(x) &&
            !/\.preview\.jpg$/.test(x) &&
            !/^\d+\.jpg/.test(x)
        )
        .sort((a, b) => getNumber(a) - getNumber(b));
      console.log(`Loaded images - there are ${images.length} Bonnies.`);
    }
  });
}

fs.watch(imagesDir, { persistent: false }, loadImages);
loadImages();
loadVideos().then((x) => {
  videos = x;
});

const app = express();

app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/', express.static(path.join(__dirname, 'static')));

app.get('/login', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  res.redirect(url);
});

let refreshToken, authToken;

const albumId =
  'AG6mhQ7aCVGwPKnj-0rBhiUK60al7AmcaMUYPrT6oC3__ZzwdEnsAtKqgOB6bNpgm3G2py9GWisz';

app.get('/auth', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);

  authToken = tokens.access_token;
  refreshToken = tokens.refresh_token;

  console.log('rf', tokens);

  res.redirect('/sync');
});

let syncingBonnies = false;

const syncBonnies = async () => {
  let response,
    newBonnies = [];

  do {
    response = await fetch(
      'https://photoslibrary.googleapis.com/v1/mediaItems:search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          albumId: albumId,
          pageSize: '100',
          pageToken: response ? response.nextPageToken : undefined,
        }),
      }
    ).then((x) => x.json());

    for (let mediaItem of response.mediaItems) {
      const result = await download(mediaItem);
      if (result) {
        newBonnies.push(result);
      }
    }
  } while (response.nextPageToken);

  return newBonnies;
};

const getNewToken = async () => {
  const { tokens } = await oauth2Client.refreshToken(refreshToken);
  authToken = tokens.access_token;
  console.log(tokens);
};

app.get('/sync', async (req, res) => {
  if (!refreshToken) {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });

    return res.redirect(url);
  }

  await getNewToken();

  if (syncingBonnies) {
    return res.send('already syncing');
  }

  syncingBonnies = true;
  try {
    const newBonnies = await syncBonnies();
    res.render('refresh', { newBonnies });
  } catch {
    res.send('error');
  } finally {
    syncingBonnies = false;
  }
});

const download = async (mediaItem) => {
  const filepath = path.join(__dirname, 'static', 'img', `${mediaItem.id}.jpg`);

  if (fs.existsSync(filepath)) {
    console.log('exists');
    return false;
  }

  const { width, height } = getDims(
    mediaItem.mediaMetadata.width,
    mediaItem.mediaMetadata.height
  );

  const dl = await fetch(`${mediaItem.baseUrl}=w${width}-h${height}`);
  const preview = await fetch(`${mediaItem.baseUrl}=w${200}-h${200}`);

  if (dl.ok && preview.ok) {
    await streamPipeline(dl.body, fs.createWriteStream(filepath));
    const previewBuffer = await preview.buffer();
    return previewBuffer.toString('base64');
  } else {
    console.log(dl);
    return false;
  }
};

const getDims = (width, height) => {
  const peg = 2000;
  if (width > height) {
    const rHeight = Math.min(peg, height);
    const ratio = rHeight / height;
    const rWidth = Math.ceil(ratio * width);

    return { width: rWidth, height: rHeight };
  } else {
    const rWidth = Math.min(peg, width);
    const ratio = rWidth / width;
    const rHeight = Math.ceil(ratio * height);

    return { width: rWidth, height: rHeight };
  }
};

app.get('/vids', (request, response) => {
  const vids = {
    mp4: { init: videos.mp4.init, parts: getShuffled(videos.mp4.parts) },
    webm: { init: videos.webm.init, parts: getShuffled(videos.webm.parts) },
  };

  response.render('vids', { vids });
});

app.get('/slideshow', (request, response) => {
  const shuffledImages = arrayUtils.shuffle(images);
  response.render('slideshow', { images: shuffledImages });
});

function getShuffled(parts) {
  const shuffledVideos = arrayUtils.shuffle(parts);

  return {
    [360]: arrayUtils.flatten(shuffledVideos.map((x) => x['360'])),
    [580]: arrayUtils.flatten(shuffledVideos.map((x) => x['580'])),
    [720]: arrayUtils.flatten(shuffledVideos.map((x) => x['720'])),
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
