var fs = require('fs');
var path = require('path');
var sharp = require('sharp');

getFiles().then(function(files) {
  files.forEach(function (file, index) {
    const pp = path.join(__dirname, 'incoming-imgs', file);

    /*sharp(pp)
      .resize(1500, 1500)
      .withoutEnlargement()
      .min()
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, 'static', 'img', 'resized', `${154 + index}.jpg`));*/

    sharp(pp)
      .resize(2000, 2000)
      .withoutEnlargement()
      .min()
      .jpeg({ quality: 93 })
      .toFile(path.join(__dirname, 'static', 'img', 'resized', `${index + 1}.jpg`));
  });
})



function getFiles() {
  const dir = path.join(__dirname, 'incoming-imgs');
  return new Promise(function(resolve, reject) {
    fs.readdir(dir, (err, files) => {
      resolve(files.filter(file => /\.jpg$/i.test(file)));
    });
  });
}