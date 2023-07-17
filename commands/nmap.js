const axios = require('axios');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nmap')
    .setDescription('Nmap verifica o host e as portas abertas e informações sobre os dispositivos')
    .addStringOption(option =>
      option
        .setName('ip')
        .setDescription('O endereço IP para executar o Nmap')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('vuln')
        .setDescription('Realizar análise de vulnerabilidades')
        .setRequired(false)
    ),

  async execute(interaction) {
    const ip = interaction.options.getString('ip');
    const vuln = interaction.options.getBoolean('vuln');

    await interaction.deferReply({ ephemeral: true }); // Aguarda a resposta de forma assíncrona

    try {
      let command;
      if (vuln) {
        // Comando para análise de vulnerabilidades
        command = `nmap -v -sV -Pn -O --open ${ip}`;
      } else {
        // Comando para varredura normal
        command = `nmap ${ip}`;
      }

      const startTime = new Date();

      const response = await axios.post('http://localhost:3000/nmap', { command });

      if (response.status === 200) {
        await interaction.editReply('Varredura Nmap iniciada! Aguarde enquanto processamos as informações...');

        // Verifica se a resposta da API contém uma mensagem de sucesso
        const data = response.data;
        if (data.message === 'Varredura Nmap concluída') {
          // A resposta da API indica que a varredura do Nmap foi concluída
          // Verifica se a propriedade 'log' existe na resposta
          if (data.log) {
            const scanReport = data.log;

            // Extrai as informações do endereço IP e hostname do log
            const ipMatch = scanReport.match(/for\s+(.*?)\s+\((.*?)\)/);
            const ipAddress = ipMatch && ipMatch[2] ? ipMatch[2] : 'N/A';
            const hostname = ipMatch && ipMatch[1] ? ipMatch[1] : 'N/A';

            // Extrai as portas abertas e os serviços do log
            const portMatches = scanReport.matchAll(/(\d+\/\w+)\s+open\s+(.*?)\s/g);
            const openPorts = [];
            for (const match of portMatches) {
              const port = match[1];
              const service = match[2] || 'N/A';
              openPorts.push({ port, service });
            }

            // Extrai os hosts não escaneados do log
            const notScannedMatch = scanReport.match(/Other addresses for .*? \(not scanned\):\s+(.*)/);
            const notScannedHosts = notScannedMatch && notScannedMatch[1] ? notScannedMatch[1].split(' ') : [];

            // Extrai os tipos de dispositivos do log
            const deviceTypesMatch = scanReport.match(/Device type:\s+(.*)/);
            const deviceTypes = deviceTypesMatch && deviceTypesMatch[1] ? deviceTypesMatch[1].split('|') : [];

            // Formata os tipos de dispositivos para exibição
            const formattedDeviceTypes = deviceTypes.length > 0 ? deviceTypes.join(', ') : 'Nenhum tipo de dispositivo encontrado';

            // Mapeia os status das portas para emojis
            const portStatusEmojis = {
              open: '🟢', // porta aberta
              closed: '🔴', // porta fechada
              filtered: '🟠' // porta filtrada
            };

            // Formata as portas abertas com emojis e informações do serviço
            const formattedOpenPorts = openPorts.map(({ port, service }) => {
              const portInfo = service !== 'N/A' ? `(${service})` : '';
              return `${portStatusEmojis.open} ${port} ${portInfo}`;
            }).join('\n');

            // Formata os hosts não escaneados com emojis
            const formattedNotScannedHosts = notScannedHosts.map(host => `${portStatusEmojis.filtered} ${host}`).join('\n');

            const endTime = new Date();
            const executionTimeMinutes = Math.floor((endTime - startTime) / 60000);

            // Formata as informações para exibição
            const formattedLog = `Endereço IP: ${ipAddress}
Hostname: ${hostname}
Portas abertas:
${formattedOpenPorts || 'Nenhuma porta aberta'}
Hosts não escaneados:
${formattedNotScannedHosts || 'Nenhum host não escaneado'}
Tempo de execução: ${executionTimeMinutes} minutos
Tipos de dispositivos: ${formattedDeviceTypes}`;

            const channel = interaction.channel;
            await channel.send(`\`\`\`asciidoc\n${formattedLog}\n\`\`\``);
          } else {
            console.error('Log não encontrado na resposta da API');
          }
        } else {
          // A resposta da API não contém uma mensagem de sucesso
          console.error(data);
        }
      } else {
        // A chamada à API retornou um código de status diferente de 200
        console.error(response.data);
        await interaction.editReply(`Erro ao executar o Nmap: ${response.statusText}`);
      }
    } catch (error) {
      // Ocorreu um erro durante a chamada à API
      console.error(error);
      await interaction.editReply('Ocorreu um erro ao executar o comando. Por favor, tente novamente mais tarde.');
    }
  },
};
