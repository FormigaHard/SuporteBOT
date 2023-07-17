Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64" # Sistema operacional recomendado
  config.vm.hostname = "Network-tools" # nome da VM
  config.vm.synced_folder "E:/dev/Projeto", "/home/Projeto" #Sincroniza o arquivo do windows na vm

  config.vm.provider "virtualbox" do |vb|
    vb.memory = "2048" # quantidade de memória RAM da VM (em MB)
  end

  # Shell script para instalar as dependências do ambiente
  config.vm.provision "shell", inline: <<-SHELL
    sudo apt-get update && 
    sudo apt-get upgrade -y &&
    sudo apt-get install -y nmap && 
    sudo apt-get install -y npm && 
    sudo apt-get install curl &&
    curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&
    sudo apt-get install -y nodejs &&
    sudo apt-get update &&
    sudo apt-get upgrade
    #podemos automatizar o fluxo de instalação usando o vagrant
  SHELL

  # Configuração de redes
  config.vm.network "public_network", ip: "192.168.2.70" 
end
