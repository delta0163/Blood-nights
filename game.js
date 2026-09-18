const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

const hpText = document.getElementById("hp");
const statusText = document.getElementById("status");
const fists = document.getElementById("fists");

let W = 0;
let H = 0;

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

/*
    ПРОСТОЙ 2.5D RAYCASTING

    Стены существуют как 2D карта,
    но отображаются как 3D пространство.
*/

const map = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1]
];

const TILE = 64;

const player = {
    x: 3.5 * TILE,
    y: 5 * TILE,
    angle: 0,
    speed: 2.5,
    hp: 100
};

const dummy = {
    x: 6.5 * TILE,
    y: 4 * TILE,
    hp: 100,
    maxHp: 100,
    hitTime: 0,
    attackTime: 0
};

const FOV = Math.PI / 3;
const NUM_RAYS = 240;

const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false
};

function isWall(x, y) {
    const mx = Math.floor(x / TILE);
    const my = Math.floor(y / TILE);

    if (
        my < 0 ||
        my >= map.length ||
        mx < 0 ||
        mx >= map[0].length
    ) {
        return true;
    }

    return map[my][mx] === 1;
}

function movePlayer(dx, dy) {
    const radius = 14;

    if (
        !isWall(player.x + dx + radius, player.y) &&
        !isWall(player.x + dx - radius, player.y)
    ) {
        player.x += dx;
    }

    if (
        !isWall(player.x, player.y + dy + radius) &&
        !isWall(player.x, player.y + dy - radius)
    ) {
        player.y += dy;
    }
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

/* Проверяем, находится ли манекен примерно перед игроком */

function canHitDummy() {
    const dx = dummy.x - player.x;
    const dy = dummy.y - player.y;

    const dist = Math.hypot(dx, dy);

    if (dist > 120) {
        return false;
    }

    let targetAngle = Math.atan2(dy, dx);
    let difference = targetAngle - player.angle;

    while (difference > Math.PI) difference -= Math.PI * 2;
    while (difference < -Math.PI) difference += Math.PI * 2;

    return Math.abs(difference) < 0.35;
}

function punch() {

    if (dummy.hp <= 0) {
        return;
    }

    fists.classList.remove("punch");

    void fists.offsetWidth;

    fists.classList.add("punch");

    if (canHitDummy()) {

        dummy.hp -= 25;

        if (dummy.hp < 0) {
            dummy.hp = 0;
        }

        dummy.hitTime = 15;

        statusText.textContent =
            "МАНЕКЕН: " + dummy.hp + " HP";
    }
}

/* Рисуем фон */

function drawBackground() {

    // потолок
    ctx.fillStyle = "#171717";
    ctx.fillRect(0, 0, W, H / 2);

    // пол
    ctx.fillStyle = "#353535";
    ctx.fillRect(0, H / 2, W, H / 2);
}

/* Лучи */

function castRay(angle) {

    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    let distanceToWall = 0;

    while (distanceToWall < 1000) {

        distanceToWall += 2;

        const x = player.x + cos * distanceToWall;
        const y = player.y + sin * distanceToWall;

        if (isWall(x, y)) {
            return distanceToWall;
        }
    }

    return 1000;
}

/* Отрисовка 3D комнаты */

function renderWalls() {

    const columnWidth = W / NUM_RAYS;

    for (let i = 0; i < NUM_RAYS; i++) {

        const rayAngle =
            player.angle - FOV / 2 +
            (i / NUM_RAYS) * FOV;

        let dist = castRay(rayAngle);

        // Исправление fish-eye
        dist *= Math.cos(rayAngle - player.angle);

        const wallHeight =
            (TILE * H) / Math.max(dist, 1);

        const top =
            H / 2 - wallHeight / 2;

        const shade =
            Math.max(35, 180 - dist * 0.35);

        ctx.fillStyle =
            `rgb(${shade},${shade},${shade})`;

        ctx.fillRect(
            i * columnWidth,
            top,
            columnWidth + 1,
            wallHeight
        );
    }
}

/*
    Рисуем 2D манекен поверх 3D мира.
    Чем дальше объект — тем меньше спрайт.
*/

function renderDummy() {

    if (dummy.hp <= 0) {
        return;
    }

    const dx = dummy.x - player.x;
    const dy = dummy.y - player.y;

    const dist = Math.hypot(dx, dy);

    let angle = Math.atan2(dy, dx) - player.angle;

    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;

    if (Math.abs(angle) > FOV / 2 + 0.3) {
        return;
    }

    const correctedDist =
        dist * Math.cos(angle);

    if (correctedDist <= 0) {
        return;
    }

    const screenX =
        W / 2 +
        Math.tan(angle) *
        (W / 2) /
        Math.tan(FOV / 2);

    const spriteHeight =
        (TILE * H * 1.8) /
        correctedDist;

    const spriteWidth =
        spriteHeight * 0.55;

    const bottom = H / 2 + spriteHeight / 2;

    let x = screenX - spriteWidth / 2;
    let y = bottom - spriteHeight;

    /* Манекен */

    ctx.save();

    if (dummy.hitTime > 0) {
        ctx.translate(
            Math.random() * 6 - 3,
            Math.random() * 6 - 3
        );
    }

    // тень
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.beginPath();
    ctx.ellipse(
        screenX,
        bottom,
        spriteWidth * .55,
        spriteHeight * .08,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // ноги
    ctx.fillStyle = "#555";

    ctx.fillRect(
        x + spriteWidth * .28,
        y + spriteHeight * .70,
        spriteWidth * .18,
        spriteHeight * .30
    );

    ctx.fillRect(
        x + spriteWidth * .54,
        y + spriteHeight * .70,
        spriteWidth * .18,
        spriteHeight * .30
    );

    // тело
    ctx.fillStyle = "#9b9b9b";

    ctx.fillRect(
        x + spriteWidth * .22,
        y + spriteHeight * .32,
        spriteWidth * .56,
        spriteHeight * .42
    );

    // руки
    ctx.fillStyle = "#777";

    ctx.fillRect(
        x + spriteWidth * .05,
        y + spriteHeight * .35,
        spriteWidth * .18,
        spriteHeight * .40
    );

    ctx.fillRect(
        x + spriteWidth * .77,
        y + spriteHeight * .35,
        spriteWidth * .18,
        spriteHeight * .40
    );

    // голова
    ctx.fillStyle = "#c0c0c0";

    ctx.beginPath();

    ctx.arc(
        screenX,
        y + spriteHeight * .20,
        spriteWidth * .23,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // глаза
    ctx.fillStyle = "#222";

    ctx.fillRect(
        screenX - spriteWidth * .11,
        y + spriteHeight * .17,
        spriteWidth * .06,
        spriteHeight * .035
    );

    ctx.fillRect(
        screenX + spriteWidth * .05,
        y + spriteHeight * .17,
        spriteWidth * .06,
        spriteHeight * .035
    );

    ctx.restore();

    /* HP полоска */

    const barWidth = spriteWidth * 1.2;
    const barHeight = 8;

    ctx.fillStyle = "#222";

    ctx.fillRect(
        screenX - barWidth / 2,
        y - 15,
        barWidth,
        barHeight
    );

    ctx.fillStyle = "#e33";

    ctx.fillRect(
        screenX - barWidth / 2,
        y - 15,
        barWidth * (dummy.hp / dummy.maxHp),
        barHeight
    );
}

/* Обновление */

function update() {

    if (keys.turnLeft) {
        player.angle -= 0.045;
    }

    if (keys.turnRight) {
        player.angle += 0.045;
    }

    let dx = 0;
    let dy = 0;

    const cos = Math.cos(player.angle);
    const sin = Math.sin(player.angle);

    if (keys.forward) {
        dx += cos * player.speed;
        dy += sin * player.speed;
    }

    if (keys.backward) {
        dx -= cos * player.speed;
        dy -= sin * player.speed;
    }

    if (keys.left) {
        dx += sin * player.speed;
        dy -= cos * player.speed;
    }

    if (keys.right) {
        dx -= sin * player.speed;
        dy += cos * player.speed;
    }

    movePlayer(dx, dy);

    if (dummy.hitTime > 0) {
        dummy.hitTime--;
    }

    /*
        Манекен немного приближается,
        если игрок далеко.
    */

    const d = distance(
        player.x,
        player.y,
        dummy.x,
        dummy.y
    );

    if (dummy.hp > 0 && d > 80 && d < 400) {

        const angle =
            Math.atan2(
                player.y - dummy.y,
                player.x - dummy.x
            );

        const speed = 0.25;

        const nx =
            dummy.x + Math.cos(angle) * speed;

        const ny =
            dummy.y + Math.sin(angle) * speed;

        if (!isWall(nx, ny)) {
            dummy.x = nx;
            dummy.y = ny;
        }
    }

    /*
        Если манекен подошёл близко —
        он наносит небольшой урон.
    */

    if (dummy.hp > 0 && d < 55) {

        dummy.attackTime++;

        if (dummy.attackTime > 60) {

            player.hp -= 5;

            if (player.hp < 0) {
                player.hp = 0;
            }

            hpText.textContent = player.hp;

            dummy.attackTime = 0;

            if (player.hp <= 0) {
                statusText.textContent = "ТЫ ПРОИГРАЛ";
            }
        }

    } else {
        dummy.attackTime = 0;
    }
}

/* Главный цикл */

function loop() {

    update();

    drawBackground();

    renderWalls();

    renderDummy();

    requestAnimationFrame(loop);
}

loop();

/* =========================
   МОБИЛЬНОЕ УПРАВЛЕНИЕ
========================= */

function holdButton(id, property) {

    const button = document.getElementById(id);

    const start = (e) => {
        e.preventDefault();
        keys[property] = true;
    };

    const stop = (e) => {
        e.preventDefault();
        keys[property] = false;
    };

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
}

holdButton("up", "forward");
holdButton("down", "backward");
holdButton("left", "left");
holdButton("right", "right");

holdButton("turnLeft", "turnLeft");
holdButton("turnRight", "turnRight");

document.getElementById("attack")
    .addEventListener("pointerdown", (e) => {
        e.preventDefault();
        punch();
    });

/* =========================
   КЛАВИАТУРА ДЛЯ ПК
========================= */

window.addEventListener("keydown", (e) => {

    if (e.code === "KeyW") keys.forward = true;
    if (e.code === "KeyS") keys.backward = true;
    if (e.code === "KeyA") keys.left = true;
    if (e.code === "KeyD") keys.right = true;

    if (e.code === "ArrowLeft") keys.turnLeft = true;
    if (e.code === "ArrowRight") keys.turnRight = true;

    if (e.code === "Space") punch();
});

window.addEventListener("keyup", (e) => {

    if (e.code === "KeyW") keys.forward = false;
    if (e.code === "KeyS") keys.backward = false;
    if (e.code === "KeyA") keys.left = false;
    if (e.code === "KeyD") keys.right = false;

    if (e.code === "ArrowLeft") keys.turnLeft = false;
    if (e.code === "ArrowRight") keys.turnRight = false;
});
