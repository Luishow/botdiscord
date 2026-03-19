const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Alterna o modo de loop')
    .addStringOption(opt =>
      opt.setName('modo')
        .setDescription('Modo de loop')
        .setRequired(false)
        .addChoices(
          { name: '🔂 Música atual', value: 'track' },
          { name: '🔁 Fila inteira', value: 'queue' },
          { name: '➡️ Desativado', value: 'off' },
        )
    ),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player || !player.playing) {
      return interaction.reply({ content: '❌ Não há nenhuma música tocando.', ephemeral: true });
    }

    const modo = interaction.options.getString('modo');
    if (modo) {
      await player.setRepeatMode(modo);
      const msgs = { track: '🔂 Loop da música atual ativado.', queue: '🔁 Loop da fila ativado.', off: '➡️ Loop desativado.' };
      return interaction.reply(msgs[modo]);
    }

    // Sem argumento: alterna entre track → queue → off
    const ciclo = { off: 'track', track: 'queue', queue: 'off' };
    const novoModo = ciclo[player.repeatMode] || 'off';
    await player.setRepeatMode(novoModo);
    const msgs = { track: '🔂 Loop da música atual ativado.', queue: '🔁 Loop da fila ativado.', off: '➡️ Loop desativado.' };
    await interaction.reply(msgs[novoModo]);
  },
};
