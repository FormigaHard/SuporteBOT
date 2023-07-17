const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comandos')
    .setDescription('Lista todos os comandos disponíveis no bot.'),

  async execute(interaction) {
    try {
      const commands = interaction.client.commands;

      const embed = new EmbedBuilder()
        .setColor('#008000')
        .setTitle('Comandos Disponíveis');

      commands.forEach((command) => {
        embed.addFields({ name: `/${command.data.name}`, value: command.data.description });
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ocorreu um erro:', error);
      await interaction.reply('Ocorreu um erro ao listar os comandos disponíveis.');
    }
  },
};
