import { Howl } from 'howler';

export class SFX {
  constructor() {
    this._music = new Howl({
      src: ['sfx/music.mp3'],
      loop: true,
      autoplay: false
    });
    this._beep = new Howl({ src: ['sfx/beep.wav'] });
    this._typing = new Howl({ src: ['sfx/typing.mp3'] });
  }

  beep() {
    this._beep.play();
  }

  typing() {
    this._typing.play();
  }
}