const gridSize = 8;

export class VMs {
  constructor(game) {
    this.Game = game;
    this.container = document.querySelector('.vm-container');
    this.network = '25.240';
    this.servers = {};
    this.setup();
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
      ipRow.innerText = ip;
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
    }
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

  async handleServerData(data) {
    if (data.ip.substr(0, this.network.length) != this.network) {
      return; // VM is outside of current network.
    }

    if (data.owner) {
      data.owner = await this.Game.FB.getUserData(data.owner);
      const vmDiv = document.querySelector(`[ip="${data.ip}"]`);
      vmDiv.classList.add('owned');

      const ownerDiv = document.querySelector(`[ip="${data.ip}"] .owner`);
      ownerDiv.innerHTML = `<div class="name">${data.owner.nick}</div>`;

      const specsDiv = document.querySelector(`[ip="${data.ip}"] .specs`);
      specsDiv.innerHTML = '<div>';
      specsDiv.innerHTML += '<div>cpu: <span class="stat">100m</span></div>';
      specsDiv.innerHTML += '<div>mem: <span class="stat">1Gi</span></div>';
      specsDiv.innerHTML += '<div>disk: <span class="stat">100Gi</span></div>';
      specsDiv.innerHTML += '</div>';
    }

    this.Game.VMs.servers[data.ip] = data;
    console.log('updated server', data);
  }
}