const app = new PIXI.Application({
  width: 1280,
  height: 720,
  backgroundColor: 0x000000,
});
document.body.appendChild(app.view);

// --- Розміри куль ---
const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 15;

// --- Завантаження текстур ---
const asteroidTexture = PIXI.Texture.from("/assets/asteroid.png");
const playerTexture = PIXI.Texture.from("/assets/Spaceship.png");
const bossTexture = PIXI.Texture.from("/assets/boss.png");
const backgroundTexture = PIXI.Texture.from("/assets/space.png");

// --- Ігрові змінні ---
let level = 1;
let bulletsLeft = 10;
let timeLeft = 60;
let score = 0;
let gameOver = false;
let bossHP = 4;

const bullets = [];
const asteroids = [];
const bossBullets = [];
const keys = {};

let timerId;
let bossShootIntervalId;
let bossTickerHandler;
let bossSprite;
let hpBar;

// --- Фон гри ---
const background = new PIXI.Sprite(backgroundTexture);
background.width = app.screen.width;
background.height = app.screen.height;
app.stage.addChild(background);

// --- Гравець ---
const player = new PIXI.Sprite(playerTexture);
player.x = app.screen.width / 2 - player.width / 2;
// Піднімаємо гравця на 10 пікселів вище
player.y = app.screen.height - 60;
app.stage.addChild(player);

// --- UI ---
const timerText = new PIXI.Text(`Time: ${timeLeft}`, {
  fill: "white",
  fontSize: 24,
});
timerText.position.set(10, 10);
app.stage.addChild(timerText);

const message = new PIXI.Text("", {
  fill: "white",
  fontSize: 48,
});
message.anchor.set(0.5);
message.position.set(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(message);

const bulletText = new PIXI.Text(`Bullets: ${bulletsLeft} / 10`, {
  fill: "white",
  fontSize: 24,
});
bulletText.position.set(app.screen.width - 200, 10);
app.stage.addChild(bulletText);

// --- Кнопка рестарту ---
const startButton = new PIXI.Text("START NEW GAME", {
  fill: "blue",
  fontSize: 36,
  fontWeight: "bold",
});
startButton.anchor.set(0.5);
startButton.position.set(app.screen.width / 2, app.screen.height - 30);
startButton.interactive = true;
startButton.buttonMode = true;
app.stage.addChild(startButton);

// --- Керування ---
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (
    e.code === "Space" &&
    bulletsLeft > 0 &&
    !gameOver &&
    startButton.visible === false
  ) {
    shootBullet();
    bulletsLeft--;
    bulletText.text = `Bullets: ${bulletsLeft} / 10`;
  }
});
window.addEventListener("keyup", (e) => (keys[e.code] = false));

// --- Функція для старту нової гри ---
function startGame() {
  // Очистити попередні інтервали і кадри боса
  if (bossShootIntervalId) {
    clearInterval(bossShootIntervalId);
    bossShootIntervalId = null;
  }
  if (bossTickerHandler) {
    app.ticker.remove(bossTickerHandler);
    bossTickerHandler = null;
  }

  // Скинути змінні
  level = 1;
  bulletsLeft = 10;
  timeLeft = 60;
  score = 0;
  bossHP = 4;
  gameOver = false;

  // Видалити старі об’єкти зі сцени
  bullets.forEach((b) => app.stage.removeChild(b));
  bullets.length = 0;

  asteroids.forEach((a) => app.stage.removeChild(a));
  asteroids.length = 0;

  bossBullets.forEach((b) => app.stage.removeChild(b));
  bossBullets.length = 0;

  if (bossSprite) {
    app.stage.removeChild(bossSprite);
    bossSprite = null;
  }
  if (hpBar) {
    app.stage.removeChild(hpBar);
    hpBar = null;
  }

  // Оновити UI
  bulletText.text = `Bullets: ${bulletsLeft} / 10`;
  timerText.text = `Time: ${timeLeft}`;
  message.text = "";
  startButton.visible = false;

  // Запустити астероїди та таймер
  spawnAsteroids();
  timerId = setInterval(() => {
    if (gameOver) return;
    timeLeft--;
    timerText.text = `Time: ${timeLeft}`;
    if (timeLeft <= 0) {
      clearInterval(timerId);
      endGame(false);
    }
  }, 1000);
}

// --- Спавн астероїдів ---
function spawnAsteroids(count = 5) {
  for (let i = 0; i < count; i++) {
    const asteroid = new PIXI.Sprite(asteroidTexture);
    asteroid.x = Math.random() * (app.screen.width - 60) + 30;
    asteroid.y = Math.random() * 300 + 50;
    app.stage.addChild(asteroid);
    asteroids.push(asteroid);
  }
}

