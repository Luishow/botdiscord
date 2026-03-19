const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta o volume (1–100)')
    .addIntegerOption(opt =>
      opt.setName('nivel')
        .setDescription('Volume de 1 a 100')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue || !queue.playing) {
      return interaction.reply({ content: '❌ Não há nenhuma música tocando.', ephemeral: true });
    }

    const vol = interaction.options.getInteger('nivel');
    queue.setVolume(vol);
    await interaction.reply(`🔊 Volume ajustado para **${vol}%**`);
  },
};
