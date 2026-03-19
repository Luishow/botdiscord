const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Ativa ou desativa o loop da música atual'),

  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue || !queue.playing) {
      return interaction.reply({ content: '❌ Não há nenhuma música tocando.', ephemeral: true });
    }

    queue.loop = !queue.loop;
    await interaction.reply(queue.loop ? '🔁 Loop ativado.' : '➡️ Loop desativado.');
  },
};
