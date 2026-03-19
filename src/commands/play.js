const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdlp = require('../ytdlp');
const MusicQueue = require('../MusicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Toca uma música do YouTube')
    .addStringOption(opt =>
      opt.setName('musica')
        .setDescription('Nome ou URL da música')
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
      const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
      const info = isUrl ? await ytdlp.getInfo(query) : await ytdlp.search(query);

      if (!info) {
        return interaction.editReply('❌ Nenhuma música encontrada.');
      }

      const songInfo = {
        title: info.title,
        url: info.url,
        duration: info.duration,
        thumbnail: info.thumbnail,
        getStream: () => ytdlp.getStream(info.url),
      };

      // Conecta ao canal de voz
      let queue = client.queues.get(interaction.guildId);
      if (!queue) {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        try {
          await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        } catch {
          connection.destroy();
          return interaction.editReply('❌ Não consegui conectar ao canal de voz.');
        }

        queue = new MusicQueue(voiceChannel, interaction.channel, connection);
        client.queues.set(interaction.guildId, queue);

        connection.on(VoiceConnectionStatus.Destroyed, () => {
          client.queues.delete(interaction.guildId);
        });
      }

      queue.enqueue(songInfo);

      if (queue.songs.length === 1) {
        await interaction.editReply(`▶️ Tocando: **${songInfo.title}** (${songInfo.duration})`);
      } else {
        await interaction.editReply(`✅ Adicionado à fila: **${songInfo.title}** (${songInfo.duration}) — Posição #${queue.songs.length}`);
      }
    } catch (error) {
      console.error('Erro no comando play:', error);
      await interaction.editReply('❌ Ocorreu um erro ao buscar ou reproduzir a música.');
    }
  },
};
