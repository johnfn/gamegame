/// <reference path="../d/phaser.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Entity = (function (_super) {
    __extends(Entity, _super);
    function Entity(game, x, y, spritesheet, frame) {
        _super.call(this, game, x, y, spritesheet, frame);

        game.physics.enable(this, Phaser.Physics.ARCADE);

        var superclassName = this.constructor.name;
        var currentState = game.state.getCurrentState();
        if (!currentState.groups[superclassName]) {
            var newGroup = game.add.group();
            currentState.groups[superclassName] = newGroup;
            this.game.add.existing(newGroup);
        }

        currentState.groups[superclassName].add(this);
    }
    return Entity;
})(Phaser.Sprite);

var Player = (function (_super) {
    __extends(Player, _super);
    function Player(game) {
        _super.call(this, game, 50, 50, "player", 0);
        this.speed = 300;

        this.body.drag.x = 1000;
        this.body.drag.y = 1000;
    }
    Player.prototype.update = function () {
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
    };
    return Player;
})(Entity);

var MainState = (function (_super) {
    __extends(MainState, _super);
    function MainState() {
        _super.apply(this, arguments);
        this.groups = {};
    }
    MainState.prototype.preload = function () {
        this.load.spritesheet("player", "assets/player.png", 25, 25, 1);
        this.load.spritesheet("tilesetkey", "assets/tileset.png", 25, 25, 1);
        this.load.tilemap("map", "assets/map.json", null, Phaser.Tilemap.TILED_JSON);
    };

    MainState.prototype.create = function () {
        var cursors = this.game.input.keyboard.createCursorKeys();

        var tileset = this.game.add.tilemap("map", 25, 25, 30, 30);
        console.log(tileset.layers[0].name);

        tileset.addTilesetImage("tileset", "tilesetkey", 25, 25);

        for (var i = 0; i < tileset.layers.length; i++) {
            var tilesetObj = tileset.layers[i];
            var name = tilesetObj.name;

            var l = tileset.createLayer(name);
            this.game.add.existing(l);
        }

        tileset.setCollisionBetween(1, 151, true, "walls");

        var p = new Player(this.game);
        this.game.add.existing(p);
    };
    return MainState;
})(Phaser.State);

var Game = (function () {
    // TODO... browsers w/o WEBGL...
    function Game() {
        this.state = new MainState();
        this.game = new Phaser.Game(800, 600, Phaser.WEBGL, "main", this.state);
    }
    return Game;
})();

new Game();
