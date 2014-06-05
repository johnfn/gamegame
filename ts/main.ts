/// <reference path="../d/phaser.d.ts" />

class MainState extends Phaser.State {

}

class Game {
  game:Phaser.Game;
  state: Phaser.State;

  // TODO... browsers w/o WEBGL...
  constructor() {
    this.state = new MainState();
    this.game = new Phaser.Game(800, 600, Phaser.WEBGL, "main", this.state);
  }
}

new Game();