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

      const statusRow = document.createElement('div');
      statusRow.className = 'status';
      vm.appendChild(statusRow);

      vm.addEventListener('click', (e) => {
        const isOwned = document.querySelector(`.vm.owned[ip="${ip}"]`);
        
        this.Game.Term.term.focus();

        if (e.shiftKey) {
          this.Game.Term.addToPrompt(ip);
          return;
        } else if (isOwned) {
          if (!this.Game.Term.addToPrompt(`ssh ${ip}`)) {
            return false;
          }
        } else {
          if (!this.Game.Term.addToPrompt(`buy ${ip}`)) {
            return false;
          }
        }
        
        this.Game.Term.runCommand();
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

    const statusRow = vmDiv.querySelector('.status');
    statusRow.className = 'status';
    statusRow.innerHTML = '';
    statusRow.classList.add('hidden');
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

      const statusDiv = document.querySelector(`[ip="${ip}"] .status`);
      statusDiv.classList.remove('hidden');
      statusDiv.innerHTML = '<div>';
      statusDiv.innerHTML += 'Idle.';
      statusDiv.innerHTML += '</div>';
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