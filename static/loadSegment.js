export async function loadSegment(url) {
  const start = Date.now();
  const data = await fetch(url).then(r => r.arrayBuffer());
  const durationMs = Date.now() - start;
  console.log(`${url} (${data.byteLength}) loaded in ${durationMs}ms`);
  console.log(
    `effective bit rate ${Math.floor((8000 * data.byteLength) / durationMs)}`
  );

  return data;
}
