import { getFunctions, httpsCallable } from 'firebase/functions';

const CLOUD_FUNCS = [
  { group: 'user', func: 'initUserData' },
  { group: 'user', func: 'updateNick' },
  { group: 'game', func: 'buyServer' },
  { group: 'game', func: 'broadcastMessage' },
];

export class CloudFunctions {
  constructor(game) {
    this.Game = game;
    this.functions = getFunctions(game.FB.app);

    CLOUD_FUNCS.forEach(f => {
      this[f.func] = httpsCallable(this.functions, `${f.group}-${f.func}`);
    });
  }
}