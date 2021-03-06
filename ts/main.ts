/// <reference path="../d/phaser.d.ts" />

var g:Phaser.Game;

interface Pos {
  x: number;
  y: number;
}

class C {
  static tileWidth:number = 25;
  static tileHeight:number = 25;

  static mapWidthInTiles:number  = 30;
  static mapHeightInTiles:number = 25;

  static mapWidthInPixels:number  = C.mapWidthInTiles * C.tileWidth;
  static mapHeightInPixels:number = C.mapHeightInTiles * C.tileHeight;

  static state():MainState {
    return (<MainState> game.state.getCurrentState());
  }

  static entityDist(a: Pos, b:Pos):number {
    return Phaser.Math.distance(a.x, a.y, b.x, b.y);
  }
}

class List<T> {
  contents:T[];

  constructor() {
    this.contents = [];
  }

  get(i:number):T {
    return this.contents[i];
  }

  set(i:number, value:T) {
    this.contents[i] = value;
  }

  push(value:T) {
    this.contents.push(value);
  }

  sortByKey(key:(elem: any) => number):List<T> {
    this.contents.sort(function(a, b) {
      return key(a) - key(b);
    })

    return this;
  }

  first():T {
    return this.contents[0];
  }
}

enum Mode {
  Normal
}

class MainState extends Phaser.State {
  private _groups:{[key: string]: List<any>} = {};

  gameMode:Mode = Mode.Normal;
  player:Player;
  map:GameMap;
  indicator:Indicator;
  hud:HUD;
  monster:Monster;

  // for battles
  entityWithPriority:any;

  public groups(key: string): List<any> {
    if (!(key in this._groups)) {
      this._groups[key] = new List();
    }

    return this._groups[key];
  }

  public preload():void {
    this.load.spritesheet("player", "assets/player.png", 25, 25, 1);
    this.load.spritesheet("tilesetkey", "assets/tileset.png", 25, 25, 1);
    this.load.tilemap("map", "assets/map.json", null, Phaser.Tilemap.TILED_JSON);
    this.load.image("dialog", "assets/dialogbox.png");
    this.load.image("indicator", "assets/indicator.png");
    this.load.spritesheet("npc", "assets/npc.png", 25, 25, 1);
    this.load.spritesheet("monster", "assets/monster.png", 25, 25, 1);
  }

  public create():void {
    var cursors = this.game.input.keyboard.createCursorKeys();
    game.camera.bounds = null;

    this.map = new GameMap("tilesetkey", "map");

    //this.game.add.existing(new NPC());

    this.player = new Player(this.game, this.map);

    this.game.add.existing(this.player);

    this.game.add.existing(this.indicator = new Indicator(this.player));
    this.game.add.existing(this.hud = new HUD(this.indicator));
    this.game.add.existing(this.monster = new Monster());

    this.monster.x = 300;
    this.monster.y = 300;
  }

  public switchMode(to:Mode):void {
    if (this.gameMode == to) return;

    this.gameMode = to;
  }

  public update():void {
    switch (this.gameMode) {
      case Mode.Normal: this.normalUpdate(); return;
      default: debugger;
    }
  }

  public normalUpdate() {
    var kb = game.input.keyboard;

    for (var name in this.map.collideableLayers) {
      this.game.physics.arcade.collide(this.player, this.map.collideableLayers[name]);
    }

    if (kb.isDown(Phaser.Keyboard.Q)) {
      this.map.reload();
    }
  }
}

class HUD extends Phaser.Group {
  indicator: Indicator;

  buttonText:Phaser.Text;

  constructor(indicator:Indicator) {
    super(game);

    this.indicator = indicator;
    this.buttonText = this.add(new Phaser.Text(game, 5, 5 ,"X button to DIE", {font: "14 pt Arial"}));
  }

  update():void {
    var target = this.indicator.target;

    if (target) {
      this.buttonText.text = "X to " + target.description;
    } else {
      this.buttonText.text = "X to literally die."
    }
  }
}

interface Interactable extends Pos {
  interact: () => void;
  description: string;
  distanceToInteract: number;
}

interface KeyListener {
  signal: Phaser.Signal;
  callback: Function;
  context: any;
};

class Entity extends Phaser.Sprite {
  body:Phaser.Physics.Arcade.Body;
  listeners:KeyListener[] = [];
  keyboard:Phaser.Keyboard;

  constructor(spritesheet:string) {
    super(game, 0, 0, spritesheet, 0);

    this.keyboard = this.game.input.keyboard;
    game.physics.enable(this, Phaser.Physics.ARCADE);

    this.addToGroups();
  }

  groups():string[] {
    return [<string> (<any> this).constructor.name];
  }

  private addToGroups():void {
    var groups:string[] = this.groups();
    var currentState:MainState = (<MainState> game.state.getCurrentState());

    for (var i = 0; i < groups.length; i++) {
      currentState.groups(groups[i]).push(this);
    }
  }

  destroy() {
    super.destroy();

    for (var i = 0; i < this.listeners.length; i++) {
      this.listeners[i].signal.remove(this.listeners[i].callback, this.listeners[i].context);
    }
  }

  press(key:number, cb:Function, context:any) {
    var button = game.input.keyboard.addKey(key);
    button.onUp.add(cb, context);

    this.listeners.push({signal: button.onUp, callback: cb, context: context})
  }
}

class BaseMonster extends Entity {
  p:Player;

  constructor(asset:string) {
    super(asset);

    this.p = (<List<Player>> C.state().groups("Player")).first();
  }
}

