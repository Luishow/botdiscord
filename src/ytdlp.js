const { execFile, spawn } = require('child_process');
const { createWriteStream, existsSync, mkdirSync } = require('fs');
const path = require('path');
const https = require('https');

const BIN_DIR = path.join(__dirname, '..', 'bin');
const YTDLP = path.join(BIN_DIR, 'yt-dlp.exe');
const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

let ready = false;

async function ensureYtDlp() {
  if (ready) return;
  if (existsSync(YTDLP)) { ready = true; return; }

  console.log('📥 Baixando yt-dlp.exe pela primeira vez...');
  mkdirSync(BIN_DIR, { recursive: true });

  await new Promise((resolve, reject) => {
    const file = createWriteStream(YTDLP);
    const download = (url, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error('Muitos redirecionamentos'));
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return download(res.headers.location, redirectCount + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    };
    download(YTDLP_URL);
  });

  ready = true;
  console.log('✅ yt-dlp.exe baixado com sucesso!');
}

async function search(query) {
  await ensureYtDlp();
  return new Promise((resolve, reject) => {
    execFile(YTDLP, [
      `ytsearch1:${query}`,
      '--dump-json', '--no-playlist', '--quiet', '--no-warnings',
    ], { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      try {
        const info = JSON.parse(stdout.trim());
        resolve(parseInfo(info));
      } catch (e) { reject(e); }
    });
  });
}

async function getInfo(url) {
  await ensureYtDlp();
  return new Promise((resolve, reject) => {
    execFile(YTDLP, [
      url, '--dump-json', '--no-playlist', '--quiet', '--no-warnings',
    ], { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      try {
        const info = JSON.parse(stdout.trim());
        resolve(parseInfo(info));
      } catch (e) { reject(e); }
    });
  });
}

function getStream(url) {
  const proc = spawn(YTDLP, [
    url,
    '-f', 'bestaudio/best',
    '-o', '-',
    '--quiet', '--no-warnings', '--no-playlist',
  ]);
  proc.stderr.on('data', d => {
    const msg = d.toString();
    if (msg.trim()) console.error('[yt-dlp]', msg.trim());
  });
  return proc.stdout;
}

function parseInfo(info) {
  return {
    title: info.title || 'Desconhecido',
    url: info.webpage_url || info.url,
    duration: formatDuration(info.duration),
    thumbnail: info.thumbnail,
    id: info.id,
  };
}

function formatDuration(seconds) {
  if (!seconds) return 'Desconhecido';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

module.exports = { ensureYtDlp, search, getInfo, getStream };
