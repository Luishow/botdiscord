const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
} = require('@discordjs/voice');

class MusicQueue {
  constructor(voiceChannel, textChannel, connection) {
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.connection = connection;
    this.songs = [];
    this.loop = false;
    this.volume = 0.5;
    this.playing = false;

    this.player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    this.connection.subscribe(this.player);

    this.player.on(AudioPlayerStatus.Idle, () => {
      if (this.loop && this.songs.length > 0) {
        this.songs.push(this.songs[0]);
      }
      this.songs.shift();
      if (this.songs.length > 0) {
        this.play();
      } else {
        this.playing = false;
        this.textChannel.send('✅ Fila de músicas encerrada.');
      }
    });

    this.player.on('error', error => {
      console.error('Erro no player:', error);
      this.songs.shift();
      if (this.songs.length > 0) this.play();
    });
  }

  enqueue(song) {
    this.songs.push(song);
    if (!this.playing) {
      this.playing = true;
      this.play();
    }
  }

  async play() {
    const song = this.songs[0];
    if (!song) return;

    try {
      const stream = song.getStream();
      const resource = createAudioResource(stream, { inlineVolume: true });
      resource.volume.setVolume(this.volume);
      this.player.play(resource);
      this.textChannel.send(`▶️ Tocando agora: **${song.title}**`);
    } catch (error) {
      console.error('Erro ao iniciar reprodução:', error);
      this.textChannel.send(`❌ Erro ao reproduzir **${song.title}**. Pulando...`);
      this.songs.shift();
      if (this.songs.length > 0) this.play();
    }
  }

  skip() {
    this.player.stop();
  }

  stop() {
    this.songs = [];
    this.loop = false;
    this.player.stop();
    this.connection.destroy();
  }

  pause() {
    this.player.pause();
  }

  resume() {
    this.player.unpause();
  }

  setVolume(vol) {
    this.volume = vol / 100;
    if (this.player.state.resource) {
      this.player.state.resource.volume.setVolume(this.volume);
    }
  }
}

module.exports = MusicQueue;
