/// <reference path="../d/phaser.d.ts" />

var g:Phaser.Game;

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

// no need to extend groups any more, just have 2 groups of layers.
class GameMap {
  layers:{[key: string]: Phaser.TilemapLayer} = {};

  collideableLayers: {[key: string]: Phaser.TilemapLayer} = {};

  constructor(tilesetKey: string) {
    var tileset:Phaser.Tilemap = new Phaser.Tilemap(game, "map", 25, 25, 30, 30); // w,h, mapw, maph

    tileset.addTilesetImage("tileset", tilesetKey, 25, 25);

    tileset.setCollisionBetween(1, 151, true, "walls");

    for (var i = 0; i < tileset.layers.length; i++) {
      var tilesetObj:any = tileset.layers[i];
      var name:string = tilesetObj.name;

      var layer:Phaser.TilemapLayer = tileset.createLayer(name);
      this.collideableLayers[name] = layer;
    }
  }
}

class MainState extends Phaser.State {
  groups: {[key: string]: Phaser.Group} = {};
  player:Player;
  map:GameMap;

  gg:Phaser.Group;

  public preload():void {
    this.load.spritesheet("player", "assets/player.png", 25, 25, 1);
    this.load.spritesheet("tilesetkey", "assets/tileset.png", 25, 25, 1);
    this.load.tilemap("map", "assets/map.json", null, Phaser.Tilemap.TILED_JSON);
  }

  public create():void {
    var cursors = this.game.input.keyboard.createCursorKeys();
    this.map = new GameMap("tilesetkey");

    this.player = new Player(this.game);
    this.game.add.existing(this.player);

    this.gg = this.game.add.group(undefined, undefined, true);
  }

  public update():void {
    for (var name in this.map.collideableLayers) {
      this.game.physics.arcade.collide(this.player, this.map.collideableLayers[name]);
    }
  }
}

var state = new MainState();
var game = new Phaser.Game(800, 600, Phaser.WEBGL, "main", this.state);