// --- Постріл гравця ---
function shootBullet() {
  const bullet = new PIXI.Graphics();
  bullet.beginFill(0xffffff);
  bullet.drawRect(0, 0, BULLET_WIDTH, BULLET_HEIGHT);
  bullet.endFill();
  bullet.x = player.x + player.width / 2 - BULLET_WIDTH / 2;
  bullet.y = player.y;
  app.stage.addChild(bullet);
  bullets.push(bullet);
}

// --- Основний цикл ---
app.ticker.add(() => {
  if (gameOver || startButton.visible) return;

  // Рух гравця
  if (keys["ArrowLeft"]) player.x = Math.max(0, player.x - 5);
  if (keys["ArrowRight"])
    player.x = Math.min(app.screen.width - player.width, player.x + 5);

  // Рух куль
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.y -= 10;
    if (bullet.y < 0) {
      app.stage.removeChild(bullet);
      bullets.splice(i, 1);
    }
  }

  // Колізії з астероїдами
  bullets.forEach((bullet, bi) => {
    asteroids.forEach((asteroid, ai) => {
      if (hitTest(bullet, asteroid)) {
        app.stage.removeChild(bullet);
        app.stage.removeChild(asteroid);
        bullets.splice(bi, 1);
        asteroids.splice(ai, 1);
        score++;
      }
    });
  });

  if (asteroids.length === 0 && level === 1) {
    startBossLevel();
  }

  if (bulletsLeft === 0 && asteroids.length > 0 && level === 1) {
    endGame(false);
  }
});

// --- Колізії ---
function hitTest(a, b) {
  const ab = a.getBounds();
  const bb = b.getBounds();
  return (
    ab.x < bb.x + bb.width &&
    ab.x + ab.width > bb.x &&
    ab.y < bb.y + bb.height &&
    ab.y + ab.height > bb.y
  );
}

// --- Рівень з босом ---
function startBossLevel() {
  level = 2;
  bulletsLeft = 10;
  bossHP = 4;
  message.text = "";

  bossSprite = new PIXI.Sprite(bossTexture);
  bossSprite.x = app.screen.width / 2 - bossSprite.width / 2;
  bossSprite.y = 100;
  app.stage.addChild(bossSprite);

  hpBar = new PIXI.Text(`Boss HP: ${bossHP}`, {
    fill: "red",
    fontSize: 24,
  });
  hpBar.position.set(bossSprite.x, bossSprite.y - 30);
  app.stage.addChild(hpBar);

  // Інтервал пострілів боса
  bossShootIntervalId = setInterval(() => {
    if (gameOver) return;
    const bossBullet = new PIXI.Graphics();
    bossBullet.beginFill(0xffff00);
    bossBullet.drawRect(0, 0, BULLET_WIDTH, BULLET_HEIGHT);
    bossBullet.endFill();
    bossBullet.x = bossSprite.x + bossSprite.width / 2 - BULLET_WIDTH / 2;
    bossBullet.y = bossSprite.y + bossSprite.height;
    app.stage.addChild(bossBullet);
    bossBullets.push(bossBullet);
  }, 2000);

  // Логіка руху й колізій боса
  bossTickerHandler = () => {
    if (gameOver) return;

    bossSprite.x += Math.sin(app.ticker.lastTime / 500) * 2;
    hpBar.x = bossSprite.x;

    // Кулі боса
    for (let i = bossBullets.length - 1; i >= 0; i--) {
      const bullet = bossBullets[i];
      bullet.y += 5;
      if (bullet.y > app.screen.height) {
        app.stage.removeChild(bullet);
        bossBullets.splice(i, 1);
      }
      if (hitTest(bullet, player)) {
        endGame(false);
      }
    }

    // Попадання гравця в боса
    bullets.forEach((bullet, bi) => {
      if (hitTest(bullet, bossSprite)) {
        app.stage.removeChild(bullet);
        bullets.splice(bi, 1);
        bossHP--;
        hpBar.text = `Boss HP: ${bossHP}`;
        if (bossHP <= 0) endGame(true);
      }
    });

    // Перехоплення куль
    bullets.forEach((pB, pi) => {
      bossBullets.forEach((bB, bi) => {
        if (hitTest(pB, bB)) {
          app.stage.removeChild(pB);
          app.stage.removeChild(bB);
          bullets.splice(pi, 1);
          bossBullets.splice(bi, 1);
        }
      });
    });

    if (bulletsLeft === 0 && bossHP > 0) {
      endGame(false);
    }
  };

  app.ticker.add(bossTickerHandler);
}

// --- Кінець гри ---
function endGame(win) {
  gameOver = true;
  clearInterval(timerId);
  message.text = win ? "YOU WIN" : "YOU LOSE";
  startButton.visible = true;
}

// --- Підписка на кнопку старту ---
startButton.on("pointerdown", startGame);
