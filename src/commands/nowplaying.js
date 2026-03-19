const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Mostra a música tocando agora'),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: '❌ Não há nenhuma música tocando.', ephemeral: true });
    }

    const track = player.queue.current;
    const pos = player.position;
    const dur = track.info.length;

    const embed = new EmbedBuilder()
      .setTitle('🎵 Tocando Agora')
      .setDescription(`**[${track.info.title}](${track.info.uri})**`)
      .setColor(0x5865F2)
      .addFields(
        { name: '⏱️ Progresso', value: `${formatDuration(pos)} / ${formatDuration(dur)}`, inline: true },
        { name: '🔁 Loop', value: player.repeatMode !== 'off' ? '✅' : '❌', inline: true },
        { name: '🔊 Volume', value: `${player.volume}%`, inline: true },
      );

    if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);

    await interaction.reply({ embeds: [embed] });
  },
};

function formatDuration(ms) {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
