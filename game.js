
BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {

  preload: function () {
    this.load.image("sea", "assets/sea.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.image("enemyBullet", "assets/enemy-bullet.png");
    this.load.spritesheet("greenEnemy", "assets/enemy.png", 32, 32);
    this.load.spritesheet("whiteEnemy", "assets/shooting-enemy.png", 32, 32);
    this.load.spritesheet("explosion", "assets/explosion.png", 32, 32);
    this.load.spritesheet("player", "assets/player.png", 64, 64);
  },

  create: function () {

    this.setupBackground();
    this.setupPlayer();
    this.setupEnemies();
    this.setupBullets();
    this.setupExplosions();
    this.setupPlayerIcons();
    this.setupText();

    this.cursors = this.input.keyboard.createCursorKeys();  // looks for cursor key presses
  },

  update: function () {
    this.checkCollisions();
    this.spawnEnemies();
    this.enemyFire();
    this.processPlayerInput();
    this.processDelayedEffects();
  },

  render: function () {
  },

  checkCollisions: function() {
    this.physics.arcade.overlap(
      this.bulletPool, this.enemyPool, this.enemyHit, null, this
    );                                                      // bullet/enemy collision detection

    this.physics.arcade.overlap(
      this.bulletPool, this.shooterPool, this.enemyHit, null, this
    );                                                      // bullet/shooter collision detection

    this.physics.arcade.overlap(
      this.player, this.enemyPool, this.playerHit, null, this
    );                                                      // player/enemy collision detection

    this.physics.arcade.overlap(
      this.player, this.shooterPool, this.playerHit, null, this
    );                                                      // player/shooter collision detection

    this.physics.arcade.overlap(
      this.player, this.enemyBulletPool, this.playerHit, null, this
    );                                                      // player/enemy bullet collision detection
  },

  spawnEnemies: function() {
    if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() >0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var enemy = this.enemyPool.getFirstExists(false);
      enemy.reset(
        this.rnd.integerInRange(20, this.game.width - 20), 0,
        BasicGame.ENEMY_HEALTH
      ); // Randomize spawn across top of screen

      enemy.body.velocity.y = this.rnd.integerInRange(
        BasicGame.ENEMY_MIN_Y_VELOCITY, BasicGame.ENEMY_MAX_Y_VELOCITY
      );                                                    // Randomize enemy speed
      enemy.play("fly");                                    // plays enemy animation
    }

    if (this.nextShooterAt < this.time.now && this.shooterPool.countDead() > 0) {
      this.nextShooterAt = this.time.now + this.shooterDelay;
      var shooter = this.shooterPool.getFirstExists(false);

      shooter.reset(                                        // Random spawn across top of screen
        this.rnd.integerInRange(20, this.game.width - 20), 0, BasicGame.SHOOTER_HEALTH
      );

      var target = this.rnd.integerInRange(20, this.game.width - 20); // random destination at bottom

      shooter.rotation = this.physics.arcade.moveToXY(    // rotate sprite to face target and move towards it
        shooter, target, this.game.height,
        this.rnd.integerInRange(
          BasicGame.SHOOTER_MIN_VELOCITY, BasicGame.SHOOTER_MAX_VELOCITY
        )
      ) - Math.PI / 2;

      shooter.play("fly");
      shooter.nextShotAt = 0;                             // shooter's shot timer
    }
  },

  enemyFire: function() {
    this.shooterPool.forEachAlive(function(enemy) {
      if (this.time.now > enemy.nextShotAt && this.enemyBulletPool.countDead() > 0) {
        var bullet = this.enemyBulletPool.getFirstExists(false);
        bullet.reset(enemy.x, enemy.y);
        this.physics.arcade.moveToObject(
          bullet, this.player, BasicGame.ENEMY_BULLET_VELOCITY
        );
        enemy.nextShotAt = this.time.now + BasicGame.SHOOTER_SHOT_DELAY;
      }
    }, this);
  },

  processPlayerInput: function() {
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
      if (this.returnText && this.returnText.exists) {
        this.quitGame();
      } else {
        this.fire();
      }
    }                               // Press z or touchpad to fire
  },

  processDelayedEffects: function() {
    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
    }                               // destroys instructions after they disappear

    if (this.ghostUntil && this.ghostUntil < this.time.now) {
      this.ghostUntil = null;
      this.player.play("fly");
    }

    if (this.showReturn && this.time.now > this.showReturn) {
      this.returnText = this.add.text(this.game.width / 2, this.game.height / 2 + 20,
        "Press Z or tap Game to go back to the Main menu",
        {font: "16px sans-serif", fill: "#fff"}
      );
      this.returnText.anchor.setTo(0.5, 0.5);
      this.showReturn = false;
    }
  },

  setupBackground: function() {
    this.sea = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'sea');
    this.sea.autoScroll(0, BasicGame.SEA_SCROLL_SPEED);
  },

  setupPlayer: function() {
    this.player = this.add.sprite(this.game.width / 2, this.game.height - 50, "player");
    this.player.anchor.setTo(0.5, 0.5); // centers the player sprite
    this.player.animations.add("fly", [0, 1, 2], 20, true);
    this.player.animations.add("ghost", [3, 0, 3, 1], 20, true);
    this.player.play("fly");  // animates the player

    this.physics.enable(this.player, Phaser.Physics.ARCADE);

    this.player.speed = BasicGame.PLAYER_SPEED;  // sets the player movement speed
    this.player.body.collideWorldBounds = true; // player can't move off screen
    this.player.body.setSize(20, 20, 0, -5);  // changes player hitbox size and location
  },

  setupEnemies: function() {
    this.enemyPool = this.add.group();                // create an empty sprite group
    this.enemyPool.enableBody = true;                 // enable physics on all entities in the group
    this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyPool.createMultiple(50, "greenEnemy");  // create 50 enemies in the pool

    this.enemyPool.setAll("anchor.x", 0.5);           // set the centre of each enemy sprite
    this.enemyPool.setAll("anchor.y", 0.5);
    this.enemyPool.setAll("outOfBoundsKill", true);   // destroy enemy when off screen
    this.enemyPool.setAll("checkWorldBounds", true);
    this.enemyPool.setAll("reward", BasicGame.ENEMY_REWARD, false, false, 0, true);

    this.enemyPool.forEach(function(enemy) {          // animates all the enemy planes
      enemy.animations.add("fly", [0, 1, 2], 20, true);
      enemy.animations.add("hit", [3, 1, 3, 2], 20, false);
      enemy.events.onAnimationComplete.add(function(e) {
        e.play("fly");
      }, this);
    });

    this.nextEnemyAt = 0;                             // times when new enemies appear on the screen
    this.enemyDelay = BasicGame.SPAWN_ENEMY_DELAY;

    this.shooterPool = this.add.group();                // new pool for enemy shooter
    this.shooterPool.enableBody = true;                 // enable physics
    this.shooterPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.shooterPool.createMultiple(20, "whiteEnemy");  // create multiple enemies

    this.shooterPool.setAll("anchor.x", 0.5);           // sets the centre of the enemy sprite
    this.shooterPool.setAll("anchor.y", 0.5);
    this.shooterPool.setAll("outOfBoundsKill", true);   // destroys enemy when offscreen
    this.shooterPool.setAll("checkWorldBounds", true);
    this.shooterPool.setAll("reward", BasicGame.SHOOTER_REWARD, false, false, 0, true);

    this.shooterPool.forEach(function(enemy) {          // animates the shooter
      enemy.animations.add("fly", [0, 1, 2], 20, true);
      enemy.animations.add("hit", [3, 1, 3, 2], 20, true);
      enemy.events.onAnimationComplete.add(function(e) {
        e.play("fly");
      }, this);
    });

    this.nextShooterAt = this.time.now + Phaser.Timer.SECOND * 5;   // spawns shooter enemy
    this.shooterDelay = BasicGame.SPAWN_SHOOTER_DELAY;
  },

  setupBullets: function() {
    this.enemyBulletPool = this.add.group();
    this.enemyBulletPool.enableBody = true;
    this.enemyBulletPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyBulletPool.createMultiple(100, "enemyBullet");

    this.enemyBulletPool.setAll("anchor.x", 0.5);
    this.enemyBulletPool.setAll("anchor.y", 0.5);
    this.enemyBulletPool.setAll("outOfBoundsKill", true);
    this.enemyBulletPool.setAll("checkWorldBounds", true);
    this.enemyBulletPool.setAll("reward", 0, false, false, 0, true);

    this.bulletPool = this.add.group(); // create an empty sprite group
    this.bulletPool.enableBody = true;  // enable physics on the whole group
    this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.bulletPool.createMultiple(100, "bullet");  // create 100 bullets in the pool

    this.bulletPool.setAll("anchor.x", 0.5);  // set the centrepoint on all bullets in pool
    this.bulletPool.setAll("anchor.y", 0.5);
    this.bulletPool.setAll("outOfBoundsKill", true); // destroy bullets outside the world bounds
    this.bulletPool.setAll("checkWorldBounds", true);

    this.nextShotAt = 0;
    this.shotDelay = BasicGame.SHOT_DELAY; //delay between shots in ms
  },

  setupExplosions: function() {
    this.explosionPool = this.add.group();
    this.explosionPool.enableBody = true;
    this.explosionPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.explosionPool.createMultiple(50, "explosion");

    this.explosionPool.setAll("anchor.x", 0.5);
    this.explosionPool.setAll("anchor.y", 0.5);
    this.explosionPool.forEach(function(explosion) {
      explosion.animations.add("boom");
    });
  },

  setupPlayerIcons: function() {
    this.lives = this.add.group();

    var firstLifeIconX = this.game.width - 10 - (BasicGame.PLAYER_EXTRA_LIVES * 30);  // sets location on top of the spare lives
    for (var i = 0; i < BasicGame.PLAYER_EXTRA_LIVES; i += 1) {
      var life = this.lives.create(firstLifeIconX + (30 * i), 30, "player");  // spaces each life out
      life.scale.setTo(0.5, 0.5);                   // sets the size of the icon
      life.anchor.setTo(0.5, 0.5);                  // anchors to the centre of the icon
    }
  },

  setupText: function() {
    this.instructions = this.add.text( this.game.width / 2, this.game.height - 100,
      'Use arrow keys to move, Press z to fire\n' +
      'Pressing the touchpad does both',
      { font: "20px monospace", fill: "#fff", align: "center" }
    );
    this.instructions.anchor.setTo(0.5, 0.5);
    this.instExpire = this.time.now + BasicGame.INSTRUCTION_EXPIRE;  // puts instructions on screen for 10 seconds

    this.score = 0;
    this.scoreText = this.add.text( this.game.width / 2, 30, '' + this.score,
      { font: "20px monospace", fill: "#fff", align: "center" }
    );
    this.scoreText.anchor.setTo(0.5, 0.5);
  },

  fire: function() {

    if (!this.player.alive || this.nextShotAt > this.time.now) {
      return;                         // check player is still alive and delay until next shot
    }

    if (this.bulletPool.countDead() === 0) {  // check if there are bullets in the pool
      return;
    }

    this.nextShotAt = this.time.now + this.shotDelay;

    var bullet = this.bulletPool.getFirstExists(false);   // get the first "dead" bullet in the pool
    bullet.reset(this.player.x, this.player.y - 20);      // resets the sprite
    bullet.body.velocity.y = -BasicGame.BULLET_VELOCITY;  // sets the bullets speed

  },

  enemyHit: function (bullet, enemy) {
    bullet.kill();                            // removes bullet on collision
    this.damageEnemy(enemy, BasicGame.BULLET_DAMAGE);
  },

  playerHit: function (player, enemy) {
    if (this.ghostUntil && this.ghostUntil > this.time.now) {
      return;
    }
    this.damageEnemy(enemy, BasicGame.CRASH_DAMAGE); // sets damage player does to enemy on collision

    var life = this.lives.getFirstAlive();
    if (life !== null) {
      life.kill();
      this.ghostUntil = this.time.now + BasicGame.PLAYER_GHOST_TIME;
      this.player.play("ghost");
    } else {
      this.explode(player);
      player.kill();
      this.displayEnd(false);
    }
  },

  damageEnemy: function(enemy, damage) {
    enemy.damage(damage);
    if (enemy.alive) {
      enemy.play("hit");
    } else {
      this.explode(enemy);
      this.addToScore(enemy.reward);
    }
  },

  addToScore: function(score) {
    this.score += score;
    this.scoreText.text = this.score;
    if (this.score >= 2000) {
      this.enemyPool.destroy();
      this.shooterPool.destroy();
      this.enemyBulletPool.destroy();
      this.displayEnd(true);
    }
  },

  explode: function(sprite) {
    if (this.explosionPool.countDead() === 0) {
      return;
    }
    var explosion = this.explosionPool.getFirstExists(false);
    explosion.reset(sprite.x, sprite.y);
    explosion.play("boom", 15, false, true);
    explosion.body.velocity.x = sprite.body.velocity.x;
    explosion.body.velocity.y = sprite.body.velocity.y;
  },

  displayEnd: function(win) {
    if (this.endText && this.endText.exists) {          // can either win or lose, not both
      return;
    }

    var msg = win ? "You Win!!" : "Game Over";
    this.endText = this.add.text(this.game.width / 2, this.game.height / 2 - 60, msg,
      {font: "72px serif", fill: "#FFF"}
    );
    this.endText.anchor.setTo(0.5, 0);

    this.showReturn = this.time.now + BasicGame.RETURN_MESSAGE_DELAY;
  },

  quitGame: function (pointer) {

    // destroy anything no longer required
    this.sea.destroy();
    this.player.destroy();
    this.enemyPool.destroy();
    this.bulletPool.destroy();
    this.explosionPool.destroy();
    this.instructions.destroy();
    this.scoreText.destroy();
    this.endText.destroy();
    this.returnText.destroy();

    this.state.start('MainMenu'); // go back to the main menu

  }

};
