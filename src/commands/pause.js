const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa ou retoma a música'),

  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue || !queue.playing) {
      return interaction.reply({ content: '❌ Não há nenhuma música tocando.', ephemeral: true });
    }

    const { AudioPlayerStatus } = require('@discordjs/voice');
    if (queue.player.state.status === AudioPlayerStatus.Paused) {
      queue.resume();
      await interaction.reply('▶️ Música retomada.');
    } else {
      queue.pause();
      await interaction.reply('⏸️ Música pausada.');
    }
  },
};
