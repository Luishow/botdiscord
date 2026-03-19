require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { LavalinkClient } = require('lavalink-client');
const { readdirSync } = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Carrega os comandos
const commandsPath = path.join(__dirname, 'commands');
for (const file of readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// Inicializa o Lavalink
client.lavalink = new LavalinkClient({
  nodes: [{
    authorization: process.env.LAVALINK_PASSWORD || 'blacksbot123',
    host: process.env.LAVALINK_HOST || 'localhost',
    port: Number(process.env.LAVALINK_PORT) || 2333,
    id: 'main',
    retryAmount: 10,
    retryDelay: 3000,
  }],
  sendToShard: (guildId, payload) =>
    client.guilds.cache.get(guildId)?.shard?.send(payload),
});

client.once('clientReady', async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  await client.lavalink.init({ id: client.user.id, username: client.user.username });
});

// Repassa eventos de voz para o Lavalink
client.on('raw', data => client.lavalink.sendRawData(data));

// Evento quando uma música começa
client.lavalink.on('trackStart', (player, track) => {
  const channel = client.channels.cache.get(player.textChannelId);
  channel?.send(`▶️ Tocando agora: **${track.info.title}** (${formatDuration(track.info.length)})`);
});

// Evento quando a fila termina
client.lavalink.on('queueEnd', player => {
  const channel = client.channels.cache.get(player.textChannelId);
  channel?.send('✅ Fila de músicas encerrada.');
  player.destroy();
});

// Evento de erro no player
client.lavalink.on('trackError', (player, track, error) => {
  console.error(`Erro na faixa ${track?.info?.title}:`, error);
  const channel = client.channels.cache.get(player.textChannelId);
  channel?.send(`❌ Erro ao reproduzir **${track?.info?.title}**. Pulando...`);
});

// Tratamento de slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Erro no comando ${interaction.commandName}:`, error);
    const msg = { content: '❌ Ocorreu um erro ao executar esse comando.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

function formatDuration(ms) {
  if (!ms) return 'Desconhecido';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

client.login(process.env.DISCORD_TOKEN);
