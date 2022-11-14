import { getFunctions, httpsCallable } from 'firebase/functions';

const CLOUD_FUNCS = [
  'initUserData',
  'buyServer',
  'broadcastMessage',
  'updateNick',
];

export class CloudFunctions {
  constructor(game) {
    this.Game = game;
    this.functions = getFunctions(game.FB.app);

    CLOUD_FUNCS.forEach(f => {
      this[f] = httpsCallable(this.functions, f);
    });
  }
}