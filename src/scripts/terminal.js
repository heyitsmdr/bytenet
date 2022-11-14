import { Terminal } from 'xterm';
import * as Commands from './commands';

const theme = {
  foreground: '#32df17',
  background: '#282a36',
  selection: '#97979b33',
  black: '#6c6c6c',
  brightBlack: '#686868',
  red: '#ff5c57',
  brightRed: '#ff5c57',
  green: '#5af78e',
  brightGreen: '#5af78e',
  yellow: '#e7f24e',
  brightYellow: '#e7f24e',
  blue: '#57c7ff',
  brightBlue: '#57c7ff',
  magenta: '#ff6ac1',
  brightMagenta: '#ff6ac1',
  cyan: '#00e5ff',
  brightCyan: '#00e5ff',
  white: '#f1f1f0',
  brightWhite: '#eff0eb'
};

const termSettings = {
  cursorBlink: true,
  theme: theme,
  // fontFamily: '"Ubuntu", sans-serif',
  // letterSpacing: 1
};

const TERMINAL_STATE_LOGIN_EMAIL = 'TERMINAL_STATE_LOGIN_EMAIL';
const TERMINAL_STATE_LOGIN_PASSWORD = 'TERMINAL_STATE_LOGIN_PASSWORD';
const TERMINAL_STATE_LOGIN_CREATE = 'TERMINAL_STATE_LOGIN_CREATE';
const TERMINAL_STATE_SHELL = 'TERMINAL_STATE_SHELL';
const TERMINAL_STATE_PREAUTH = 'TERMINAL_STATE_PREAUTH';

export class VMTerminal {
  constructor(game) {
    this.Game = game;
    this.command = '';
    this.promptString = '$ ';
    this.promptCutoff = 2;
    this.state = TERMINAL_STATE_PREAUTH;
    this.loginEmail = '';
    this.loginPassword = '';
    this.user = {};
    this.userUid = '';
    this.history = [];
    this.isLoading = false;
    this.connectedTo = '';

    this.term = new Terminal(termSettings);
    this.term.open(document.getElementById('terminal'));

    window.addEventListener('resize', () => this.resize());

    this.resize();
    this.greeting();

    this.term.focus();

    this.term.onData((k) => {
      if (this.isLoading) {
        return;
      }
      
      switch(k) {
        case '\u0003': // Ctrl+C
          this.term.write('^C');
          this.command = '';
          this.prompt();
          break;
        case '\r': // Enter
          if (this.command.length == 0) {
            this.prompt();
            return;
          }
          this.runCommand();
          break;
        case '\u007F': // Backspace (DEL)
          // Do not delete the prompt
          if (this.term._core.buffer.x > this.promptCutoff) {
            this.term.write('\b \b');
            if (this.command.length > 0) {
              this.command = this.command.substr(0, this.command.length - 1);
            }

            this.Game.SFX.typing();
          }
          break;
        default: // Print all other characters
          if (k >= String.fromCharCode(0x20) && k <= String.fromCharCode(0x7B) || k >= '\u00a0') {
            if (this.state == TERMINAL_STATE_LOGIN_PASSWORD) {
              this.term.write('*');
            } else if (this.state == TERMINAL_STATE_LOGIN_CREATE) {
              if (this.command.length == 1 || (k != 'y' && k != 'Y' && k != 'n' && k != 'N')) {
                return;
              }
              this.term.write(k);
            } else {
              this.term.write(k);
            }

            this.command += k;
            this.Game.SFX.typing();
          }
      }
    });

    this.term.onKey((k) => {
      if (k.domEvent.code == 'ArrowUp') {
        const lastCommand = this.history[this.history.length-1];
        this.term.write(lastCommand);
        this.command = lastCommand;
      }
    });

  }

  resize() {
    const width = 70;
    const lineHeight = 19;
    const lines = Math.floor(window.innerHeight / lineHeight);
    this.term.resize(width, lines);
  }

  greeting() {
    this.write('Welcome to the \x1B[1;3;31mBytenet\x1B[0m!');
  }

  auth() {
    this.state = TERMINAL_STATE_LOGIN_EMAIL;
    this.command = '';
    this.prompt('email: ');
  }

  promptCreateAccount() {
    this.state = TERMINAL_STATE_LOGIN_CREATE;
    this.prompt('User not found. Create? (Y/N): ');
  }

  setConnection(ip) {
    if (!ip) {
      this.Game.VMs.div(this.connectedTo).classList.remove('connected');
      this.connectedTo = '';
      return;
    }

    this.connectedTo = ip;
    this.Game.VMs.div(ip).classList.add('connected');
  }

