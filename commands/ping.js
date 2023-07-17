const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping do Servidor"),

  async execute(interaction) {
    const serverPing = interaction.client.ws.ping;
    await interaction.reply(`🏓 Pong! O ping do servidor é ${serverPing}ms.`);
  },
};
