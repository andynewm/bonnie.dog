import { loadSegment } from './loadSegment.js';

const videoTag = document.getElementById('vid');
const vids = JSON.parse(document.getElementById('videos').innerHTML);
const segments = ['vid/webm/1/720.hdr', ...vids['720']];

const mediaSource = new MediaSource();
const url = URL.createObjectURL(mediaSource);

videoTag.src = url;

let videoSourceBuffer;

mediaSource.addEventListener('sourceopen', async () => {
  videoSourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp9"');

  videoSourceBuffer.mode = 'sequence';

  const data = await loadSegment(segments.shift());
  videoSourceBuffer.appendBuffer(data);

  videoSourceBuffer.addEventListener('updateend', (...args) => {
    let timeToWait = 0;
    if (videoTag.buffered.length) {
      const timeRemaining = videoTag.buffered.end(0) - videoTag.currentTime;
      console.log(timeRemaining);
      timeToWait = Math.floor(Math.max(timeRemaining - 3, 0) * 1000);
      console.log(timeToWait);
    }
    setTimeout(async () => {
      const nextSegment = segments.shift();
      console.log('hello');
      if (nextSegment) {
        const data = await loadSegment(nextSegment);
        videoSourceBuffer.appendBuffer(data);
      } else {
        mediaSource.endOfStream();
      }
    }, timeToWait);
    console.log('updateend');
  });
});
