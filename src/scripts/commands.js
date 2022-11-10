// "this" acts as Game.Terminal in run()

export function getAliasMap() {
  const map = {};
  Object
    .keys(module.__proto__.exports)
    .filter(k => k!= 'getAliasMap')
    .forEach(k => {
      if (this[k]['aliases']) {
        const aliases = this[k].aliases();
        aliases.forEach(a => map[a] = this[k]);
      }
  });
  return map;
}

// eslint-disable-next-line no-undef
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ON_NETWORK = 'network';
const ON_VM = 'vm';

class GenericCommand {
  static getContexts() {
    return [ON_NETWORK];
  }
}

class VMCommand {
  static getContexts() {
    return [ON_VM];
  }
}

export class echo extends GenericCommand {
  static help() {
    return 'Echos text back to the terminal.';
  }

  static async run() {
    const args = Array.prototype.slice.call(arguments);
    this.write(args.join(' '));
  }
}

export class uid extends GenericCommand {
  static help() {
    return 'Returns your user id on the server.';
  }

  static async run() {
    this.write(this.user.uid);
  }
}

export class ssh extends GenericCommand {
  static help() {
    return 'Connect to a remote server.';
  }

  static async run(ip) {
    if (this.connectedTo.length > 0) {
      this.write(`You are already connected to a server.`);
      return;
    } else if (!ip) {
      this.write(`Invalid address.`);
      return;
    } else if (ip.length < this.Game.VMs.network.length) {
      this.write(`Invalid address: ${ip}`);
      return;
    } else if (ip.substr(0, this.Game.VMs.network.length) != this.Game.VMs.network) {
      this.write(`Address not in current network: ${ip}`);
      return;
    }

    this.write(`Connecting to {magenta}${ip}{reset}..`);
    await sleep(1000);

    let vm = this.Game.VMs.getServer(ip);
    if (!vm) {
      this.write(`No response.\n\n\rThere does not appear to be an active VM running at that address. You can purchase a VM there for {yellow}$100{reset} by running {yellow}buy ${ip}{reset}.`);
      return;
    }

    if (vm.owner.uid != this.userUid) {
      this.write(`You are not able to authenticate to this server.`);
      return;
    }

    this.write(`\r\nConnected.`);
    this.setConnection(ip);
    this.updatePrompt();
  }
}

export class buy extends GenericCommand {
  static help() {
    return 'Purchase a VM.';
  }

  static async run(ip) {
    try {
      if (!ip) {
        this.write('You must specify the IP address of the VM that you wish to buy.');
        return;
      }

      await this.Game.CloudFuncs.buyServer({ ip: ip });
      
      this.write('Server purchased.');
    } catch (err) {
      this.write(err.message);
    }
  }
}

export class network extends GenericCommand {
  static help() {
    return 'Network settings.';
  }

  static aliases() {
    return ['nw'];
  }

  static async run(newNetwork) {
    const networks = await this.Game.FB.getNetworks();

    if (newNetwork) {
      newNetwork = newNetwork.replace('.0.0', '');
      if (Object.keys(networks).indexOf(newNetwork) == -1) {
        this.write('That is not a valid network to connect to.');
        return;
      }

      this.write('Will change network now.');
      
      return;
    }

    this.write(`There are ${Object.keys(networks).length} available networks in space.\n\n\rAvailable networks:`);
    Object.keys(networks).forEach(network => {
      const data = networks[network];
      const color = (network == this.Game.VMs.network) ? 'yellow' : 'magenta';
      this.write(`{${color}}${network}.0.0{reset}\t${data.description} (${data.type})`);
    });
  }
}

export class nick extends GenericCommand {
  static help() {
    return 'Nick settings.';
  }

  static async run(newNick) {
    if (!newNick) {
      this.write(`Your nick is {cyan}${this.user.nick}{reset}.`);
      return;
    }

    await this.Game.FB.updateUser({ nick: newNick });
    this.write('Nick changed.');
    this.updatePrompt();
  }
}

export class exit extends GenericCommand {
  static help() {
    return 'Logout.';
  }

  static aliases() {
    return ['logout'];
  }

  static prompt() {
    return false;
  }

  static getContexts() {
    return [ON_NETWORK, ON_VM];
  }

  static async run() {
    if (this.connectedTo.length > 0) {
      this.write('Disconnected.');
      this.setConnection();
      this.updatePrompt();
      this.prompt();
      return;
    }

    this.logOut();
    this.write('Logged out. Goodbye!');
  }
}

export class money extends GenericCommand {
  static help() {
    return 'Displays how much money you have.';
  }

  static async run() {
    this.write(`You have {yellow}$${this.user.money}{reset}.`);
  }
}

export class bc extends GenericCommand {
  static help() {
    return 'Broadcast a message';
  }

  static async run() {
    const args = Array.prototype.slice.call(arguments);
    await this.Game.CloudFuncs.broadcastMessage({ message: args.join(' ') });
  }
}

export class ls extends VMCommand {
  static async run() {
    this.write('Test');
  }
}