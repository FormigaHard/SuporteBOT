const axios = require('axios');
const { SlashCommandBuilder } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');
const countries = require('countries-list');
require('dotenv').config();

async function generateTempFile(data) {
  return new Promise((resolve, reject) => {
    const filePath = '/tmp/ipData.json'; // Caminho do arquivo temporário
    const jsonData = JSON.stringify(data, null, 2); // Converte os dados em formato JSON

    fs.writeFile(filePath, jsonData, err => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check')
    .setDescription('banco de dados colaborativo para relatar e investigar endereços IP abusivos.')
    .addStringOption(option =>
      option
        .setName('ip')
        .setDescription('O endereço IP para verificar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ip = interaction.options.getString('ip');

    try {
      const apiKey = process.env.ABUSEIPDB_API_KEY;
      if (!apiKey) {
        console.error('Chave de API do AbuseIPDB não encontrada. Verifique o arquivo .env.');
        return await interaction.reply('Ocorreu um erro ao verificar o IP.');
      }

      const response = await axios.get(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
        headers: {
          'Key': apiKey,
          'Accept': 'application/json'
        }
      });

      console.log('Resposta da API:', response.data);

      if (response.status === 200 && response.data.data) {
        const ipData = response.data.data;

        const filePath = await generateTempFile(ipData); // Gera o arquivo temporário com os dados da API

        const fileContent = fs.readFileSync(filePath, 'utf-8'); // Lê o conteúdo do arquivo

        const formattedContent = formatData(JSON.parse(fileContent)); // Formata o conteúdo

        await interaction.reply(`foi encontrado em nosso banco de dados:\n\n${formattedContent}`);
      } else {
        await interaction.reply('IP não encontrado.');
      }
    } catch (error) {
      console.error('Ocorreu um erro:', error);
      await interaction.reply('Ocorreu um erro ao verificar o IP.');
    }
  },
};
function formatData(data) {
  // Mapear emojis para algumas informações
  const emojiMap = {
    true: '✅',
    false: '❌',
    null: 'N/A',
  };

  // Obter o nome completo do país com base na sigla
  const countryCode = data.countryCode;
  const countryName = countries.countries[countryCode]?.name || 'N/A';

  // Realizar a formatação dos dados conforme necessário
  const formattedData = `ℹ️ Informações sobre o IP:
  
${emojiMap[data.isPublic]} IP Público: ${data.isPublic}
${emojiMap[data.isWhitelisted]} IP na Whitelist: ${data.isWhitelisted}
🔢 Pontuação de Confiança de Abuso: ${data.abuseConfidenceScore}
🌍 País: ${countryName} (${countryCode})
📊 Tipo de Uso: ${data.usageType}
🌐 ISP: ${data.isp}
🌐 Domínio: ${data.domain}
🌐 Hostnames: ${data.hostnames.join(', ') || 'N/A'}
${emojiMap[data.isTor]} Usando Tor: ${data.isTor}
📕 Total de Relatórios: ${data.totalReports}
👥 Número de Usuários Distintos: ${data.numDistinctUsers}
⏱️ Último Relatório em: ${data.lastReportedAt}`;

  return formattedData;
}