const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

const hpText = document.getElementById("hp");
const ammoText = document.getElementById("ammo");
const message = document.getElementById("message");

let W = 640;
let H = 360;

canvas.width = W;
canvas.height = H;

ctx.imageSmoothingEnabled = false;

// ===============================
// НАСТРОЙКИ
// ===============================

const FOV = Math.PI / 3;
const NUM_RAYS = 320;
const MAX_DEPTH = 20;

const player = {
    x: 3.5,
    y: 3.5,
    angle: 0,
    hp: 100,
    ammo: 30,
    speed: 0.055,
    rotSpeed: 0.045
};

let shooting = false;
let gameOver = false;
let win = false;

let keys = {};

// ===============================
// КАРТА
// ===============================

const map = [
    "111111111111",
    "100000000001",
    "101111011101",
    "100001000001",
    "111101011101",
    "100001010001",
    "101101010101",
    "100100000001",
    "100101111101",
    "100000000001",
    "111111111111"
];

const MAP_W = map[0].length;
const MAP_H = map.length;

// ===============================
// ВРАГИ
// ===============================

const enemies = [
    {
        x: 8.5,
        y: 2.5,
        hp: 3,
        alive: true,
        attackTimer: 0
    },
    {
        x: 5.5,
        y: 7.5,
        hp: 3,
        alive: true,
        attackTimer: 0
    },
    {
        x: 9.5,
        y: 8.5,
        hp: 3,
        alive: true,
        attackTimer: 0
    }
];

// ===============================
// УПРАВЛЕНИЕ
// ===============================

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (e.code === "Space") {
        shoot();
    }

    if (e.key.toLowerCase() === "r") {
        reload();
    }

    if (gameOver && e.key === "Enter") {
        restart();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("click", () => {
    shoot();
});

// ===============================
// МОБИЛЬНЫЕ КНОПКИ
// ===============================

function holdButton(id, key) {
    const button = document.getElementById(id);

    button.addEventListener("touchstart", e => {
        e.preventDefault();
        keys[key] = true;
    });

    button.addEventListener("touchend", e => {
        e.preventDefault();
        keys[key] = false;
    });

    button.addEventListener("mousedown", () => {
        keys[key] = true;
    });

    button.addEventListener("mouseup", () => {
        keys[key] = false;
    });

    button.addEventListener("mouseleave", () => {
        keys[key] = false;
    });
}

holdButton("forward", "w");
holdButton("back", "s");
holdButton("left", "a");
holdButton("right", "d");

const shootButton = document.getElementById("shoot");

shootButton.addEventListener("touchstart", e => {
    e.preventDefault();
    shoot();
});

shootButton.addEventListener("mousedown", () => {
    shoot();
});

// ===============================
// ПРОВЕРКА СТЕН
// ===============================

function isWall(x, y) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) {
        return true;
    }

    return map[Math.floor(y)][Math.floor(x)] === "1";
}

// ===============================
// ДВИЖЕНИЕ
// ===============================

function movePlayer() {

    if (gameOver) return;

    let moveX = 0;
    let moveY = 0;

    if (keys["w"]) {
        moveX += Math.cos(player.angle) * player.speed;
        moveY += Math.sin(player.angle) * player.speed;
    }

    if (keys["s"]) {
        moveX -= Math.cos(player.angle) * player.speed;
        moveY -= Math.sin(player.angle) * player.speed;
    }

    if (keys["a"]) {
        moveX += Math.cos(player.angle - Math.PI / 2) * player.speed;
        moveY += Math.sin(player.angle - Math.PI / 2) * player.speed;
    }

    if (keys["d"]) {
        moveX += Math.cos(player.angle + Math.PI / 2) * player.speed;
        moveY += Math.sin(player.angle + Math.PI / 2) * player.speed;
    }

    const newX = player.x + moveX;
    const newY = player.y + moveY;

    if (!isWall(newX, player.y)) {
        player.x = newX;
    }

    if (!isWall(player.x, newY)) {
        player.y = newY;
    }

    // Поворот клавишами Q/E
    if (keys["q"]) {
        player.angle -= player.rotSpeed;
    }

    if (keys["e"]) {
        player.angle += player.rotSpeed;
    }
}

// ===============================
// RAYCASTING
// ===============================

function castRay(angle) {

    let distance = 0;

    const step = 0.025;

    while (distance < MAX_DEPTH) {

        const x = player.x + Math.cos(angle) * distance;
        const y = player.y + Math.sin(angle) * distance;

        if (isWall(x, y)) {
            return distance;
        }

        distance += step;
    }

    return MAX_DEPTH;
}

// ===============================
// РЕНДЕР СТЕН
// ===============================

const depthBuffer = new Array(NUM_RAYS);

function renderWorld() {

    // Небо
    ctx.fillStyle = "#202030";
    ctx.fillRect(0, 0, W, H / 2);

    // Пол
    ctx.fillStyle = "#292929";
    ctx.fillRect(0, H / 2, W, H / 2);

    for (let ray = 0; ray < NUM_RAYS; ray++) {

        const rayAngle =
            player.angle - FOV / 2 +
            (ray / NUM_RAYS) * FOV;

        let distance = castRay(rayAngle);

        // Убираем fisheye
        distance *= Math.cos(rayAngle - player.angle);

        depthBuffer[ray] = distance;

        const wallHeight = Math.min(
            H,
            H / distance
        );

        const x = ray * (W / NUM_RAYS);

        const brightness =
            Math.max(20, 170 - distance * 12);

        ctx.fillStyle =
            `rgb(${brightness},${brightness},${brightness})`;

        ctx.fillRect(
            x,
            H / 2 - wallHeight / 2,
            W / NUM_RAYS + 1,
            wallHeight
        );
    }
}

