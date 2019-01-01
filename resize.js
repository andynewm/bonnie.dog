var fs = require('fs');
var path = require('path');
var sharp = require('sharp');

getFiles().then(files => {
  files.forEach(file => {
    sharp(path.join(__dirname, 'static', 'img', file))
      .resize(300, 300)
      .withoutEnlargement()
      .min()
      .jpeg({ quality: 90 })
      .toFile(
        path.join(
          __dirname,
          'static',
          'img',
          `${file.slice(0, -4)}.preview.jpg`
        )
      );
  });
});

function getFiles() {
  const dir = path.join(__dirname, 'static/img');
  return new Promise(function(resolve, reject) {
    fs.readdir(dir, (err, files) => {
      resolve(files.filter(file => /\.jpg$/i.test(file)));
    });
  });
}
