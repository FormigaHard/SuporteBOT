require('dotenv').config();
const { REST } = require("discord.js");
const { Routes } = require('discord-api-types/v10');
const fs = require("fs");
const path = require("path");

const { TOKEN, CLIENT_ID, GUILD_IDS } = process.env;

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.data.name) {
    commands.push(command.data);
  } else {
    console.warn(`O comando no arquivo ${file} está faltando as propriedades "data" ou "data.name" e será ignorado.`);
  }
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log(`Registrando ${commands.length} comandos...`);

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("Comandos registrados com sucesso!");
  } catch (error) {
    console.error(error);
  }
})();