enum MonsterMode {
  Walking,
  Stopped
}

class Monster extends BaseMonster {
  currentMode:MonsterMode = MonsterMode.Walking;
  timeLeft:number = 30;
  walkingDX:number = 0;
  walkingDY:number = 0;

  constructor() {
    super("monster");
  }

  damage(amount:number) {
    return super.damage(amount);
  }

  update():void {
    switch (this.currentMode) {
      case MonsterMode.Stopped:
        if (--this.timeLeft <= 0) {
          var dx = [0,  0, 1, -1];
          var dy = [1, -1, 0,  0]
          var i = Math.floor(Math.random() * dx.length);

          this.walkingDX = dx[i];
          this.walkingDY = dy[i];
          this.timeLeft = 50;

          this.currentMode = MonsterMode.Walking;
        }

        break;
      case MonsterMode.Walking:
        if (--this.timeLeft <= 0) {
          this.timeLeft = 50;
          this.currentMode = MonsterMode.Stopped;
        } else {
          this.x += this.walkingDX;
          this.y += this.walkingDY;
        }

        break;
    }
  }
}

class Indicator extends Entity {
  player:Player;
  target:Interactable;

  constructor(player) {
    super("indicator");

    this.player = player;
    this.visible = false;

    this.press(Phaser.Keyboard.X, this.xPressed, this);
  }

  xPressed():void {
    this.target.interact();
  }

  update() {
    var group:List<Interactable> = <any> C.state().groups("Interactable");
    var closest:Interactable = group.sortByKey((e:Entity) => { return C.entityDist(this.player, e); }).first();
    if (!closest) return;

    var showIndicator = (C.entityDist(closest, this.player) < 80);

    if (showIndicator) {
      this.x = closest.x;
      this.y = closest.y - 10;
    }

    this.target = showIndicator ? closest: null;
    this.visible = showIndicator;
  }
}

class NPC extends Entity implements Interactable {
  description:string = "Talk";
  distanceToInteract = 80;

  constructor() {
    super("npc");

    this.x = 100;
    this.y = 100;
  }

  interact(): void {
    var d:Dialog = new Dialog(["blah bl blahlablahc", "blabla blah."]);
  }

  groups():string[] {
    return super.groups().concat("Interactable");
  }
}

class Dialog extends Phaser.Group implements Interactable {
  width:number = 300;
  height:number = 200;
  border:number = 20;
  ticks:number = 0;

  baseSpeed:number = 3;
  effectiveSpeed:number = 3;

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

  description:string = "Advance";
  distanceToInteract:number = Infinity;

  interact() {
    // TODO
  }

  private getEffectiveSpeed():number {
    var effectiveSpeed = this.baseSpeed;

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

  private advanceDialog():void {
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

class HealthBar extends Phaser.Graphics {
  maxWidth:number = 25;

  constructor(private health:number, private maxHealth:number) {
    super(game, 0, 0);

    this.draw();
  }

  private draw() {
    var effectiveWidth = (this.health / this.maxHealth) * this.maxWidth;

    this.clear();

    this.beginFill(0x000000, 1);
    this.drawRect(0, 0, this.maxWidth, 5);
    this.endFill();

    this.beginFill(0xff0000, 1);
    this.drawRect(0, 0, effectiveWidth, 5);
    this.endFill();
  }

  setHealth(health:number) {
    this.health = health;

    this.draw();
  }
}

class MenuItem extends Phaser.Group {
  private _selected:boolean = false;
  private text:Phaser.Text;

  constructor(private content:string) {
    super(game);

    this.add(this.text = new Phaser.Text(game, 0, 0, this.content, {font: "14 pt Arial"}));
  }

  get selected():boolean {
    return this._selected;
  }

  set selected(value:boolean) {
    this._selected = value;

    if (this._selected) {
      this.text.text = "> " + this.content;
    } else {
      this.text.text = this.content;
    }
  }
}

class MenuUI extends Phaser.Group {
  menuItems:MenuItem[];
  selectedItemIndex:number = 0;

  constructor(private items:string[]) {
    super(game);

    this.menuItems = [];

    for (var i = 0; i < items.length; i++) {
      var item = new MenuItem(items[i]);

      item.x = 50;
      item.y = 20 * i + 50;

      this.menuItems[i] = item;
      this.add(this.menuItems[i]);
    }

    this.menuItems[0].selected = true;

    game.input.keyboard.addKey(Phaser.Keyboard.UP).onUp.add(function() { this.changeSelectedItem(-1); }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.DOWN).onUp.add(function() { this.changeSelectedItem(+1); }, this);
  }

  private changeSelectedItem(dx) {
    this.menuItems[this.selectedItemIndex].selected = false;
    this.selectedItemIndex = Phaser.Math.clamp(this.selectedItemIndex + dx, 0, this.menuItems.length - 1);
    this.menuItems[this.selectedItemIndex].selected = true;
  }
}

class Player extends Entity {
  speed:number = 300;
  map:GameMap;

  constructor(game:Phaser.Game, map:GameMap) {
    super("player");

    this.x = this.y = 50;

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

    if (keyboard.isDown(Phaser.Keyboard.LEFT)) {
      this.body.velocity.x = -this.speed;
    }

    if (keyboard.isDown(Phaser.Keyboard.RIGHT)) {
      this.body.velocity.x = this.speed;
    }

    if (keyboard.isDown(Phaser.Keyboard.UP)) {
      this.body.velocity.y = -this.speed;
    }

    if (keyboard.isDown(Phaser.Keyboard.DOWN)) {
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