const axios = require('axios');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const macVendorsAPI = axios.create({
  baseURL: 'https://api.macvendors.com',
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mac')
    .setDescription('Verifica o fabricante de um dispositivo a partir do endereço MAC.')
    .addStringOption(option =>
      option.setName('endereco')
        .setDescription('Endereço MAC do dispositivo.')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const enderecoMAC = interaction.options.getString('endereco');

      // Aqui iremos usar o axios para fazer uma requisição GET à API do macvendors
      const response = await macVendorsAPI.get(`/${enderecoMAC}`);

      // Verificamos se o status da resposta é 200 OK
      if (response.status === 200) {
        const fabricante = response.data;

        // Criar o embed com as informações do fabricante
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Informações do Fabricante')
          .addFields(
            { name: 'Endereço MAC', value: enderecoMAC },
            { name: 'Fabricante', value: fabricante }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply('Não foi possível encontrar informações sobre o endereço MAC fornecido.');
      }
    } catch (error) {
      console.error('Ocorreu um erro:', error);
      await interaction.reply('Oops, parece que você inseriu um endereço MAC incorreto. Certifique-se de seguir o padrão do endereço MAC, como por exemplo: 00:00:00:00:00:00');
    }
  },
};
