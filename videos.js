const fs = require('fs');
const path = require('path');

const videoDir = path.join('static', 'vid', 'webm');

function readdir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) {
        console.error(err);
        resolve([]);
      } else {
        resolve(files);
      }
    });
  });
}

async function loadVideos() {
  const dirs = await readdir(videoDir);
  return await Promise.all(dirs.map(checkFolder)).then(x => x.filter(y => y));
}

async function checkFolder(tt) {
  const files = await readdir(path.join(videoDir, tt));
  const sections720 = getSections(files, '720');

  if (sections720.length) {
    const t = x => path.join('vid', 'webm', tt, x);
    const sections580 = getSections(files, '580');
    const sections360 = getSections(files, '360');

    return {
      [720]: sections720.map(t),
      [580]: sections580.map(t),
      [360]: sections360.map(t)
    };
  }

  return null;
}

function getSections(files, res) {
  return files
    .map(x => RegExp(`^\(\\d+)\\.${res}\\.chk$`).exec(x))
    .filter(x => x)
    .map(x => ({ name: x[0], order: Number(x[1]) }))
    .sort((a, b) => a.order - b.order)
    .map(x => x.name);
}

module.exports = loadVideos;
