const { Innertube } = require('youtubei.js');
const { Readable } = require('stream');

let innertube = null;

async function getInnertube() {
  if (!innertube) {
    innertube = await Innertube.create({ generate_session_locally: true });
  }
  return innertube;
}

async function search(query) {
  const yt = await getInnertube();
  const results = await yt.search(query, { type: 'video' });
  const video = results.videos[0];
  if (!video) return null;
  return {
    id: video.id,
    title: video.title?.text || 'Desconhecido',
    url: `https://www.youtube.com/watch?v=${video.id}`,
    duration: video.duration?.text || 'Desconhecido',
  };
}

async function getInfo(url) {
  const yt = await getInnertube();
  const id = extractId(url);
  const info = await yt.getInfo(id);
  return {
    id,
    title: info.basic_info.title || 'Desconhecido',
    url: `https://www.youtube.com/watch?v=${id}`,
    duration: formatSeconds(info.basic_info.duration),
    thumbnail: info.basic_info.thumbnail?.[0]?.url,
    _info: info,
  };
}

async function getStream(idOrUrl) {
  const yt = await getInnertube();
  const id = extractId(idOrUrl);
  const info = await yt.getInfo(id);
  const webStream = await info.download({
    type: 'audio',
    quality: 'best',
    format: 'any',
  });
  return Readable.fromWeb(webStream);
}

function extractId(urlOrId) {
  if (urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')) {
    const match = urlOrId.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : urlOrId;
  }
  return urlOrId;
}

function formatSeconds(seconds) {
  if (!seconds) return 'Desconhecido';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

module.exports = { search, getInfo, getStream };
