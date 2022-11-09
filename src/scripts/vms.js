const gridSize = 8;

export class VMs {
  constructor(game) {
    this.Game = game;
    this.container = document.querySelector('.vm-container');
    this.network = '0.0';
    this.servers = {};
  }

  _addVMsToRow(colNum, row) {  
    for(let i = 0; i <= gridSize; i++) {
      const ip = `${this.network}.${colNum+1}.${i+1}`;

      const vm = document.createElement('div');
      vm.className = 'vm';
      vm.setAttribute('ip', ip);

      // VM panel content.
      const ipRow = document.createElement('div');
      ipRow.className = 'ip-address';
      vm.appendChild(ipRow);

      const ownerRow = document.createElement('div');
      ownerRow.className = 'owner';
      vm.appendChild(ownerRow);

      const specsRow = document.createElement('div');
      specsRow.className = 'specs';
      vm.appendChild(specsRow);

      vm.addEventListener('click', () => {
        this.Game.Term.addToPrompt(ip);
        this.Game.Term.term.focus();
      });

      row.appendChild(vm);
      this.initVM(ip);
    }
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }

  setup() {
    for(let i = 0; i <= gridSize; i++) {
      const row = document.createElement('div');
      row.className = 'row-container';
      this.container.appendChild(row);
      this._addVMsToRow(i, row);
    }
  }

  getServer(ip) {
    if (this.servers[ip]) {
      return this.servers[ip];
    }

    return null;
  }

  div(ip) {
    return this.container.querySelector(`[ip="${ip}"]`);
  }

  setNetwork(network) {
    if (this.network == network) {
      return;
    }
    
    // Clear the VM divs.
    this.container.innerHTML = '';

    // Set the new network, and re-create VM divs.
    this.network = network;
    this.setup();

    // Listen to servers and messages on this network.
    this.Game.FB.listenToServers(network);
    this.Game.FB.listenToMessages(network);

    // Re-sync data.
    this.resync();

    console.log('Network changed', network);
  }

  initVM(ip) {
    const vmDiv = document.querySelector(`[ip="${ip}"]`);
    vmDiv.className = 'vm';

    const ipRow = vmDiv.querySelector('.ip-address');
    ipRow.className = 'ip-address';
    ipRow.innerText = ip;

    const ownerRow = vmDiv.querySelector('.owner');
    ownerRow.className = 'owner';
    ownerRow.innerHTML = '<span class="buy-cost">$100</span>';

    const specsRow = vmDiv.querySelector('.specs');
    specsRow.className = 'specs';
    specsRow.innerHTML = '';
    specsRow.classList.add('hidden');
  }

  async handleServerData(ip, data) {
    if (ip.substr(0, this.network.length) != this.network) {
      return; // VM is outside of current network.
    }

    if (!data) {
      // Reset.
      this.initVM(ip);
      console.log('removed server', ip);
      return;
    }

    if (data.owner) {
      data.owner = await this.Game.FB.getUserData(data.owner);
      const vmDiv = document.querySelector(`[ip="${ip}"]`);
      vmDiv.classList.add('owned');

      const ownerDiv = document.querySelector(`[ip="${ip}"] .owner`);
      ownerDiv.innerHTML = `<div class="name">${data.owner.nick}</div>`;

      const specsDiv = document.querySelector(`[ip="${ip}"] .specs`);
      specsDiv.classList.remove('hidden');
      specsDiv.innerHTML = '<div>';
      specsDiv.innerHTML += '<div>cpu: <span class="stat">100m</span></div>';
      specsDiv.innerHTML += '<div>mem: <span class="stat">1Gi</span></div>';
      specsDiv.innerHTML += '<div>disk: <span class="stat">100Gi</span></div>';
      specsDiv.innerHTML += '</div>';
    }

    this.Game.VMs.servers[data.ip] = data;
    console.log('updated server', data);
  }

  resync() {
    Object.keys(this.servers).forEach(ip => {
      this.handleServerData(ip, this.servers[ip]);
    });
  }
}