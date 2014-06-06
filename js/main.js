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
    }
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
    };

    MainState.prototype.create = function () {
        var cursors = this.game.input.keyboard.createCursorKeys();

        debugger;

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
