const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Mostra a fila de músicas'),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: '❌ A fila está vazia.', ephemeral: true });
    }

    const current = player.queue.current;
    const tracks = player.queue.tracks;

    const embed = new EmbedBuilder()
      .setTitle('🎵 Fila de Músicas')
      .setColor(0x5865F2)
      .addFields({
        name: '▶️ Tocando agora',
        value: `**${current.info.title}** (${formatDuration(current.info.length)})`,
      });

    if (tracks.length > 0) {
      const upcoming = tracks.slice(0, 10)
        .map((t, i) => `**${i + 1}.** ${t.info.title} (${formatDuration(t.info.length)})`)
        .join('\n');
      embed.addFields({ name: `📋 Próximas (${tracks.length})`, value: upcoming });
    }

    embed.setFooter({
      text: `Loop: ${player.repeatMode !== 'off' ? '✅' : '❌'} | Volume: ${player.volume}%`,
    });

    await interaction.reply({ embeds: [embed] });
  },
};

function formatDuration(ms) {
  if (!ms) return 'Desconhecido';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
