/// <reference path="../d/phaser.d.ts" />

var g:Phaser.Game;

class C {
  static tileWidth:number = 25;
  static tileHeight:number = 25;

  static mapWidthInTiles:number  = 30;
  static mapHeightInTiles:number = 25;

  static mapWidthInPixels:number  = C.mapWidthInTiles * C.tileWidth;
  static mapHeightInPixels:number = C.mapHeightInTiles * C.tileHeight;
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
    this.load.image("dialog", "assets/dialogbox.png");
  }

  public create():void {
    var cursors = this.game.input.keyboard.createCursorKeys();
    game.camera.bounds = null;

    this.map = new GameMap("tilesetkey", "map");

    this.player = new Player(this.game, this.map);
    this.game.add.existing(this.player);

    var d:Dialog = new Dialog(["blah bl blahlablahc", "blabla blah."]);
  }

  public update():void {
    var kb = game.input.keyboard;

    for (var name in this.map.collideableLayers) {
      this.game.physics.arcade.collide(this.player, this.map.collideableLayers[name]);
    }

    if (kb.isDown(Phaser.Keyboard.Q)) {
      this.map.reload();
    }
  }
}

interface KeyListener {
  signal: Phaser.Signal;
  callback: Function;
};

class Entity extends Phaser.Sprite {
  body:Phaser.Physics.Arcade.Body;
  listeners:KeyListener[] = [];

  constructor(game:Phaser.Game, x:number, y:number, spritesheet:string, frame:number=0) {
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

  destroy() {
    super.destroy();

    for (var i = 0; i < this.listeners.length; i++) {
      this.listeners[i].signal.remove(this.listeners[i].callback);
    }
  }

  press(key:number, cb:Function) {
    var button = game.input.keyboard.addKey(key);
    button.onUp.add(cb);

    this.listeners.push({signal: button.onUp, callback: cb})
  }
}

class Dialog extends Phaser.Group {
  width:number = 300;
  height:number = 200;
  border:number = 20;
  speed:number = 3;
  ticks:number = 0;

  allDialog:string[];
  img:Phaser.Image;
  textfield:Phaser.Text;

  nextButton:Phaser.Key;
  key:number = Phaser.Keyboard.Z;

  constructor(content:string[], typewriter:boolean = true) {
    super(game);

    this.x = 200;
    this.y = 200;

    this.img = this.game.add.image(0, 0, "dialog");
    this.add(this.img);

    this.textfield = this.game.add.text(this.border, this.border, "", {font: '14pt Arial', wordWrap: true, wordWrapWidth: this.width - this.border * 2 });
    this.add(this.textfield);

    this.allDialog = content.slice(0);

    this.nextButton = game.input.keyboard.addKey(this.key);
    this.nextButton.onDown.add(this.advanceDialog, this);
  }

  private getEffectiveSpeed():number {
    var effectiveSpeed = this.speed;

    if (game.input.keyboard.isDown(this.key)) {
      effectiveSpeed /= 2;
      Phaser.Math.clampBottom(effectiveSpeed, 1);
    }

    return Math.floor(effectiveSpeed);
  }

  update():void {
    if (++this.ticks % this.getEffectiveSpeed() == 0) {
      this.textfield.text = this.allDialog[0].substring(0, this.textfield.text.length + 1);
    }
  }

  advanceDialog():void {
    if (this.textfield.text.length == this.allDialog[0].length) {
      this.allDialog.shift();
      this.textfield.text = "";

      if (this.allDialog.length == 0) {
        this.destroy(true);
        this.nextButton.onDown.remove(this.advanceDialog, this);
      }
    }
  }
}

class Player extends Entity {
  speed:number = 300;
  map:GameMap;

  constructor(game:Phaser.Game, map:GameMap) {
    super(game, 50, 50, "player", 0);

    (<any> this.body).drag.x = 1000;
    (<any> this.body).drag.y = 1000;

    this.map = map;
    this.checkWorldBounds = true;
    this.events.onOutOfBounds.add(this.outOfBounds, this);
  }

  outOfBounds():void {
    var normalizedX:number = this.x - this.map.mapX;
    var normalizedY:number = this.y - this.map.mapY;

    var dx = Math.floor(normalizedX / C.mapWidthInPixels);
    var dy = Math.floor(normalizedY / C.mapHeightInPixels);

    this.map.switchMap(dx, dy);
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
  tileset: Phaser.Tilemap;
  tilemapKey: string;
  tilesetKey: string;

  public mapX:number = 0;
  public mapY:number = 0;

  constructor(tilesetKey: string, tilemapKey: string) {
    this.tileset = new Phaser.Tilemap(game, tilemapKey, 25, 25, 30, 30); // w,h, mapw, maph
    this.tilemapKey = tilemapKey;
    this.tilesetKey = tilesetKey;

    this.tileset.addTilesetImage("tileset", tilesetKey, 25, 25);

    this.tileset.setCollisionBetween(1, 151, true, "walls");

    for (var i = 0; i < this.tileset.layers.length; i++) {
      var tilesetObj:any = this.tileset.layers[i];
      var name:string = tilesetObj.name;

      var layer:Phaser.TilemapLayer = this.tileset.createLayer(name);
      this.collideableLayers[name] = layer;
    }
  }

  switchMap(dx:number, dy:number) {
    this.mapX += dx * C.mapWidthInPixels;
    this.mapY += dy * C.mapHeightInPixels;

    game.camera.setPosition(this.mapX, this.mapY);
  }

  reload() {
    game.cache.removeTilemap("map");
    var json = $.ajax({url: "assets/map.json", async: false, dataType: 'text', cache: false }).responseText;
    game.load.tilemap("map", "assets/map.json", json, Phaser.Tilemap.TILED_JSON);
    this.tileset = new Phaser.Tilemap(game, this.tilemapKey, 25, 25, 30, 30);


    this.tileset.addTilesetImage("tileset", this.tilesetKey, 25, 25);
    this.tileset.setCollisionBetween(1, 151, true, "walls");

    /*
    ?????????????????
    for (var key in this.collideableLayers) {
    }
    */

    for (var i = 0; i < this.tileset.layers.length; i++) {
      var tilesetObj:any = this.tileset.layers[i];
      var name:string = tilesetObj.name;

      this.collideableLayers[name].destroy(true);

      var layer:Phaser.TilemapLayer = this.tileset.createLayer(name);
      this.collideableLayers[name] = layer;
    }

  }
}

var state = new MainState();
var game = new Phaser.Game(C.mapWidthInPixels, C.mapHeightInPixels, Phaser.WEBGL, "main", this.state);