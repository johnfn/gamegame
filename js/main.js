/// <reference path="../d/phaser.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var g;

var C = (function () {
    function C() {
    }
    C.tileWidth = 25;
    C.tileHeight = 25;

    C.mapWidthInTiles = 30;
    C.mapHeightInTiles = 25;

    C.mapWidthInPixels = C.mapWidthInTiles * C.tileWidth;
    C.mapHeightInPixels = C.mapHeightInTiles * C.tileHeight;
    return C;
})();

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
    function Player(game, map) {
        _super.call(this, game, 50, 50, "player", 0);
        this.speed = 300;

        this.body.drag.x = 1000;
        this.body.drag.y = 1000;

        this.map = map;
        this.checkWorldBounds = true;
        this.events.onOutOfBounds.add(this.outOfBounds, this);
    }
    Player.prototype.outOfBounds = function () {
        var normalizedX = this.x - this.map.mapX;
        var normalizedY = this.y - this.map.mapY;

        var dx = Math.floor(normalizedX / C.mapWidthInPixels);
        var dy = Math.floor(normalizedY / C.mapHeightInPixels);

        this.map.switchMap(dx, dy);
    };

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

// no need to extend groups any more, just have 2 groups of layers.
var GameMap = (function () {
    function GameMap(tilesetKey, tilemapKey) {
        this.layers = {};
        this.collideableLayers = {};
        this.mapX = 0;
        this.mapY = 0;
        var tileset = new Phaser.Tilemap(game, tilemapKey, 25, 25, 30, 30);

        tileset.addTilesetImage("tileset", tilesetKey, 25, 25);

        tileset.setCollisionBetween(1, 151, true, "walls");

        for (var i = 0; i < tileset.layers.length; i++) {
            var tilesetObj = tileset.layers[i];
            var name = tilesetObj.name;

            var layer = tileset.createLayer(name);
            this.collideableLayers[name] = layer;
        }
    }
    GameMap.prototype.switchMap = function (dx, dy) {
        this.mapX += dx * C.mapWidthInPixels;
        this.mapY += dy * C.mapHeightInPixels;

        game.camera.setPosition(this.mapX, this.mapY);
    };
    return GameMap;
})();

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
        game.camera.bounds = null;

        this.map = new GameMap("tilesetkey", "map");

        this.player = new Player(this.game, this.map);
        this.game.add.existing(this.player);

        this.gg = this.game.add.group(undefined, undefined, true);
    };

    MainState.prototype.update = function () {
        var kb = game.input.keyboard;

        for (var name in this.map.collideableLayers) {
            this.game.physics.arcade.collide(this.player, this.map.collideableLayers[name]);
        }

        if (kb.isDown(Phaser.Keyboard.Q)) {
            game.cache.removeTilemap("map");
            var json = $.ajax({ url: "assets/map.json", async: false, dataType: 'text', cache: false }).responseText;
            this.load.tilemap("map", "assets/map.json", json, Phaser.Tilemap.TILED_JSON);
            this.map = new GameMap("tilesetkey", "map");
        }
    };
    return MainState;
})(Phaser.State);

var state = new MainState();
var game = new Phaser.Game(C.mapWidthInPixels, C.mapHeightInPixels, Phaser.WEBGL, "main", this.state);
