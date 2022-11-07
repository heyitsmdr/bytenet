import { getFunctions, httpsCallable } from 'firebase/functions';

export class CloudFunctions {
  constructor(game) {
    this.Game = game;
    this.functions = getFunctions(game.FB.app);

    // Callable cloud functions
    this.initUserData = httpsCallable(this.functions, 'initUserData');
    this.buyServer = httpsCallable(this.functions, 'buyServer');
  }
}