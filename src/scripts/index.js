import '../styles/index.scss';
import { CloudFunctions } from './cloud-funcs';
import { Firebase } from './firebase';
import { SFX } from './sfx';
import { VMTerminal } from './terminal';
import { VMs } from './vms';

const _Game = {};

_Game.SFX = new SFX(_Game);
_Game.FB = new Firebase(_Game);
_Game.Term = new VMTerminal(_Game);
_Game.VMs = new VMs(_Game);
_Game.CloudFuncs = new CloudFunctions(_Game);
_Game.SHA = '';

// Background update check
async function checkForUpdates() {
  const resp = await fetch('./sha.txt');
  _Game.SHA = await resp.text();
}

checkForUpdates();

setInterval(async () => {
  const lastSHA = _Game.SHA;
  await checkForUpdates();
  if (lastSHA != _Game.SHA) {
    _Game.Term.writeAlways('{yellow}[!]{reset} An update is available! Refresh soon.');
  }
}, (1000 * 60));

window.Game = _Game;