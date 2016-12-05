
BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {

  preload: function () {
    this.load.image("sea", "assets/sea.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.spritesheet("greenEnemy", "assets/enemy.png", 32, 32);
    this.load.spritesheet("explosion", "assets/explosion", 32, 32);
    this.load.spritesheet("player", "assets/player.png", 64, 64);
  },

  create: function () {

    this.sea = this.add.tileSprite(0, 0, 800, 600, 'sea');

    this.player = this.add.sprite(400, 550, "player");
    this.player.anchor.setTo(0.5, 0.5); // centers the player sprite
    this.player.animations.add("fly", [0, 1, 2], 20, true);
    this.player.play("fly");  // animates the player
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.speed = 300;  // sets the player movement speed
    this.player.body.collideWorldBounds = true; // player can't move off screen

    this.enemy = this.add.sprite(400, 200, "greenEnemy");
    this.enemy.animations.add("fly", [0, 1, 2], 20, true);
    this.enemy.play("fly");
    this.enemy.anchor.setTo(0.5, 0.5);  // centers the enemy sprite
    this.physics.enable(this.enemy, Phaser.Physics.ARCADE);

    this.bulletPool = this.add.group(); // create an empty sprite group
    this.bulletPool.enableBody = true;  // enable physics on the whole group
    this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.bulletPool.createMultiple(100, "bullet");  // create 100 bullets in the pool
    this.bulletPool.setAll("anchor.x", 0.5);  // set the centrepoint on all bullets in pool
    this.bulletPool.setAll("anchor.y", 0.5);
    this.bulletPool.setAll("outOfBoundsKill", true); // destroy bullets outside the world bounds
    this.bulletPool.setAll("checkWorldBounds", true);

    this.nextShotAt = 0;
    this.shotDelay = 100; //delay between shots in ms

    this.cursors = this.input.keyboard.createCursorKeys();  // looks for cursor key presses

    this.instructions = this.add.text( 400, 500,
      'Use arrow keys to move, Press z to fire\n' +
      'Pressing the touchpad does both',
      { font: "20px monospace", fill: "#fff", align: "center" }
    );
    this.instructions.anchor.setTo(0.5, 0.5);
    this.instExpire = this.time.now + 10000;  // puts instructions on screen for 10 seconds
  },

  update: function () {
    this.sea.tilePosition.y += 0.5; // slowly scrolls the background up

    this.physics.arcade.overlap(
      this.bulletPool, this.enemy, this.enemyHit, null, this
    );                            // bullet/enemy collision detection

    this.player.body.velocity.x = 0;  // Player doesn't move unless key pressed
    this.player.body.velocity.y = 0;  // Player doesn't move unless key pressed

    if (this.cursors.left.isDown) {
      this.player.body.velocity.x = -this.player.speed;
    } else if (this.cursors.right.isDown) {
      this.player.body.velocity.x = this.player.speed;
    }

    if (this.cursors.up.isDown) {
      this.player.body.velocity.y = -this.player.speed;
    } else if (this.cursors.down.isDown) {
      this.player.body.velocity.y = this.player.speed;
    }

    if (this.input.activePointer.isDown &&
        this.physics.arcade.distanceToPointer(this.player) > 15) {
      this.physics.arcade.moveToPointer(this.player, this.player.speed);
    }                               // This allows the use of the touchpad to move the player

    if (this.input.keyboard.isDown(Phaser.Keyboard.Z) ||
        this.input.activePointer.isDown) {
      this.fire();
    }                               // Press z or touchpad to fire

    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
    }                               // destroys instructions after they disappear
  },

  render: function () {
    // this.game.debug.body(this.bullet);
    // this.game.debug.body(this.enemy);
  },

  fire: function() {

    if (this.nextShotAt > this.time.now) {  // check delay until next shot
      return;
    }

    if (this.bulletPool.countDead() === 0) {  // check if there are bullets in the pool
      return;
    }

    this.nextShotAt = this.time.now + this.shotDelay;

    var bullet = this.bulletPool.getFirstExists(false); // get the first "dead" bullet in the pool
    bullet.reset(this.player.x, this.player.y - 20);  //resets the sprite
    bullet.body.velocity.y = -500;  // sets the bullets speed

  },

  enemyHit: function (bullet, enemy) {
    bullet.kill();                            // removes bullet on collisio n
    enemy.kill();                             // removes enemy on collision
    var explosion = this.add.sprite(enemy.x, enemy.y, "explosion");
    explosion.anchor.setTo(0.5, 0.5);   // centers the explosion sprite
    explosion.animations.add("boom");
    explosion.play("boom", 15, false, true);  // plays explosion at enemy location
  },

  quitGame: function (pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');

  }

};
