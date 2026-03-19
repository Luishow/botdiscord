const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Mostra a música tocando agora'),

  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue || !queue.playing || !queue.songs[0]) {
      return interaction.reply({ content: '❌ Não há nenhuma música tocando.', ephemeral: true });
    }

    const song = queue.songs[0];
    const embed = new EmbedBuilder()
      .setTitle('🎵 Tocando Agora')
      .setDescription(`**[${song.title}](${song.url})**`)
      .setColor(0x5865F2)
      .addFields(
        { name: '⏱️ Duração', value: song.duration, inline: true },
        { name: '🔁 Loop', value: queue.loop ? 'Ativado' : 'Desativado', inline: true },
        { name: '🔊 Volume', value: `${Math.round(queue.volume * 100)}%`, inline: true },
      );

    if (song.thumbnail) embed.setThumbnail(song.thumbnail);

    await interaction.reply({ embeds: [embed] });
  },
};
