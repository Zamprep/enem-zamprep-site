/**
 * MainMenuScene
 * The first screen, with a "Start" button.
 */
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        this.add.text(400, 250, 'Bucket Catch', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        const startButton = this.add.text(400, 350, 'Start Game', { fontSize: '32px', fill: '#fff', backgroundColor: '#2B2B2B', padding: { x: 20, y: 10 } })
            .setOrigin(0.5)
            .setInteractive();

        // Add hover effect for the button
        startButton.on('pointerover', () => startButton.setStyle({ fill: '#00BFA5' }));
        startButton.on('pointerout', () => startButton.setStyle({ fill: '#fff' }));
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene'); // Start the main game scene
        });
    }
}

/**
 * HudScene
 * A separate scene that runs on top of the GameScene to display UI elements.
 */
class HudScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HudScene' });
    }

    create() {
        // Create text objects for score and lives
        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' });
        this.livesText = this.add.text(780, 20, 'Lives: 3', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(1, 0);

        // --- Power-up Buttons ---
        this.slowdownButton = this.createPowerButton(250, 'Slowdown');
        this.shieldButton = this.createPowerButton(400, 'Shield');
        this.clearButton = this.createPowerButton(550, 'Clear');

        // Get a reference to the GameScene to listen for events
        const gameScene = this.scene.get('GameScene');

        // Listen for events from GameScene to update button states
        gameScene.events.on('powerUsed', (powerKey) => {
            this[`${powerKey}Button`].setAlpha(0.5).disableInteractive();
        });
        gameScene.events.on('powersRefreshed', () => {
            this.slowdownButton.setAlpha(1).setInteractive();
            this.shieldButton.setAlpha(1).setInteractive();
            this.clearButton.setAlpha(1).setInteractive();
        });

        gameScene.events.on('updateScore', (score) => {
            this.scoreText.setText(`Score: ${score}`);
        });

        gameScene.events.on('updateLives', (lives) => {
            this.livesText.setText(`Lives: ${lives}`);
        });
    }

    createPowerButton(x, text) {
        const button = this.add.text(x, 25, text, { fontSize: '20px', fill: '#fff', backgroundColor: '#2B2B2B', padding: { x: 10, y: 5 }, align: 'center' })
            .setOrigin(0.5)
            .setInteractive();

        button.on('pointerdown', () => {
            this.scene.get('GameScene').events.emit('activatePower', text.toLowerCase());
        });
        return button;
    }
}

