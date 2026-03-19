const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Toca uma música (YouTube, SoundCloud, URL direta)')
    .addStringOption(opt =>
      opt.setName('musica')
        .setDescription('Nome, URL do YouTube, SoundCloud ou link direto')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const query = interaction.options.getString('musica');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Você precisa estar em um canal de voz!', ephemeral: true });
    }

    const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({ content: '❌ Não tenho permissão para entrar ou falar nesse canal!', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      let player = client.lavalink.getPlayer(interaction.guildId);
      if (!player) {
        player = client.lavalink.createPlayer({
          guildId: interaction.guildId,
          voiceChannelId: voiceChannel.id,
          textChannelId: interaction.channelId,
          selfDeaf: true,
          volume: 75,
        });
      }

      if (!player.connected) await player.connect();

      // Detecta a fonte com base na query
      let source = 'ytsearch';
      if (query.includes('soundcloud.com')) source = 'soundcloud';
      else if (query.includes('youtube.com') || query.includes('youtu.be')) source = 'youtube';
      else if (query.startsWith('http')) source = 'http';

      const res = await client.lavalink.search(
        { query, source },
        interaction.user
      );

      if (!res || !res.tracks?.length) {
        return interaction.editReply('❌ Nenhuma música encontrada.');
      }

      if (res.loadType === 'playlist') {
        await player.queue.add(res.tracks);
        await interaction.editReply(`✅ Playlist adicionada: **${res.playlist?.name}** (${res.tracks.length} músicas)`);
      } else {
        const track = res.tracks[0];
        await player.queue.add(track);
        const pos = player.queue.tracks.length;
        if (!player.playing) {
          await interaction.editReply(`▶️ Tocando: **${track.info.title}** (${formatDuration(track.info.length)})`);
        } else {
          await interaction.editReply(`✅ Adicionado à fila: **${track.info.title}** (${formatDuration(track.info.length)}) — Posição #${pos}`);
        }
      }

      if (!player.playing) await player.play();

    } catch (error) {
      console.error('Erro no comando play:', error);
      await interaction.editReply('❌ Ocorreu um erro ao buscar ou reproduzir a música.');
    }
  },
};

function formatDuration(ms) {
  if (!ms) return 'Desconhecido';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
