/// <reference path="../d/phaser.d.ts" />

class Entity extends Phaser.Sprite {
  body:Phaser.Physics.Arcade.Body;

  constructor(game:Phaser.Game, x:number, y:number, spritesheet:string, frame:number) {
    super(game, x, y, spritesheet, frame);

    game.physics.enable(this, Phaser.Physics.ARCADE);

    var superclassName:string = <string> (<any> this).constructor.name;
    var currentState:MainState = (<MainState> game.state.getCurrentState());
    if (!currentState.groups[superclassName]) {
      var newGroup:Phaser.Group = game.add.group();
      currentState.groups[superclassName] = newGroup;
      this.game.add.existing(newGroup);
    }

    currentState.groups[superclassName].add(this);
  }
}

class Player extends Entity {
  speed:number = 300;

  constructor(game:Phaser.Game) {
    super(game, 50, 50, "player", 0);

    (<any> this.body).drag.x = 1000;
    (<any> this.body).drag.y = 1000;
    }

  update():void {
    var keyboard = this.game.input.keyboard;

    if (keyboard.isDown(Phaser.Keyboard.A)) {
      this.body.velocity.x = -this.speed;
    }

    if (keyboard.isDown(Phaser.Keyboard.D)) {
      this.body.velocity.x = this.speed;
    }

    if (keyboard.isDown(Phaser.Keyboard.W)) {
      this.body.velocity.y = -this.speed;
    }

    if (keyboard.isDown(Phaser.Keyboard.S)) {
      this.body.velocity.y = this.speed;
    }
  }
}

class MainState extends Phaser.State {
  groups: {[key: string]: Phaser.Group} = {};

  public preload():void {
    this.load.spritesheet("player","assets/player.png", 25, 25, 1);
  }

  public create():void {
    var cursors = this.game.input.keyboard.createCursorKeys();

    var p:Player = new Player(this.game);
    this.game.add.existing(p);
  }
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