// ===============================
// СПРАЙТЫ ВРАГОВ
// ===============================

function renderEnemies() {

    const visibleEnemies = [];

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        let angle = Math.atan2(dy, dx) - player.angle;

        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;

        if (Math.abs(angle) > FOV / 2 + 0.3) {
            continue;
        }

        visibleEnemies.push({
            enemy,
            distance,
            angle
        });
    }

    // Дальние рисуются первыми
    visibleEnemies.sort((a, b) => b.distance - a.distance);

    for (const obj of visibleEnemies) {

        const enemy = obj.enemy;
        const distance = obj.distance;

        const screenX =
            W / 2 +
            Math.tan(obj.angle) *
            (W / 2) /
            Math.tan(FOV / 2);

        const size = Math.min(
            H,
            H / distance * 0.75
        );

        const rayIndex = Math.floor(
            screenX / W * NUM_RAYS
        );

        if (
            rayIndex >= 0 &&
            rayIndex < NUM_RAYS &&
            distance > depthBuffer[rayIndex] + 0.2
        ) {
            continue;
        }

        const x = screenX - size / 2;
        const y = H / 2 - size / 2;

        // Голова
        ctx.fillStyle = "#cfcfcf";

        ctx.fillRect(
            x + size * 0.28,
            y,
            size * 0.44,
            size * 0.35
        );

        // Тело
        ctx.fillStyle = "#7c1d1d";

        ctx.fillRect(
            x + size * 0.18,
            y + size * 0.32,
            size * 0.64,
            size * 0.68
        );

        // Глаза
        ctx.fillStyle = "#ff0000";

        ctx.fillRect(
            x + size * 0.36,
            y + size * 0.12,
            size * 0.08,
            size * 0.08
        );

        ctx.fillRect(
            x + size * 0.56,
            y + size * 0.12,
            size * 0.08,
            size * 0.08
        );
    }
}

// ===============================
// СТРЕЛЬБА
// ===============================

function shoot() {

    if (gameOver) return;

    if (player.ammo <= 0) {
        return;
    }

    player.ammo--;

    // Ищем врага ближе всего к центру
    let target = null;
    let bestAngle = 999;

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        let angle =
            Math.atan2(dy, dx) - player.angle;

        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;

        if (Math.abs(angle) < bestAngle) {

            // Проверяем, действительно ли враг виден
            const wallDistance = castRay(
                player.angle + angle
            );

            if (distance < wallDistance + 0.2) {
                bestAngle = Math.abs(angle);
                target = enemy;
            }
        }
    }

    if (target && bestAngle < 0.13) {

        target.hp--;

        if (target.hp <= 0) {
            target.alive = false;
        }
    }

    checkWin();
    updateHUD();
}

// ===============================
// ПЕРЕЗАРЯДКА
// ===============================

function reload() {
    player.ammo = 30;
    updateHUD();
}

// ===============================
// ВРАГИ АТАКУЮТ
// ===============================

function updateEnemies() {

    if (gameOver) return;

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        if (distance < 1.4) {

            enemy.attackTimer--;

            if (enemy.attackTimer <= 0) {

                player.hp -= 5;

                enemy.attackTimer = 45;

                updateHUD();

                if (player.hp <= 0) {
                    lose();
                }
            }
        }
    }
}

// ===============================
// ПОБЕДА
// ===============================

function checkWin() {

    const alive = enemies.some(e => e.alive);

    if (!alive) {
        win = true;
        gameOver = true;

        message.style.display = "block";
        message.innerHTML =
            "ПОБЕДА!<br><small>ENTER — заново</small>";
    }
}

// ===============================
// ПРОИГРЫШ
// ===============================

function lose() {

    gameOver = true;

    message.style.display = "block";
    message.innerHTML =
        "ТЫ ПОГИБ<br><small>ENTER — заново</small>";
}

// ===============================
// HUD
// ===============================

function updateHUD() {

    hpText.textContent = Math.max(0, player.hp);
    ammoText.textContent = player.ammo;
}

// ===============================
// ПЕРЕЗАПУСК
// ===============================

function restart() {

    player.x = 3.5;
    player.y = 3.5;
    player.angle = 0;
    player.hp = 100;
    player.ammo = 30;

    enemies[0].x = 8.5;
    enemies[0].y = 2.5;
    enemies[0].hp = 3;
    enemies[0].alive = true;

    enemies[1].x = 5.5;
    enemies[1].y = 7.5;
    enemies[1].hp = 3;
    enemies[1].alive = true;

    enemies[2].x = 9.5;
    enemies[2].y = 8.5;
    enemies[2].hp = 3;
    enemies[2].alive = true;

    gameOver = false;
    win = false;

    message.style.display = "none";

    updateHUD();
}

// ===============================
// ИГРОВОЙ ЦИКЛ
// ===============================

let lastTime = 0;

function gameLoop(time) {

    const delta = time - lastTime;
    lastTime = time;

    movePlayer();
    updateEnemies();

    renderWorld();
    renderEnemies();

    requestAnimationFrame(gameLoop);
}

updateHUD();
requestAnimationFrame(gameLoop);
