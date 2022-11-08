import { Howl } from 'howler';

export class SFX {
  constructor() {
    this._music = new Howl({
      src: ['sfx/music.mp3'],
      loop: true,
      autoplay: true
    });
    this._beep = new Howl({
      src: ['sfx/beep.wav']
    });
  }

  beep() {
    this._beep.play();
  }
}