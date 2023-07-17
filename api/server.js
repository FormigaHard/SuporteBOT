const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const hostname = 'localhost';
const port = 3000;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Cria os workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Evento quando um worker termina
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/nmap') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const { command } = JSON.parse(body);
          const logFilePath = `./scan_${Date.now()}.log`; // Caminho para o arquivo de log exclusivo

          console.log(`Comando Nmap requisitado: ${command}`);

          // Executa o comando do Nmap com a opção -oN para gerar o arquivo de log exclusivo
          const nmapProcess = exec(`${command} -oN ${logFilePath}`);

          // Captura os erros em tempo real
          nmapProcess.stderr.on('data', (data) => {
            console.error(data.toString());
          });

          // Evento quando o comando do Nmap é concluído
          nmapProcess.on('close', (code) => {
            if (code === 0) {
              // Lê o conteúdo do arquivo de log exclusivo
              fs.readFile(logFilePath, 'utf8', (err, data) => {
                if (err) {
                  console.error(err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Erro ao ler o arquivo de log' }));
                } else {
                  console.log(`Varredura Nmap concluída: ${command}`);

                  // Envia a resposta com o conteúdo do arquivo de log
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ message: 'Varredura Nmap concluída', log: data }));

                  // Remove o arquivo de log exclusivo após enviar a resposta
                  fs.unlink(logFilePath, (unlinkErr) => {
                    if (unlinkErr) {
                      console.error(`Erro ao excluir o arquivo de log: ${unlinkErr}`);
                    }
                  });
                }
              });
            } else {
              console.error(`Erro ao executar o Nmap: ${command}`);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Erro ao executar o Nmap' }));

              // Remove o arquivo de log exclusivo em caso de erro
              fs.unlink(logFilePath, (unlinkErr) => {
                if (unlinkErr) {
                  console.error(`Erro ao excluir o arquivo de log: ${unlinkErr}`);
                }
              });
            }
          });
        } catch (error) {
          console.error(error);
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Requisição inválida' }));
        }
      });
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
    }
  });

  server.listen(port, hostname, () => {
    console.log(`Worker ${process.pid} is running`);
  });
}
