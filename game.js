const app = new PIXI.Application({
  width: 1280,
  height: 720,
  backgroundColor: 0x000000,
});
document.body.appendChild(app.view);

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

// --- Гравець ---
const player = new PIXI.Graphics();
player.beginFill(0x00ff00);
player.drawRect(0, 0, 60, 20);
player.endFill();
player.x = app.screen.width / 2 - 30;
player.y = app.screen.height - 50;
app.stage.addChild(player);

// --- UI ---
const timerText = new PIXI.Text(`Time: ${timeLeft}`, {
  fill: "white",
  fontSize: 24,
});
timerText.position.set(10, 10);
app.stage.addChild(timerText);

const message = new PIXI.Text("", { fill: "white", fontSize: 48 });
message.anchor.set(0.5);
message.position.set(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(message);

// --- Відображення кількості патронів ---
const bulletText = new PIXI.Text(`Кулі: ${bulletsLeft} / 10`, {
  fill: "white",
  fontSize: 24,
});
bulletText.position.set(app.screen.width - 200, 10);
app.stage.addChild(bulletText);

// --- Керування ---
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space" && bulletsLeft > 0 && !gameOver) {
    shootBullet();
    bulletsLeft--;
    bulletText.text = `Кулі: ${bulletsLeft} / 10`; // Оновлення тексту патронів
  }
});
window.addEventListener("keyup", (e) => (keys[e.code] = false));

// --- Спавн астероїдів ---
function spawnAsteroids(count = 5) {
  for (let i = 0; i < count; i++) {
    const asteroid = new PIXI.Graphics();
    asteroid.beginFill(0xff0000);
    asteroid.drawCircle(0, 0, 30);
    asteroid.endFill();
    asteroid.x = Math.random() * (app.screen.width - 60) + 30;
    asteroid.y = Math.random() * 300 + 50;
    app.stage.addChild(asteroid);
    asteroids.push(asteroid);
  }
}
spawnAsteroids();

// --- Постріл ---
function shootBullet() {
  const bullet = new PIXI.Graphics();
  bullet.beginFill(0xffffff);
  bullet.drawRect(0, 0, 5, 15);
  bullet.endFill();
  bullet.x = player.x + 27;
  bullet.y = player.y;
  app.stage.addChild(bullet);
  bullets.push(bullet);
}

// --- Таймер ---
let timerId = setInterval(() => {
  if (gameOver) return;
  timeLeft--;
  timerText.text = `Time: ${timeLeft}`;
  if (timeLeft <= 0) {
    clearInterval(timerId);
    endGame(false);
  }
}, 1000);

// --- Основний цикл ---
app.ticker.add(() => {
  if (gameOver) return;

  // Рух гравця
  if (keys["ArrowLeft"]) player.x = Math.max(0, player.x - 5);
  if (keys["ArrowRight"])
    player.x = Math.min(app.screen.width - 60, player.x + 5);

  // Рух куль
  bullets.forEach((bullet, i) => {
    bullet.y -= 10;
    if (bullet.y < 0) {
      app.stage.removeChild(bullet);
      bullets.splice(i, 1);
    }
  });

  // Перевірка зіткнень з астероїдами
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

  // Якщо всі астероїди знищені
  if (asteroids.length === 0 && level === 1) {
    startBossLevel();
  }

  // Якщо закінчились кулі
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

  const boss = new PIXI.Graphics();
  boss.beginFill(0x0000ff);
  boss.drawRect(0, 0, 100, 60);
  boss.endFill();
  boss.x = app.screen.width / 2 - 50;
  boss.y = 100;
  app.stage.addChild(boss);

  const hpBar = new PIXI.Text(`Boss HP: ${bossHP}`, {
    fill: "red",
    fontSize: 24,
  });
  hpBar.position.set(boss.x, boss.y - 30);
  app.stage.addChild(hpBar);

  // Стріляє бос
  setInterval(() => {
    if (gameOver) return;
    const bossBullet = new PIXI.Graphics();
    bossBullet.beginFill(0xffff00);
    bossBullet.drawRect(0, 0, 5, 15);
    bossBullet.endFill();
    bossBullet.x = boss.x + 47;
    bossBullet.y = boss.y + 60;
    app.stage.addChild(bossBullet);
    bossBullets.push(bossBullet);
  }, 2000);

  // Логіка боса
  app.ticker.add(() => {
    if (gameOver) return;

    boss.x += Math.sin(app.ticker.lastTime / 500) * 2;
    hpBar.x = boss.x;

    // Кулі боса
    bossBullets.forEach((bullet, i) => {
      bullet.y += 5;
      if (bullet.y > app.screen.height) {
        app.stage.removeChild(bullet);
        bossBullets.splice(i, 1);
      }
      if (hitTest(bullet, player)) {
        endGame(false);
      }
    });

    // Попадання в боса
    bullets.forEach((bullet, bi) => {
      if (hitTest(bullet, boss)) {
        app.stage.removeChild(bullet);
        bullets.splice(bi, 1);
        bossHP--;
        hpBar.text = `Boss HP: ${bossHP}`;
        if (bossHP <= 0) endGame(true);
      }
    });

    // Перехоплення куль
    bullets.forEach((pBullet, pi) => {
      bossBullets.forEach((bBullet, bi) => {
        if (hitTest(pBullet, bBullet)) {
          app.stage.removeChild(pBullet);
          app.stage.removeChild(bBullet);
          bullets.splice(pi, 1);
          bossBullets.splice(bi, 1);
        }
      });
    });

    if (bulletsLeft === 0 && bossHP > 0) {
      endGame(false);
    }
  });
}

// --- Кінець гри ---
function endGame(win) {
  gameOver = true;
  message.text = win ? "YOU WIN" : "YOU LOSE";
}

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
startButton.on("pointerdown", () => location.reload());
app.stage.addChild(startButton);
