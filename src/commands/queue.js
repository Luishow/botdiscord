const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Mostra a fila de músicas'),

  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '❌ A fila está vazia.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 Fila de Músicas')
      .setColor(0x5865F2);

    const current = queue.songs[0];
    embed.addFields({ name: '▶️ Tocando agora', value: `**${current.title}** (${current.duration})` });

    if (queue.songs.length > 1) {
      const upcoming = queue.songs.slice(1, 11).map(
        (s, i) => `**${i + 1}.** ${s.title} (${s.duration})`
      ).join('\n');
      embed.addFields({ name: `📋 Próximas (${queue.songs.length - 1})`, value: upcoming });
    }

    embed.setFooter({ text: `Loop: ${queue.loop ? '✅' : '❌'} | Volume: ${Math.round(queue.volume * 100)}%` });

    await interaction.reply({ embeds: [embed] });
  },
};
