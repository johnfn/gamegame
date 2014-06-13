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
        this.load.image("dialog", "assets/dialogbox.png");
    };

    MainState.prototype.create = function () {
        var cursors = this.game.input.keyboard.createCursorKeys();
        game.camera.bounds = null;

        this.map = new GameMap("tilesetkey", "map");

        this.player = new Player(this.game, this.map);
        this.game.add.existing(this.player);

        var d = new Dialog(["blah bl blahlablahc", "blabla blah."]);
    };

    MainState.prototype.update = function () {
        var kb = game.input.keyboard;

        for (var name in this.map.collideableLayers) {
            this.game.physics.arcade.collide(this.player, this.map.collideableLayers[name]);
        }

        if (kb.isDown(Phaser.Keyboard.Q)) {
            this.map.reload();
        }
    };
    return MainState;
})(Phaser.State);

var Entity = (function (_super) {
    __extends(Entity, _super);
    function Entity(game, x, y, spritesheet, frame) {
        if (typeof frame === "undefined") { frame = 0; }
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

var Dialog = (function (_super) {
    __extends(Dialog, _super);
    function Dialog(content, typewriter) {
        if (typeof typewriter === "undefined") { typewriter = true; }
        _super.call(this, game);
        this.width = 300;
        this.height = 200;
        this.border = 20;
        this.speed = 3;
        this.ticks = 0;

        this.x = 200;
        this.y = 200;

        this.img = this.game.add.image(0, 0, "dialog");
        this.add(this.img);

        this.textfield = this.game.add.text(this.border, this.border, "", { font: '14pt Arial', wordWrap: true, wordWrapWidth: this.width - this.border * 2 });
        this.add(this.textfield);

        this.allDialog = content.slice(0);

        var nextButton = game.input.keyboard.addKey(Phaser.Keyboard.Z);
        nextButton.onUp.add(this.advanceDialog, this);
    }
    Dialog.prototype.update = function () {
        if (++this.ticks % this.speed == 0) {
            this.textfield.text = this.allDialog[0].substring(0, this.textfield.text.length + 1);
        }
    };

    Dialog.prototype.advanceDialog = function () {
        if (this.textfield.text.length == this.allDialog[0].length) {
            this.allDialog.shift();
            this.textfield.text = "";

            if (this.allDialog.length == 0) {
                this.destroy();
            }
        }
    };
    return Dialog;
})(Phaser.Group);

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
        this.tileset = new Phaser.Tilemap(game, tilemapKey, 25, 25, 30, 30); // w,h, mapw, maph
        this.tilemapKey = tilemapKey;
        this.tilesetKey = tilesetKey;

        this.tileset.addTilesetImage("tileset", tilesetKey, 25, 25);

        this.tileset.setCollisionBetween(1, 151, true, "walls");

        for (var i = 0; i < this.tileset.layers.length; i++) {
            var tilesetObj = this.tileset.layers[i];
            var name = tilesetObj.name;

            var layer = this.tileset.createLayer(name);
            this.collideableLayers[name] = layer;
        }
    }
    GameMap.prototype.switchMap = function (dx, dy) {
        this.mapX += dx * C.mapWidthInPixels;
        this.mapY += dy * C.mapHeightInPixels;

        game.camera.setPosition(this.mapX, this.mapY);
    };

    GameMap.prototype.reload = function () {
        game.cache.removeTilemap("map");
        var json = $.ajax({ url: "assets/map.json", async: false, dataType: 'text', cache: false }).responseText;
        game.load.tilemap("map", "assets/map.json", json, Phaser.Tilemap.TILED_JSON);
        this.tileset = new Phaser.Tilemap(game, this.tilemapKey, 25, 25, 30, 30);

        this.tileset.addTilesetImage("tileset", this.tilesetKey, 25, 25);
        this.tileset.setCollisionBetween(1, 151, true, "walls");

        for (var i = 0; i < this.tileset.layers.length; i++) {
            var tilesetObj = this.tileset.layers[i];
            var name = tilesetObj.name;

            this.collideableLayers[name].destroy(true);

            var layer = this.tileset.createLayer(name);
            this.collideableLayers[name] = layer;
        }
    };
    return GameMap;
})();

var state = new MainState();
var game = new Phaser.Game(C.mapWidthInPixels, C.mapHeightInPixels, Phaser.WEBGL, "main", this.state);
