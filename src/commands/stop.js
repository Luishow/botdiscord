const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Para a música e sai do canal de voz'),

  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue) {
      return interaction.reply({ content: '❌ Não há nenhuma música tocando.', ephemeral: true });
    }

    queue.stop();
    client.queues.delete(interaction.guildId);
    await interaction.reply('⏹️ Música parada e saí do canal de voz.');
  },
};
