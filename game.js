const app = new PIXI.Application({
  width: 1280,
  height: 720,
  backgroundColor: 0x000000,
});
document.body.appendChild(app.view);

let level = 1;
let bulletsLeft = 10;
let timer = 60;
let score = 0;
let gameOver = false;
let bossHP = 4;

const player = new PIXI.Graphics();
player.beginFill(0x00ff00);
player.drawRect(0, 0, 60, 20);
player.endFill();
player.x = app.screen.width / 2 - 30;
player.y = app.screen.height - 50;
app.stage.addChild(player);

const bullets = [];
const asteroids = [];
const bossBullets = [];

const timerText = new PIXI.Text(`Time: ${timer}`, {
  fill: "white",
  fontSize: 24,
});
timerText.x = 10;
timerText.y = 10;
app.stage.addChild(timerText);

const message = new PIXI.Text("", {
  fill: "white",
  fontSize: 48,
  align: "center",
});
message.anchor.set(0.5);
message.x = app.screen.width / 2;
message.y = app.screen.height / 2;
app.stage.addChild(message);

const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space" && bulletsLeft > 0 && !gameOver) {
    shootBullet();
    bulletsLeft--;
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

function spawnAsteroids() {
  for (let i = 0; i < 5; i++) {
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

app.ticker.add((delta) => {
  if (gameOver) return;

  // Рух гравця
  if (keys["ArrowLeft"]) player.x = Math.max(0, player.x - 5);
  if (keys["ArrowRight"])
    player.x = Math.min(app.screen.width - 60, player.x + 5);

  // Рух куль
  bullets.forEach((bullet, index) => {
    bullet.y -= 10;
    if (bullet.y < 0) {
      app.stage.removeChild(bullet);
      bullets.splice(index, 1);
    }
  });

  // Перевірка зіткнень
  bullets.forEach((bullet, bIndex) => {
    asteroids.forEach((asteroid, aIndex) => {
      if (hitTest(bullet, asteroid)) {
        app.stage.removeChild(bullet);
        app.stage.removeChild(asteroid);
        bullets.splice(bIndex, 1);
        asteroids.splice(aIndex, 1);
        score++;
      }
    });
  });

  // Перевірка перемоги
  if (asteroids.length === 0 && level === 1) {
    startBossLevel();
  }

  // Таймер
  if (app.ticker.lastTime % 60 < 1) {
    timer--;
    timerText.text = `Time: ${timer}`;
    if (timer <= 0) endGame(false);
  }

  // Поразка через нестачу куль
  if (bulletsLeft === 0 && asteroids.length > 0 && level === 1) {
    endGame(false);
  }
});

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

function startBossLevel() {
  level = 2;
  bulletsLeft = 10;
  timer = 60;
  timerText.text = `Time: ${timer}`;
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
  hpBar.x = boss.x;
  hpBar.y = boss.y - 30;
  app.stage.addChild(hpBar);

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

  app.ticker.add(() => {
    // Бос рухається
    boss.x += Math.sin(app.ticker.lastTime / 500) * 2;
    hpBar.x = boss.x;

    // Кулі Боса
    bossBullets.forEach((bullet, index) => {
      bullet.y += 5;
      if (bullet.y > app.screen.height) {
        app.stage.removeChild(bullet);
        bossBullets.splice(index, 1);
      }
      if (hitTest(bullet, player)) {
        endGame(false);
      }
    });

    // Перевірка попадання в Боса
    bullets.forEach((bullet, bIndex) => {
      if (hitTest(bullet, boss)) {
        app.stage.removeChild(bullet);
        bullets.splice(bIndex, 1);
        bossHP--;
        hpBar.text = `Boss HP: ${bossHP}`;
        if (bossHP <= 0) endGame(true);
      }
    });

    // Перевірка зіткнення куль
    bullets.forEach((pBullet, pIndex) => {
      bossBullets.forEach((bBullet, bIndex) => {
        if (hitTest(pBullet, bBullet)) {
          app.stage.removeChild(pBullet);
          app.stage.removeChild(bBullet);
          bullets.splice(pIndex, 1);
          bossBullets.splice(bIndex, 1);
        }
      });
    });

    if (bulletsLeft === 0 && bossHP > 0) {
      endGame(false);
    }
  });
}

function endGame(win) {
  gameOver = true;
  message.text = win ? "YOU WIN" : "YOU LOSE";
}
