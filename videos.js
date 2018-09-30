const fs = require('fs');
const path = require('path');

const mp4Dir = path.join('static', 'vid', 'mp4');
const wembDir = path.join('static', 'vid', 'webm');

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

async function loadVideos(root) {
  const dirs = await readdir(root);
  return await Promise.all(dirs.map(checkFolder(root))).then(x =>
    x.filter(y => y)
  );
}

async function load() {
  return {
    webm: {
      init: 'vid/webm/init.webm',
      parts: await loadVideos(wembDir)
    },
    mp4: {
      init: 'vid/mp4/init.mp4',
      parts: await loadVideos(mp4Dir)
    }
  };
}

const checkFolder = root => async folder => {
  const folderPath = path.join(root, folder);
  const files = await readdir(folderPath);
  const sections720 = getSections(files, '720');

  if (sections720.length) {
    const dropStatic = x =>
      path.join(...folderPath.split(path.sep).slice(1), x);
    const sections580 = getSections(files, '580');
    const sections360 = getSections(files, '360');

    return {
      [720]: sections720.map(dropStatic),
      [580]: sections580.map(dropStatic),
      [360]: sections360.map(dropStatic)
    };
  }

  return null;
};

function getSections(files, res) {
  return files
    .map(x => RegExp(`^\(\\d+)\\.${res}\\.chk$`).exec(x))
    .filter(x => x)
    .map(x => ({ name: x[0], order: Number(x[1]) }))
    .sort((a, b) => a.order - b.order)
    .map(x => x.name);
}

module.exports = load;
