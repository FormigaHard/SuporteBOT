const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { spawn } = require('child_process');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');

// dotenv
const dotenv = require('dotenv');
dotenv.config();
const { TOKEN, CLIENT_ID, GUILD_IDS } = process.env;

// importação dos comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`O comando em ${filePath} está com "data" ou "execute" ausente`);
  }
}

// Login do bot
client.once('ready', () => {
  console.log(`Sucesso! Login realizado como ${client.user.tag}`);

  // Obtém os IDs dos servidores a partir do .env
  const guildIds = GUILD_IDS.split(',');

  // Itera sobre cada ID de servidor
  guildIds.forEach(guildId => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      console.log(`Bot conectado ao servidor: ${guild.name}`);
      console.log(`ID do servidor: ${guild.id}`);
      console.log('---');
    } else {
      console.log(`Bot não está presente no servidor com o ID: ${guildId}`);
    }
  });
});

// Faz o login no discord usando o Token
client.login(TOKEN);

// Listener de interações com o bot
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error('Comando não encontrado');
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply('Houve um erro ao executar este comando!');
  }
});
