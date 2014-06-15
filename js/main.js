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
    C.state = function () {
        return game.state.getCurrentState();
    };

    C.entityDist = function (a, b) {
        return Phaser.Math.distance(a.x, a.y, b.x, b.y);
    };
    C.tileWidth = 25;
    C.tileHeight = 25;

    C.mapWidthInTiles = 30;
    C.mapHeightInTiles = 25;

    C.mapWidthInPixels = C.mapWidthInTiles * C.tileWidth;
    C.mapHeightInPixels = C.mapHeightInTiles * C.tileHeight;
    return C;
})();

var SuperArrayList = (function (_super) {
    __extends(SuperArrayList, _super);
    function SuperArrayList() {
        _super.apply(this, arguments);
    }
    SuperArrayList.prototype.sortByKey = function (key) {
        this.list.sort(function (a, b) {
            return key(a) - key(b);
        });

        return this;
    };
    return SuperArrayList;
})(Phaser.ArrayList);

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
        this.load.image("indicator", "assets/indicator.png");
        this.load.spritesheet("npc", "assets/npc.png", 25, 25, 1);
    };

    MainState.prototype.create = function () {
        var cursors = this.game.input.keyboard.createCursorKeys();
        game.camera.bounds = null;

        this.map = new GameMap("tilesetkey", "map");

        this.game.add.existing(new NPC());

        this.player = new Player(this.game, this.map);
        this.game.add.existing(this.player);

        this.game.add.existing(this.indicator = new Indicator(this.player));
        this.game.add.existing(this.hud = new HUD(this.indicator));
        // var d:Dialog = new Dialog(["blah bl blahlablahc", "blabla blah."]);
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

var HUD = (function (_super) {
    __extends(HUD, _super);
    function HUD(indicator) {
        _super.call(this, game);

        this.indicator = indicator;
        this.buttonText = this.add(new Phaser.Text(game, 5, 5, "X button to DIE", { font: "14 pt Arial" }));
    }
    HUD.prototype.update = function () {
        var target = this.indicator.target;

        if (target) {
            this.buttonText.text = "X to " + target.description;
        } else {
            this.buttonText.text = "X to literally die.";
        }
    };
    return HUD;
})(Phaser.Group);

;

var Entity = (function (_super) {
    __extends(Entity, _super);
    function Entity(spritesheet) {
        _super.call(this, game, 0, 0, spritesheet, 0);
        this.listeners = [];

        game.physics.enable(this, Phaser.Physics.ARCADE);

        this.addToGroups();
    }
    Entity.prototype.groups = function () {
        return [this.constructor.name];
    };

    Entity.prototype.addToGroups = function () {
        var groups = this.groups();
        var currentState = game.state.getCurrentState();

        for (var i = 0; i < groups.length; i++) {
            var groupName = groups[i];

            if (!currentState.groups[groupName]) {
                var newGroup = new SuperArrayList();
                currentState.groups[groupName] = newGroup;
            }

            currentState.groups[groupName].add(this);
        }
    };

    Entity.prototype.destroy = function () {
        _super.prototype.destroy.call(this);

        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i].signal.remove(this.listeners[i].callback, this.listeners[i].context);
        }
    };

    Entity.prototype.press = function (key, cb, context) {
        var button = game.input.keyboard.addKey(key);
        button.onUp.add(cb, context);

        this.listeners.push({ signal: button.onUp, callback: cb, context: context });
    };
    return Entity;
})(Phaser.Sprite);

var Indicator = (function (_super) {
    __extends(Indicator, _super);
    function Indicator(player) {
        _super.call(this, "indicator");

        this.player = player;
        this.visible = false;

        this.press(Phaser.Keyboard.X, this.xPressed, this);
    }
    Indicator.prototype.xPressed = function () {
        this.target.interact();
    };

    Indicator.prototype.update = function () {
        var _this = this;
        var group = C.state().groups["interactable"];
        var closest = group.sortByKey(function (e) {
            return C.entityDist(_this.player, e);
        }).first;
        var showIndicator = (C.entityDist(closest, this.player) < 80);

        if (showIndicator) {
            this.x = closest.x;
            this.y = closest.y - 10;
        }

        this.target = (showIndicator ? closest : null);
        this.visible = showIndicator;
    };
    return Indicator;
})(Entity);

var NPC = (function (_super) {
    __extends(NPC, _super);
    function NPC() {
        _super.call(this, "npc");
        this.description = "Talk";
        this.distanceToInteract = 80;

        this.x = 100;
        this.y = 100;
    }
    NPC.prototype.interact = function () {
        var d = new Dialog(["blah bl blahlablahc", "blabla blah."]);
    };

    NPC.prototype.groups = function () {
        return _super.prototype.groups.call(this).concat("interactable");
    };
    return NPC;
})(Entity);

var Dialog = (function (_super) {
    __extends(Dialog, _super);
    function Dialog(content, typewriter) {
        if (typeof typewriter === "undefined") { typewriter = true; }
        _super.call(this, game);
        this.width = 300;
        this.height = 200;
        this.border = 20;
        this.ticks = 0;
        this.baseSpeed = 3;
        this.effectiveSpeed = 3;
        this.key = Phaser.Keyboard.Z;
        this.description = "Advance";
        this.distanceToInteract = Infinity;

        this.x = 200;
        this.y = 200;

        this.img = this.game.add.image(0, 0, "dialog");
        this.add(this.img);

        this.textfield = this.game.add.text(this.border, this.border, "", { font: '14pt Arial', wordWrap: true, wordWrapWidth: this.width - this.border * 2 });
        this.add(this.textfield);

        this.allDialog = content.slice(0);

        this.nextButton = game.input.keyboard.addKey(this.key);
        this.nextButton.onDown.add(this.advanceDialog, this);
    }
    Dialog.prototype.interact = function () {
        // TODO
    };

    Dialog.prototype.getEffectiveSpeed = function () {
        var effectiveSpeed = this.baseSpeed;

        if (game.input.keyboard.isDown(this.key)) {
            effectiveSpeed /= 2;
            Phaser.Math.clampBottom(effectiveSpeed, 1);
        }

        return Math.floor(effectiveSpeed);
    };

    Dialog.prototype.update = function () {
        if (++this.ticks % this.getEffectiveSpeed() == 0) {
            this.textfield.text = this.allDialog[0].substring(0, this.textfield.text.length + 1);
        }
    };

    Dialog.prototype.advanceDialog = function () {
        if (this.textfield.text.length == this.allDialog[0].length) {
            this.allDialog.shift();
            this.textfield.text = "";

            if (this.allDialog.length == 0) {
                this.destroy(true);
                this.nextButton.onDown.remove(this.advanceDialog, this);
            }
        }
    };
    return Dialog;
})(Phaser.Group);

// circular dependency between player and HUD...
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(game, map) {
        _super.call(this, "player");
        this.speed = 300;

        this.x = this.y = 50;

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