/**
 * GameScene
 * The core gameplay scene for "Equation Eruption".
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.currentProblem = null;
        this.answerBlocks = null; // A group for the falling answers

        // Power-up state
        this.slowdownAvailable = true;
        this.shieldAvailable = true;
        this.clearAvailable = true;
    }

    /**
     * Load all game assets like images and sounds.
     */
    preload() {
        // Load the new background and game assets.
        this.load.image('game_bg', 'assets/game_bg.png');
        this.load.image('bucket', 'assets/bucket.png');

        // Load a placeholder image for the falling problem blocks.
        // Create a simple 250x100px rectangle image for this.
        this.load.image('problemBlock', 'assets/problem_block.png');

        // Load sound effects.
        // You'll need to add these files to your 'assets' folder.
        this.load.audio('correctSound', 'assets/correct.mp3');
        this.load.audio('incorrectSound', 'assets/incorrect.mp3');
    }

    /**
     * Set up the game objects and logic.
     */
    create() {
        // 1. Add background and static UI
        this.add.image(400, 300, 'game_bg');
        this.questionText = this.add.text(400, 50, 'Loading problem...', { fontSize: '32px', fill: '#fff', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);

        // 2. Set up game variables
        this.score = 0;
        this.lives = 3;
        this.level = 1;

        // Reset power-up states
        this.slowdownAvailable = true;
        this.shieldAvailable = true;
        this.clearAvailable = true;

        // 2.5 Launch the HUD Scene to run in parallel and initialize its values
        this.scene.launch('HudScene');
        this.events.emit('updateScore', this.score);
        this.events.emit('updateLives', this.lives);

        // 3. Create groups for dynamic objects (like falling problems and answer boulders)
        this.answerBlocks = this.physics.add.group();

        
        // 4. Create the player's bucket
        this.playerBucket = this.physics.add.sprite(400, 550, 'bucket').setCollideWorldBounds(true);
        this.playerBucket.body.setImmovable(true); // So falling blocks don't push it

        // 5. Enable player input to move the bucket
        this.input.on('pointermove', (pointer) => {
            this.playerBucket.setX(pointer.x);
        });

        // Set initial gravity based on level 1
        this.updateGravity();

        // 6. Set up collision detection between the bucket and falling answer blocks
        this.physics.add.overlap(this.playerBucket, this.answerBlocks, this.handleCatch, null, this);

        // 7. Listen for power activation events from the HUD
        this.events.on('activatePower', (powerKey) => {
            if (powerKey === 'slowdown') this.activateSlowdown();
            if (powerKey === 'shield') this.activateShield();
            if (powerKey === 'clear') this.activateClear();
        });

        // 7. Spawn the first problem
        this.spawnProblem();
    }

    /**
     * The main game loop, called on every frame.
     */
    update() {
        // Iterate over all active problem blocks in the group.
        this.answerBlocks.getChildren().forEach(answerBlock => {
            // Check if a block has fallen off the bottom of the screen.
            if (answerBlock.y > 650) { // 600 is screen height, 650 gives some buffer.
                this.handleBlockMissed(answerBlock);
            }
        });
    }

    /**
     * Fetches a problem (from Gemini or a local source), displays it,
     * and sets up the corresponding answer choices.
     */
    async spawnProblem() {
        // This is where we will call our backend API to get a problem from Gemini
        try {
            const response = await fetch('/api/generate-problem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send the current level to get a problem of appropriate difficulty
                body: JSON.stringify({ level: this.level })
            });
            if (!response.ok) throw new Error('Failed to fetch problem');
            const problemData = await response.json();
            this.currentProblem = problemData;
            this.setupNewProblem();
        } catch (error) {
            console.error("API call failed, using fallback problem.", error);
            this.currentProblem = {
                question: "x² - 5x + 6 = 0",
                answers: { correct: [2, 3], distractors: [-2, -3] }
            };
            this.setupNewProblem();
        }
    }

    /**
     * Displays the new question and starts spawning the falling answer blocks.
     */
    setupNewProblem() {
        this.questionText.setText(this.currentProblem.question);

        const { correct, distractors } = this.currentProblem.answers;
        const allAnswers = correct.map(ans => ({ value: ans, isCorrect: true }))
            .concat(distractors.map(ans => ({ value: ans, isCorrect: false })));

        Phaser.Utils.Array.Shuffle(allAnswers); // Shuffle answers randomly

        // Spawn answer blocks with a delay. The delay gets shorter on higher levels.
        const spawnDelay = Math.max(200, 1000 - (this.level * 100));
        this.time.addEvent({
            delay: spawnDelay,
            callback: () => {
                const answerData = allAnswers.pop();
                if (answerData) {
                    this.createAnswerBlock(answerData);
                }
            },
            repeat: allAnswers.length - 1
        });
    }

    createAnswerBlock({ value, isCorrect }) {
        const x = Phaser.Math.Between(100, 700);
        const blockImage = this.add.image(0, 0, 'problemBlock');
        const answerText = this.add.text(0, 0, value, { fontSize: '32px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        const answerContainer = this.add.container(x, -100, [blockImage, answerText]);
        answerContainer.setSize(blockImage.width, blockImage.height);
        answerContainer.setData('isCorrect', isCorrect);
        this.answerBlocks.add(answerContainer);
    }

    /**
     * Called when the player's bucket overlaps with a falling problem block.
     * @param {Phaser.GameObjects.Sprite} playerBucket The player's bucket sprite.
     * @param {Phaser.GameObjects.Container} answerBlock The falling answer container.
     */
    handleCatch(playerBucket, answerBlock) {
        if (answerBlock.getData('isCorrect')) {
            this.handleProblemSuccess();
        } else {
            this.handleIncorrectSelection();
        }
        answerBlock.destroy();
    }

    handleProblemSuccess() {
        this.sound.play('correctSound');
        this.score += 10;
        this.events.emit('updateScore', this.score);

        // Check for level up every 50 points
        if (this.score > 0 && this.score % 50 === 0) {
            this.levelUp();
        }

        // Clear away any other falling blocks for this question
        this.answerBlocks.clear(true, true);

        // Spawn the next problem after a short delay
        this.time.delayedCall(500, () => this.spawnProblem());
    }

    handleIncorrectSelection() {
        // Check if shield is active
        if (this.shieldAvailable) {
            this.shieldAvailable = false; // Consume the shield
            this.events.emit('powerUsed', 'shield');
            return; // Forgive the mistake
        }

        this.sound.play('incorrectSound');
        this.lives--;
        this.events.emit('updateLives', this.lives);

        // Visual feedback: flash the camera red
        this.cameras.main.flash(200, 255, 0, 0);

        if (this.lives <= 0) {
            this.scene.start('GameOverScene', { score: this.score });
        }
    }

    /**
     * Handles what happens when a problem is failed (e.g., hits the lava).
     * @param {Phaser.GameObjects.Container} answerBlock The answer block that was missed.
     */
    handleBlockMissed(answerBlock) {
        // Only lose a life if the missed block was a correct answer
        if (answerBlock.getData('isCorrect')) {
            // Check if shield is active
            if (this.shieldAvailable) {
                this.shieldAvailable = false; // Consume the shield
                this.events.emit('powerUsed', 'shield');
                answerBlock.destroy(); // Still destroy the block
                return; // Forgive the mistake
            }
            this.sound.play('incorrectSound');
            this.lives--;
            this.events.emit('updateLives', this.lives);

            if (this.lives <= 0) {
                this.scene.start('GameOverScene', { score: this.score });
            }
        }

        // Destroy the failed block
        answerBlock.destroy();

        // If all blocks are gone (either caught or missed), spawn a new problem
        if (this.answerBlocks.countActive(true) === 0) {
            this.time.delayedCall(500, () => this.spawnProblem());
        } else {
        }
    }

    /**
     * Increases the game level and difficulty.
     */
    levelUp() {
        this.level++;
        console.log(`Level Up! Now at level ${this.level}`);

        // Refresh powers for the new level
        this.slowdownAvailable = true;
        this.shieldAvailable = true;
        this.clearAvailable = true;
        this.events.emit('powersRefreshed');

        // Show a "Level Up!" message
        const levelUpText = this.add.text(400, 300, `Level ${this.level}!`, {
            fontSize: '64px', fill: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(100);

        // Make it fade out
        this.tweens.add({ targets: levelUpText, alpha: 0, duration: 2000, ease: 'Power2' });

        this.updateGravity();
    }

    updateGravity() {
        // Calculate fall time: starts at 10s, gets faster, bottoms out at 3s.
        const fallTime = Math.max(3, 11 - this.level);
        const newGravity = (2 * 600) / (fallTime * fallTime); // gravity = 2 * distance / time^2
        this.physics.world.gravity.y = newGravity;
    }

    // --- Power-up Logic ---

    activateSlowdown() {
        if (!this.slowdownAvailable) return;
        this.slowdownAvailable = false;
        this.events.emit('powerUsed', 'slowdown');

        const originalGravity = this.physics.world.gravity.y;
        this.physics.world.gravity.y /= 3; // Reduce gravity significantly

        // Restore gravity after 5 seconds
        this.time.delayedCall(5000, () => {
            this.physics.world.gravity.y = originalGravity;
        });
    }

    activateShield() {
        if (!this.shieldAvailable) return;
        // The shield is a passive ability, its state is checked on mistake.
        // For simplicity, we'll consume it on click, but it only works once.
        // A better UI would show it as "armed".
        console.log('Shield is active!');
        // The actual consumption happens in the mistake handlers.
    }

    activateClear() {
        if (!this.clearAvailable) return;
        this.clearAvailable = false;
        this.events.emit('powerUsed', 'clear');

        this.answerBlocks.getChildren().forEach(block => {
            if (!block.getData('isCorrect')) {
                block.destroy();
            }
        });
    }
}

/**
 * GameOverScene
 * The screen that shows the final score and a "Play Again" button.
 */
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        this.add.text(400, 250, 'Game Over', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 320, `Final Score: ${data.score}`, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        const playAgainButton = this.add.text(400, 400, 'Play Again', { fontSize: '32px', fill: '#fff', backgroundColor: '#2B2B2B', padding: { x: 20, y: 10 } })
            .setOrigin(0.5)
            .setInteractive();

        // Add hover effect
        playAgainButton.on('pointerover', () => playAgainButton.setStyle({ fill: '#00BFA5' }));
        playAgainButton.on('pointerout', () => playAgainButton.setStyle({ fill: '#fff' }));
        playAgainButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }
}

/**
 * The main Phaser game configuration.
 */
const config = {
    type: Phaser.AUTO, // Automatically choose between WebGL or Canvas rendering
    width: 800,        // Game width in pixels
    height: 600,       // Game height in pixels
    parent: 'phaser-game',
    backgroundColor: '#007A68', // Using your site's primary color for the background
    // Add the physics configuration object
    physics: {
        default: 'arcade'
    },
    // List all the scenes that the game will use
    scene: [MainMenuScene, GameScene, HudScene, GameOverScene]
};

// Create a new Phaser Game instance with our configuration
const game = new Phaser.Game(config);