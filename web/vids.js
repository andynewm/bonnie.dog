import '@babel/polyfill';
import { loadSegment } from './loadSegment.js';

const videoTag = document.getElementById('vid');
const errorOutput = document.getElementById('errors');
const fullscreenButton = document.getElementById('fullscreen');
const vids = JSON.parse(document.getElementById('videos').innerHTML);
const webmMime = 'video/webm; codecs="vp9"';
const mp4Mime = 'video/mp4; codecs="avc3.64001F"';

window.addEventListener('error', ({ error }) => {
  errorOutput.innerHTML += '\n' + error.message;
});

fullscreenButton.addEventListener('click', () => {
  const requestMethod =
    videoTag.requestFullscreen ||
    videoTag.webkitRequestFullscreen ||
    videoTag.mozRequestFullScreen ||
    videoTag.msRequestFullscreen;

  if (requestMethod) {
    requestMethod.apply(document.body);
  }
});

let mode;

if (MediaSource.isTypeSupported(webmMime)) {
  mode = 'webm';
} else if (MediaSource.isTypeSupported(mp4Mime)) {
  mode = 'mp4';
}

const segments = [vids[mode].init, ...vids[mode].parts['720']];

const mediaSource = new MediaSource();
const url = URL.createObjectURL(mediaSource);

videoTag.src = url;

let videoSourceBuffer;

mediaSource.addEventListener('sourceopen', async () => {
  videoSourceBuffer = mediaSource.addSourceBuffer(
    mode == 'webm' ? webmMime : mp4Mime
  );

  videoSourceBuffer.mode = 'sequence';

  const data = await loadSegment(segments.shift());
  videoSourceBuffer.appendBuffer(data);

  videoSourceBuffer.addEventListener('updateend', (...args) => {
    let timeToWait = 0;
    if (videoTag.buffered.length) {
      const timeRemaining = videoTag.buffered.end(0) - videoTag.currentTime;
      console.log(timeRemaining);
      timeToWait = Math.floor(Math.max(timeRemaining - 3, 0) * 1000);
      videoTag.play();
      console.log(timeToWait);
    }
    setTimeout(async () => {
      const nextSegment = segments.shift();
      if (nextSegment) {
        const data = await loadSegment(nextSegment);
        videoSourceBuffer.appendBuffer(data);
      } else {
        console.log('end of stream');
        mediaSource.endOfStream();
      }
    }, timeToWait);
    console.log('updateend');
  });
});
