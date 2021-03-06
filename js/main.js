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

var List = (function () {
    function List() {
        this.contents = [];
    }
    List.prototype.get = function (i) {
        return this.contents[i];
    };

    List.prototype.set = function (i, value) {
        this.contents[i] = value;
    };

    List.prototype.push = function (value) {
        this.contents.push(value);
    };

    List.prototype.sortByKey = function (key) {
        this.contents.sort(function (a, b) {
            return key(a) - key(b);
        });

        return this;
    };

    List.prototype.first = function () {
        return this.contents[0];
    };
    return List;
})();

var Mode;
(function (Mode) {
    Mode[Mode["Normal"] = 0] = "Normal";
})(Mode || (Mode = {}));

var MainState = (function (_super) {
    __extends(MainState, _super);
    function MainState() {
        _super.apply(this, arguments);
        this._groups = {};
        this.gameMode = 0 /* Normal */;
    }
    MainState.prototype.groups = function (key) {
        if (!(key in this._groups)) {
            this._groups[key] = new List();
        }

        return this._groups[key];
    };

    MainState.prototype.preload = function () {
        this.load.spritesheet("player", "assets/player.png", 25, 25, 1);
        this.load.spritesheet("tilesetkey", "assets/tileset.png", 25, 25, 1);
        this.load.tilemap("map", "assets/map.json", null, Phaser.Tilemap.TILED_JSON);
        this.load.image("dialog", "assets/dialogbox.png");
        this.load.image("indicator", "assets/indicator.png");
        this.load.spritesheet("npc", "assets/npc.png", 25, 25, 1);
        this.load.spritesheet("monster", "assets/monster.png", 25, 25, 1);
    };

    MainState.prototype.create = function () {
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
    };

    MainState.prototype.switchMode = function (to) {
        if (this.gameMode == to)
            return;

        this.gameMode = to;
    };

    MainState.prototype.update = function () {
        switch (this.gameMode) {
            case 0 /* Normal */:
                this.normalUpdate();
                return;
            default:
                debugger;
        }
    };

    MainState.prototype.normalUpdate = function () {
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

        this.keyboard = this.game.input.keyboard;
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
            currentState.groups(groups[i]).push(this);
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

var BaseMonster = (function (_super) {
    __extends(BaseMonster, _super);
    function BaseMonster(asset) {
        _super.call(this, asset);

        this.p = C.state().groups("Player").first();
    }
    return BaseMonster;
})(Entity);

var MonsterMode;
(function (MonsterMode) {
    MonsterMode[MonsterMode["Walking"] = 0] = "Walking";
    MonsterMode[MonsterMode["Stopped"] = 1] = "Stopped";
})(MonsterMode || (MonsterMode = {}));

var Monster = (function (_super) {
    __extends(Monster, _super);
    function Monster() {
        _super.call(this, "monster");
        this.currentMode = 0 /* Walking */;
        this.timeLeft = 30;
        this.walkingDX = 0;
        this.walkingDY = 0;
    }
    Monster.prototype.damage = function (amount) {
        return _super.prototype.damage.call(this, amount);
    };

    Monster.prototype.update = function () {
        switch (this.currentMode) {
            case 1 /* Stopped */:
                if (--this.timeLeft <= 0) {
                    var dx = [0, 0, 1, -1];
                    var dy = [1, -1, 0, 0];
                    var i = Math.floor(Math.random() * dx.length);

                    this.walkingDX = dx[i];
                    this.walkingDY = dy[i];
                    this.timeLeft = 50;

                    this.currentMode = 0 /* Walking */;
                }

                break;
            case 0 /* Walking */:
                if (--this.timeLeft <= 0) {
                    this.timeLeft = 50;
                    this.currentMode = 1 /* Stopped */;
                } else {
                    this.x += this.walkingDX;
                    this.y += this.walkingDY;
                }

                break;
        }
    };
    return Monster;
})(BaseMonster);

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
        var group = C.state().groups("Interactable");
        var closest = group.sortByKey(function (e) {
            return C.entityDist(_this.player, e);
        }).first();
        if (!closest)
            return;

        var showIndicator = (C.entityDist(closest, this.player) < 80);

        if (showIndicator) {
            this.x = closest.x;
            this.y = closest.y - 10;
        }

        this.target = showIndicator ? closest : null;
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
        return _super.prototype.groups.call(this).concat("Interactable");
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

var HealthBar = (function (_super) {
    __extends(HealthBar, _super);
    function HealthBar(health, maxHealth) {
        _super.call(this, game, 0, 0);
        this.health = health;
        this.maxHealth = maxHealth;
        this.maxWidth = 25;

        this.draw();
    }
    HealthBar.prototype.draw = function () {
        var effectiveWidth = (this.health / this.maxHealth) * this.maxWidth;

        this.clear();

        this.beginFill(0x000000, 1);
        this.drawRect(0, 0, this.maxWidth, 5);
        this.endFill();

        this.beginFill(0xff0000, 1);
        this.drawRect(0, 0, effectiveWidth, 5);
        this.endFill();
    };

    HealthBar.prototype.setHealth = function (health) {
        this.health = health;

        this.draw();
    };
    return HealthBar;
})(Phaser.Graphics);

var MenuItem = (function (_super) {
    __extends(MenuItem, _super);
    function MenuItem(content) {
        _super.call(this, game);
        this.content = content;
        this._selected = false;

        this.add(this.text = new Phaser.Text(game, 0, 0, this.content, { font: "14 pt Arial" }));
    }
    Object.defineProperty(MenuItem.prototype, "selected", {
        get: function () {
            return this._selected;
        },
        set: function (value) {
            this._selected = value;

            if (this._selected) {
                this.text.text = "> " + this.content;
            } else {
                this.text.text = this.content;
            }
        },
        enumerable: true,
        configurable: true
    });

    return MenuItem;
})(Phaser.Group);

var MenuUI = (function (_super) {
    __extends(MenuUI, _super);
    function MenuUI(items) {
        _super.call(this, game);
        this.items = items;
        this.selectedItemIndex = 0;

        this.menuItems = [];

        for (var i = 0; i < items.length; i++) {
            var item = new MenuItem(items[i]);

            item.x = 50;
            item.y = 20 * i + 50;

            this.menuItems[i] = item;
            this.add(this.menuItems[i]);
        }

        this.menuItems[0].selected = true;

        game.input.keyboard.addKey(Phaser.Keyboard.UP).onUp.add(function () {
            this.changeSelectedItem(-1);
        }, this);
        game.input.keyboard.addKey(Phaser.Keyboard.DOWN).onUp.add(function () {
            this.changeSelectedItem(+1);
        }, this);
    }
    MenuUI.prototype.changeSelectedItem = function (dx) {
        this.menuItems[this.selectedItemIndex].selected = false;
        this.selectedItemIndex = Phaser.Math.clamp(this.selectedItemIndex + dx, 0, this.menuItems.length - 1);
        this.menuItems[this.selectedItemIndex].selected = true;
    };
    return MenuUI;
})(Phaser.Group);

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
