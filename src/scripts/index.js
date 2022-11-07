import '../styles/index.scss';
import { CloudFunctions } from './cloud-funcs';
import { Firebase } from './firebase';
import { VMTerminal } from './terminal';
import { VMs } from './vms';

const _Game = {};

_Game.FB = new Firebase(_Game);
_Game.Term = new VMTerminal(_Game);
_Game.VMs = new VMs(_Game);
_Game.CloudFuncs = new CloudFunctions(_Game);

window.Game = _Game;