  removeColoring(text) {
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  }

  prompt(newPrompt) {
    if (newPrompt) {
      this.promptString = newPrompt;
      this.promptCutoff = this.removeColoring(this.promptString).length;
    }

    if (this.promptString.length == 0) {
      return;
    }

    this.setLoadingState(false);
    this.term.write('\r\n' + this.promptString);
  }

  addToPrompt(text) {
    // Prevent adding to prompt if something is loading.
    if (this.isLoading) {
      return false;
    }

    this.write(text, true);
    this.command += text;

    return true;
  }

  setLoadingState(loading) {
    this.isLoading = loading;

    if (loading) {
      document.querySelector('#terminal-loading').classList.add('visible');
    } else {
      document.querySelector('#terminal-loading').classList.remove('visible');
    }
  }

  write(text, noNewLine) {
    text = text.replace(/\{black\}/g, '\x1B[30m');
    text = text.replace(/\{red\}/g, '\x1B[31m');
    text = text.replace(/\{green\}/g, '\x1B[32m');
    text = text.replace(/\{yellow\}/g, '\x1B[33m');
    text = text.replace(/\{magenta\}/g, '\x1B[35m');
    text = text.replace(/\{cyan\}/g, '\x1B[36m');
    text = text.replace(/\{reset\}/g, '\x1B[0m');

    if (noNewLine) {
      this.term.write(text);
    } else {
      this.term.writeln(text);
    }

    this.Game.SFX.beep();
  }

  writeAlways(text) {
    if (this.isLoading) {
      this.write(`\n\r${text}`);
      return;
    }    
    
    // Clear the current line
    this.term.write('\x1b[2K\r');

    // Write the text.
    this.write(`\r${text}`);

    // Re-prompt.
    this.prompt();

    // Re-add text already in buffer
    this.write(this.command, true);
  }

  loggedIn() {
    this.write(`\r\nLogged into the {magenta}${this.Game.VMs.network}.0.0{reset} network.`);

    this.state = TERMINAL_STATE_SHELL;

    this.Game.VMs.show();
    this.updatePrompt();
    this.prompt();
  }

  logOut() {
    this.user = {};
    this.userUid = '';
    this.Game.FB.logout();
    this.Game.VMs.hide();
  }

  updatePrompt() {
    let connection = '';
    if (this.connectedTo) {
      connection = '[\x1B[33m' + this.connectedTo + '\x1B[0m] ';
    }
    this.promptString = connection + '(\x1B[36m' + this.user.nick + '\x1B[0m) $ ';
    this.promptCutoff = this.removeColoring(this.promptString).length; 
  }

  async runCommand() {
    this.setLoadingState(true);

    if (this.state == TERMINAL_STATE_LOGIN_EMAIL) {
      this.loginEmail = this.command;
      this.command = '';
      this.state = TERMINAL_STATE_LOGIN_PASSWORD;
      this.prompt('password: ');
    } else if (this.state == TERMINAL_STATE_LOGIN_PASSWORD) {
      this.loginPassword = this.command;
      this.command = '';
      this.write('\r\n\nValidating credentials..');
      this.Game.FB.login(this.loginEmail, this.loginPassword);
    } else if (this.state == TERMINAL_STATE_LOGIN_CREATE) {
      if (this.command.toLowerCase() == 'y') {
        this.Game.FB.create(this.loginEmail, this.loginPassword);
        this.write('');
      } else if (this.command.toLowerCase() == 'n') {
        this.write('\r\n');
        this.auth();
      }
      this.command = '';
    } else if (this.state == TERMINAL_STATE_SHELL) {
      const args = this.command.split(' ');
      this.history.push(this.command);
      this.command = '';

      this.write('');
      let cmd = args.shift().toLowerCase();
      let C = Commands[cmd] || null;
      if (!C) {
        const aliasMap = Commands.getAliasMap();
        if (aliasMap[cmd]) {
          C = aliasMap[cmd];
        } else {
          this.write('Command not found: ' + cmd);
          this.prompt();
          return;
        }
      }

      const contexts = C.getContexts();
      const onVm = (this.connectedTo.length > 0);

      if (onVm && contexts.indexOf('vm') == -1) {
        this.write('You cannot run that command on a server. Disconnect first.');
        this.prompt();
        return;
      } else if (!onVm && contexts.indexOf('network') == -1) {
        this.write('You must be connected to a server first.');
        this.prompt();
        return;
      }

      await C['run'].apply(this, args);
      let showPrompt = true;
      if (C['prompt']) {
        showPrompt = C.prompt.apply(this, args);
      }
      if (showPrompt) {
        this.prompt();
      }
    }
  }
}