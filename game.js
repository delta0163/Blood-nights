"use strict";

/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

/* =========================================================
   UI
========================================================= */

const weaponName = document.getElementById("weaponName");

const healthFill = document.getElementById("healthFill");
const staminaFill = document.getElementById("staminaFill");

const healthText = document.getElementById("healthText");
const staminaText = document.getElementById("staminaText");

const styleBox = document.getElementById("styleBox");
const styleRankElement = document.getElementById("styleRank");
const styleMultiplierElement = document.getElementById("styleMultiplier");
const stylePointsElement = document.getElementById("stylePoints");

const upgradeMenu = document.getElementById("upgradeMenu");

/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: 4,
    y: 4,

    z: 0,

    yaw: 0,

    pitch: 0,

    velocityX: 0,
    velocityY: 0,

    verticalVelocity: 0,

    grounded: true,

    standingHeight: 0,

    jumpPower: 5.7,

    gravity: 15,

    maxSpeed: 4.8,

    acceleration: 15,

    friction: 8,

    hp: 100,
    maxHp: 100,

    stamina: 100,
    maxStamina: 100,

    dashCost: 30,

    dashPower: 9,

    dashCooldown: 0,

    jumpCount: 0,
    maxJumps: 1,

    invulnerable: 0
};

/* =========================================================
   UPGRADES
========================================================= */

const upgrades = {
    doubleJump: false,
    dash: false,
    stamina: false,
    health: false
};

document.querySelectorAll(".upgrade").forEach(button => {

    button.addEventListener("click", () => {

        const upgrade = button.dataset.upgrade;

        if (upgrade === "doubleJump") {

            upgrades.doubleJump = true;

            player.maxJumps = 2;
        }

        if (upgrade === "dash") {
            upgrades.dash = true;
        }

        if (upgrade === "stamina") {

            upgrades.stamina = true;

            player.maxStamina = 150;
            player.stamina = 150;
        }

        if (upgrade === "health") {

            upgrades.health = true;

            player.maxHp = 150;
            player.hp = 150;
        }

        upgradeMenu.style.display = "none";

        updateUI();
    });
});

/* =========================================================
   WORLD
========================================================= */

const map = [

    "############",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "############"
];

const MAP_W = map[0].length;
const MAP_H = map.length;

/* =========================================================
   PLATFORM
========================================================= */

const platform = {

    x: 7.2,
    y: 5.4,

    width: 2.4,
    depth: 2.0,

    z: 1.35,

    thickness: .35
};

function isOverPlatform(x, y) {

    return (
        x > platform.x - platform.width / 2 &&
        x < platform.x + platform.width / 2 &&
        y > platform.y - platform.depth / 2 &&
        y < platform.y + platform.depth / 2
    );
}

/* =========================================================
   ENEMIES
========================================================= */

let enemies = [

    {
        x: 8.5,
        y: 3.2,
        hp: 100,
        maxHp: 100,
        alive: true
    },

    {
        x: 5.5,
        y: 7.8,
        hp: 100,
        maxHp: 100,
        alive: true
    }
];

/* =========================================================
   WEAPONS
========================================================= */

const weapons = [

    {
        name: "КУЛАКИ",
        damage: 10,
        range: 2.1,
        cooldown: .38,
        type: "melee"
    },

    {
        name: "ПИСТОЛЕТ",
        damage: 20,
        range: 12,
        cooldown: .35,
        type: "gun"
    },

    {
        name: "ДРОБОВИК",
        damage: 45,
        range: 8,
        cooldown: .75,
        type: "shotgun"
    },

    {
        name: "ТОПОР",
        damage: 35,
        range: 2.6,
        cooldown: .65,
        type: "axe"
    }
];

let weaponIndex = 0;

let currentWeapon = weapons[weaponIndex];

let attackCooldown = 0;

let weaponAnimation = 0;

function switchWeapon() {

    weaponIndex++;

    if (weaponIndex >= weapons.length) {
        weaponIndex = 0;
    }

    currentWeapon = weapons[weaponIndex];

    weaponName.textContent = currentWeapon.name;
}

/* =========================================================
   STYLE SYSTEM
========================================================= */

let styleScore = 0;
let styleMultiplier = 1;

let styleTimer = 0;

function addStyle(points) {

    styleScore += Math.floor(points * styleMultiplier);

    styleMultiplier = Math.min(
        5,
        styleMultiplier + .25
    );

    styleTimer = 10;

    styleBox.style.display = "block";

    updateStyleUI();
}

function updateStyleUI() {

    let rank = "D";

    if (styleScore >= 1000) rank = "C";
    if (styleScore >= 2500) rank = "B";
    if (styleScore >= 5000) rank = "A";
    if (styleScore >= 10000) rank = "S";

    styleRankElement.textContent = rank;

    styleMultiplierElement.textContent =
        "×" + styleMultiplier.toFixed(1);

    stylePointsElement.textContent =
        styleScore;
}

/* =========================================================
   MOVEMENT JOYSTICK
========================================================= */

const moveJoystick = document.getElementById("moveJoystick");
const moveStick = document.getElementById("moveStick");

let movePointer = null;

let moveX = 0;
let moveY = 0;

function updateMoveJoystick(clientX, clientY) {

    const rect = moveJoystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const radius = rect.width * .38;

    const distance = Math.hypot(dx, dy);

    if (distance > radius) {

        dx /= distance;
        dy /= distance;

        dx *= radius;
        dy *= radius;
    }

    moveX = dx / radius;
    moveY = dy / radius;

    moveStick.style.transform =
        `translate(${dx}px, ${dy}px)`;
}

function resetMoveJoystick() {

    moveX = 0;
    moveY = 0;

    moveStick.style.transform =
        "translate(0px, 0px)";
}

moveJoystick.addEventListener("pointerdown", e => {

    movePointer = e.pointerId;

    moveJoystick.setPointerCapture(e.pointerId);

    updateMoveJoystick(
        e.clientX,
        e.clientY
    );
});

moveJoystick.addEventListener("pointermove", e => {

    if (e.pointerId !== movePointer) return;

    updateMoveJoystick(
        e.clientX,
        e.clientY
    );
});

moveJoystick.addEventListener("pointerup", e => {

    if (e.pointerId === movePointer) {

        movePointer = null;

        resetMoveJoystick();
    }
});

moveJoystick.addEventListener("pointercancel", () => {

    movePointer = null;

    resetMoveJoystick();
});

/* =========================================================
   CAMERA JOYSTICK
========================================================= */

const lookJoystick = document.getElementById("lookJoystick");
const lookStick = document.getElementById("lookStick");

let lookPointer = null;

let lookX = 0;
let lookY = 0;

const LOOK_DEADZONE = .12;

const LOOK_SPEED_X = 1.55;
const LOOK_SPEED_Y = .9;

function updateLookJoystick(clientX, clientY) {

    const rect = lookJoystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const radius = rect.width * .38;

    const distance = Math.hypot(dx, dy);

    if (distance > radius) {

        dx /= distance;
        dy /= distance;

        dx *= radius;
        dy *= radius;
    }

    let nx = dx / radius;
    let ny = dy / radius;

    if (Math.abs(nx) < LOOK_DEADZONE) nx = 0;
    if (Math.abs(ny) < LOOK_DEADZONE) ny = 0;

    lookX =
        Math.sign(nx) *
        Math.pow(Math.abs(nx), 1.25);

    lookY =
        Math.sign(ny) *
        Math.pow(Math.abs(ny), 1.25);

    lookStick.style.transform =
        `translate(${dx}px, ${dy}px)`;
}

function resetLookJoystick() {

    lookX = 0;
    lookY = 0;

    lookStick.style.transform =
        "translate(0px, 0px)";
}

lookJoystick.addEventListener("pointerdown", e => {

    lookPointer = e.pointerId;

    lookJoystick.setPointerCapture(e.pointerId);

    updateLookJoystick(
        e.clientX,
        e.clientY
    );
});

lookJoystick.addEventListener("pointermove", e => {

    if (e.pointerId !== lookPointer) return;

    updateLookJoystick(
        e.clientX,
        e.clientY
    );
});

lookJoystick.addEventListener("pointerup", e => {

    if (e.pointerId === lookPointer) {

        lookPointer = null;

        resetLookJoystick();
    }
});

lookJoystick.addEventListener("pointercancel", () => {

    lookPointer = null;

    resetLookJoystick();
});

/* =========================================================
   KEYBOARD
========================================================= */

const keys = {};

window.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    if (e.key === " ") {
        jump();
    }

    if (e.key.toLowerCase() === "e") {
        interact();
    }

    if (e.key.toLowerCase() === "f") {
        attack();
    }

    if (e.key.toLowerCase() === "q") {
        switchWeapon();
    }

    if (e.key === "Shift") {
        dash();
    }
});

window.addEventListener("keyup", e => {

    keys[e.key.toLowerCase()] = false;
});

/* =========================================================
   COLLISION
========================================================= */

function isWall(x, y) {

    const r = .22;

    const checks = [

        [x - r, y - r],
        [x + r, y - r],
        [x - r, y + r],
        [x + r, y + r]
    ];

    for (const [cx, cy] of checks) {

        const mx = Math.floor(cx);
        const my = Math.floor(cy);

        if (
            my < 0 ||
            my >= MAP_H ||
            mx < 0 ||
            mx >= MAP_W
        ) {
            return true;
        }

        if (map[my][mx] === "#") {
            return true;
        }
    }

    return false;
}

function movePlayer(dx, dy) {

    const nx = player.x + dx;

    if (!isWall(nx, player.y)) {
        player.x = nx;
    }

    const ny = player.y + dy;

    if (!isWall(player.x, ny)) {
        player.y = ny;
    }
}

/* =========================================================
   JUMP
========================================================= */

function jump() {

    if (upgradeMenu.style.display !== "none") return;

    if (player.grounded) {

        player.verticalVelocity =
            player.jumpPower;

        player.grounded = false;

        player.jumpCount = 1;

        return;
    }

    if (
        upgrades.doubleJump &&
        player.jumpCount < player.maxJumps
    ) {

        player.verticalVelocity =
            player.jumpPower * .92;

        player.jumpCount++;

        addStyle(50);
    }
}

/* =========================================================
   DASH
========================================================= */

function dash() {

    if (!upgrades.dash) return;

    if (player.dashCooldown > 0) return;

    if (player.stamina < player.dashCost) return;

    player.stamina -= player.dashCost;

    player.dashCooldown = .65;

    const forwardX = Math.cos(player.yaw);
    const forwardY = Math.sin(player.yaw);

    movePlayer(
        forwardX * .55,
        forwardY * .55
    );

    addStyle(75);
}

/* =========================================================
   GRAVITY / PLATFORM
========================================================= */

function updateJump(dt) {

    const previousZ = player.z;

    player.verticalVelocity -=
        player.gravity * dt;

    player.z +=
        player.verticalVelocity * dt;

    let targetHeight = 0;

    /*
       Платформа учитывается только если игрок
       действительно падал сверху.
    */

    if (
        isOverPlatform(player.x, player.y) &&
        previousZ >= platform.z &&
        player.z <= platform.z &&
        player.verticalVelocity <= 0
    ) {

        targetHeight = platform.z;
    }

    if (player.z <= targetHeight) {

        player.z = targetHeight;

        player.verticalVelocity = 0;

        if (!player.grounded) {

            addStyle(25);
        }

        player.grounded = true;

        player.jumpCount = 0;
    }
    else {

        player.grounded = false;
    }
}

/* =========================================================
   ATTACK
========================================================= */

function attack() {

    if (upgradeMenu.style.display !== "none") return;

    if (attackCooldown > 0) return;

    attackCooldown =
        currentWeapon.cooldown;

    weaponAnimation = 1;

    let hitSomething = false;

    const forwardX =
        Math.cos(player.yaw);

    const forwardY =
        Math.sin(player.yaw);

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const dx =
            enemy.x - player.x;

        const dy =
            enemy.y - player.y;

        const distance =
            Math.hypot(dx, dy);

        if (distance > currentWeapon.range) {
            continue;
        }

        const direction =
            Math.atan2(dy, dx);

        let angleDifference =
            direction - player.yaw;

        while (angleDifference > Math.PI)
            angleDifference -= Math.PI * 2;

        while (angleDifference < -Math.PI)
            angleDifference += Math.PI * 2;

        let hitAngle = .22;

        if (currentWeapon.type === "shotgun") {
            hitAngle = .42;
        }

        if (
            Math.abs(angleDifference) <= hitAngle
        ) {

            enemy.hp -=
                currentWeapon.damage;

            hitSomething = true;

            addStyle(
                currentWeapon.type === "axe"
                    ? 120
                    : 70
            );

            if (enemy.hp <= 0) {

                enemy.hp = 0;

                enemy.alive = false;

                addStyle(250);
            }

            break;
        }
    }

    if (!hitSomething) {

        if (
            currentWeapon.type === "axe" ||
            currentWeapon.type === "melee"
        ) {

            weaponAnimation = 1;
        }
    }
}

/* =========================================================
   INTERACT
========================================================= */

function interact() {

    const leverDistance =
        Math.hypot(
            player.x - 6,
            player.y - 1.3
        );

    if (leverDistance < 1.5) {

        enemies.push({

            x: 8.2 + Math.random() * 1.5,

            y: 7 + Math.random() * 1.5,

            hp: 100,

            maxHp: 100,

            alive: true
        });

        addStyle(100);
    }
}

/* =========================================================
   TAKE DAMAGE
========================================================= */

function damagePlayer(amount) {

    if (player.invulnerable > 0) return;

    player.hp -= amount;

    player.invulnerable = .4;

    if (player.hp <= 0) {

        player.hp = 0;

        setTimeout(resetPlayer, 500);
    }

    updateUI();
}

function resetPlayer() {

    player.x = 4;
    player.y = 4;

    player.z = 0;

    player.verticalVelocity = 0;

    player.grounded = true;

    player.hp = player.maxHp;

    player.stamina = player.maxStamina;
}

/* =========================================================
   ENEMY TEST DAMAGE
========================================================= */

let enemyAttackTimer = 0;

function updateEnemies(dt) {

    enemyAttackTimer -= dt;

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const distance =
            Math.hypot(dx, dy);

        if (
            distance < 1.4 &&
            enemyAttackTimer <= 0
        ) {

            damagePlayer(8);

            enemyAttackTimer = 1;
        }
    }
}

/* =========================================================
   RAYCASTING
========================================================= */

const FOV = Math.PI / 3;

function castRay(angle) {

    const rayX = Math.cos(angle);
    const rayY = Math.sin(angle);

    let distance = 0;

    const step = .025;

    while (distance < 20) {

        distance += step;

        const x =
            player.x + rayX * distance;

        const y =
            player.y + rayY * distance;

        const mx = Math.floor(x);
        const my = Math.floor(y);

        if (
            mx < 0 ||
            mx >= MAP_W ||
            my < 0 ||
            my >= MAP_H
        ) {
            return distance;
        }

        if (map[my][mx] === "#") {
            return distance;
        }
    }

    return 20;
}

/* =========================================================
   WORLD DRAWING
========================================================= */

function drawWorld() {

    const horizon =
        H / 2 +
        player.pitch * H * .45 -
        player.z * 18;

    /*
       Небо
    */

    ctx.fillStyle = "#101010";

    ctx.fillRect(
        0,
        0,
        W,
        horizon
    );

    /*
       Пол
    */

    ctx.fillStyle = "#202020";

    ctx.fillRect(
        0,
        horizon,
        W,
        H - horizon
    );

    /*
       Полосы пола
    */

    ctx.strokeStyle =
        "rgba(255,255,255,.06)";

    ctx.lineWidth = 1;

    for (
        let y = horizon + 15;
        y < H;
        y += 35
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(W, y);

        ctx.stroke();
    }

    /*
       Стены
    */

    for (let x = 0; x < W; x += 2) {

        const cameraX =
            x / W - .5;

        const rayAngle =
            player.yaw +
            cameraX * FOV;

        const distance =
            castRay(rayAngle);

        const correctedDistance =
            distance *
            Math.cos(
                rayAngle - player.yaw
            );

        const wallHeight =
            H * .95 /
            Math.max(.1, correctedDistance);

        const top =
            horizon -
            wallHeight / 2;

        const bottom =
            horizon +
            wallHeight / 2;

        const shade =
            Math.max(
                25,
                170 - correctedDistance * 12
            );

        ctx.fillStyle =
            `rgb(${shade},${shade},${shade})`;

        ctx.fillRect(
            x,
            top,
            3,
            bottom - top
        );
    }

    drawPlatform();
    drawLever();
    drawEnemies();
}

/* =========================================================
   PLATFORM DRAWING
========================================================= */

function drawPlatform() {

    const dx =
        platform.x - player.x;

    const dy =
        platform.y - player.y;

    const distance =
        Math.hypot(dx, dy);

    if (distance > 15) return;

    const angle =
        Math.atan2(dy, dx) -
        player.yaw;

    let a = angle;

    while (a > Math.PI)
        a -= Math.PI * 2;

    while (a < -Math.PI)
        a += Math.PI * 2;

    if (
        Math.abs(a) > FOV * .8
    ) return;

    const screenX =
        W / 2 +
        (a / FOV) * W;

    const scale =
        H / Math.max(.1, distance);

    const width =
        platform.width * scale;

    const depth =
        platform.depth * scale;

    const height =
        platform.thickness * scale;

    const horizon =
        H / 2 +
        player.pitch * H * .45 -
        player.z * 18;

    const top =
        horizon -
        platform.z * scale * .28;

    ctx.fillStyle = "#777";

    ctx.fillRect(
        screenX - width / 2,
        top,
        width,
        height
    );

    ctx.strokeStyle = "#aaa";

    ctx.strokeRect(
        screenX - width / 2,
        top,
        width,
        height
    );

    /*
       Подсветка платформы
    */

    ctx.fillStyle =
        "rgba(255,255,255,.12)";

    ctx.fillRect(
        screenX - width / 2,
        top,
        width,
        Math.max(2, depth * .08)
    );
}

/* =========================================================
   LEVER
========================================================= */

function drawLever() {

    const dx = 6 - player.x;
    const dy = 1.3 - player.y;

    const distance =
        Math.hypot(dx, dy);

    if (distance > 10) return;

    let angle =
        Math.atan2(dy, dx) -
        player.yaw;

    while (angle > Math.PI)
        angle -= Math.PI * 2;

    while (angle < -Math.PI)
        angle += Math.PI * 2;

    if (Math.abs(angle) > FOV) return;

    const screenX =
        W / 2 +
        angle / FOV * W;

    const size =
        H / Math.max(.1, distance);

    const horizon =
        H / 2 +
        player.pitch * H * .45;

    ctx.fillStyle = "#555";

    ctx.fillRect(
        screenX - size * .08,
        horizon - size * .35,
        size * .16,
        size * .35
    );

    ctx.fillStyle = "#aaa";

    ctx.fillRect(
        screenX - size * .12,
        horizon - size * .42,
        size * .24,
        size * .08
    );
}

/* =========================================================
   ENEMIES / MANNEQUINS
========================================================= */

function drawEnemies() {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const dx =
            enemy.x - player.x;

        const dy =
            enemy.y - player.y;

        const distance =
            Math.hypot(dx, dy);

        if (distance < .2 || distance > 15)
            continue;

        let angle =
            Math.atan2(dy, dx) -
            player.yaw;

        while (angle > Math.PI)
            angle -= Math.PI * 2;

        while (angle < -Math.PI)
            angle += Math.PI * 2;

        if (Math.abs(angle) > FOV * .9)
            continue;

        const screenX =
            W / 2 +
            angle / FOV * W;

        const size =
            H / distance;

        const horizon =
            H / 2 +
            player.pitch * H * .45 -
            player.z * 18;

        const enemyHeight =
            size * .9;

        const bottom =
            horizon + size * .35;

        /*
           Манекен
        */

        ctx.fillStyle = "#aaa";

        ctx.fillRect(
            screenX - size * .16,
            bottom - enemyHeight * .55,
            size * .32,
            enemyHeight * .55
        );

        ctx.beginPath();

        ctx.arc(
            screenX,
            bottom - enemyHeight * .68,
            size * .18,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /*
           HP полоска манекена
        */

        const barWidth =
            size * .5;

        const hpPercent =
            enemy.hp / enemy.maxHp;

        ctx.fillStyle = "#111";

        ctx.fillRect(
            screenX - barWidth / 2,
            bottom - enemyHeight * .95,
            barWidth,
            5
        );

        ctx.fillStyle = "#ddd";

        ctx.fillRect(
            screenX - barWidth / 2,
            bottom - enemyHeight * .95,
            barWidth * hpPercent,
            5
        );
    }
}

/* =========================================================
   WEAPON DRAWING
========================================================= */

function drawWeapon() {

    const bob =
        Math.sin(performance.now() * .006) *
        4;

    const jumpOffset =
        player.z * 15;

    const punch =
        weaponAnimation * 45;

    const baseX =
        W / 2;

    const baseY =
        H - 45 +
        jumpOffset;

    /*
       Анимация постепенно возвращается
    */

    weaponAnimation *= .82;

    if (currentWeapon.type === "melee") {

        drawFists(
            baseX,
            baseY + bob,
            punch
        );
    }

    else if (currentWeapon.type === "axe") {

        drawAxe(
            baseX,
            baseY + bob,
            punch
        );
    }

    else if (currentWeapon.type === "gun") {

        drawPistol(
            baseX,
            baseY + bob
        );
    }

    else if (currentWeapon.type === "shotgun") {

        drawShotgun(
            baseX,
            baseY + bob
        );
    }
}

/* =========================================================
   FISTS
========================================================= */

function drawFists(x, y, punch) {

    ctx.save();

    /*
       Левая рука
    */

    ctx.fillStyle = "#c7c7c7";

    ctx.beginPath();

    ctx.arc(
        x - 85 + punch * .2,
        y - 25 - punch * .3,
        30,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
       Правая рука
    */

    ctx.beginPath();

    ctx.arc(
        x + 85 - punch * .2,
        y - 25 - punch * .3,
        30,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

/* =========================================================
   AXE
========================================================= */

function drawAxe(x, y, punch) {

    ctx.save();

    const swing =
        punch * .75;

    ctx.translate(
        x + 30,
        y - 30
    );

    ctx.rotate(
        -0.45 + swing * .012
    );

    /*
       Рукоять
    */

    ctx.fillStyle = "#765333";

    ctx.fillRect(
        -9,
        -5,
        18,
        125
    );

    /*
       Лезвие
    */

    ctx.fillStyle = "#bbb";

    ctx.beginPath();

    ctx.moveTo(-15, -18);
    ctx.lineTo(65, -5);
    ctx.lineTo(58, 25);
    ctx.lineTo(-15, 12);

    ctx.closePath();

    ctx.fill();

    ctx.strokeStyle = "#eee";

    ctx.stroke();

    ctx.restore();
}

/* =========================================================
   PISTOL
========================================================= */

function drawPistol(x, y) {

    ctx.save();

    ctx.fillStyle = "#444";

    ctx.fillRect(
        x - 17,
        y - 90,
        34,
        95
    );

    ctx.fillStyle = "#777";

    ctx.fillRect(
        x - 13,
        y - 112,
        26,
        30
    );

    ctx.restore();
}

/* =========================================================
   SHOTGUN
========================================================= */

function drawShotgun(x, y) {

    ctx.save();

    ctx.fillStyle = "#444";

    ctx.fillRect(
        x - 24,
        y - 115,
        48,
        115
    );

    ctx.fillStyle = "#888";

    ctx.fillRect(
        x - 17,
        y - 145,
        34,
        45
    );

    ctx.restore();
}

/* =========================================================
   INPUT BUTTONS
========================================================= */

document
    .getElementById("jumpButton")
    .addEventListener("pointerdown", jump);

document
    .getElementById("dashButton")
    .addEventListener("pointerdown", dash);

document
    .getElementById("shootButton")
    .addEventListener("pointerdown", attack);

document
    .getElementById("interactButton")
    .addEventListener("pointerdown", interact);

document
    .getElementById("weaponButton")
    .addEventListener("pointerdown", switchWeapon);

/* =========================================================
   UPDATE
========================================================= */

function update(dt) {

    if (
        upgradeMenu.style.display !== "none"
    ) {
        return;
    }

    /*
       Таймеры
    */

    attackCooldown =
        Math.max(
            0,
            attackCooldown - dt
        );

    player.dashCooldown =
        Math.max(
            0,
            player.dashCooldown - dt
        );

    player.invulnerable =
        Math.max(
            0,
            player.invulnerable - dt
        );

    /*
       Камера
    */

    player.yaw +=
        lookX * LOOK_SPEED_X * dt;

    player.pitch -=
        lookY * LOOK_SPEED_Y * dt;

    const MAX_PITCH = .9;

    player.pitch =
        Math.max(
            -MAX_PITCH,
            Math.min(
                MAX_PITCH,
                player.pitch
            )
        );

    /*
       Движение
    */

    let inputX = moveX;
    let inputY = -moveY;

    /*
       Клавиатура
    */

    if (keys["w"]) inputY += 1;
    if (keys["s"]) inputY -= 1;
    if (keys["a"]) inputX -= 1;
    if (keys["d"]) inputX += 1;

    const inputLength =
        Math.hypot(
            inputX,
            inputY
        );

    if (inputLength > 1) {

        inputX /= inputLength;
        inputY /= inputLength;
    }

    /*
       Направление относительно камеры
    */

    const forwardX =
        Math.cos(player.yaw);

    const forwardY =
        Math.sin(player.yaw);

    const rightX =
        Math.cos(
            player.yaw + Math.PI / 2
        );

    const rightY =
        Math.sin(
            player.yaw + Math.PI / 2
        );

    const targetX =
        (
            forwardX * inputY +
            rightX * inputX
        ) * player.maxSpeed;

    const targetY =
        (
            forwardY * inputY +
            rightY * inputX
        ) * player.maxSpeed;

    /*
       Плавное ускорение
    */

    player.velocityX +=
        (targetX - player.velocityX) *
        Math.min(1, player.acceleration * dt);

    player.velocityY +=
        (targetY - player.velocityY) *
        Math.min(1, player.acceleration * dt);

    /*
       Если джойстик отпущен —
       плавно тормозим
    */

    if (
        Math.abs(inputX) < .01 &&
        Math.abs(inputY) < .01
    ) {

        const friction =
            Math.max(
                0,
                1 - player.friction * dt
            );

        player.velocityX *= friction;
        player.velocityY *= friction;
    }

    movePlayer(
        player.velocityX * dt,
        player.velocityY * dt
    );

    /*
       Прыжок
    */

    updateJump(dt);

    /*
       Стамина восстанавливается
    */

    player.stamina =
        Math.min(
            player.maxStamina,
            player.stamina + 22 * dt
        );

    /*
       Style
    */

    if (styleTimer > 0) {

        styleTimer -= dt;

        if (styleTimer <= 0) {

            styleBox.style.display =
                "none";

            styleMultiplier = 1;
        }
    }

    /*
       Враги
    */

    updateEnemies(dt);

    /*
       Смена оружия клавишей Q
    */

    if (keys["q"]) {

        keys["q"] = false;

        switchWeapon();
    }

    /*
       Прыжок клавишей пробел
    */

    if (keys[" "]) {

        keys[" "] = false;

        jump();
    }
}

/* =========================================================
   UI UPDATE
========================================================= */

function updateUI() {

    const hpPercent =
        Math.max(
            0,
            Math.min(
                1,
                player.hp / player.maxHp
            )
        );

    const staminaPercent =
        Math.max(
            0,
            Math.min(
                1,
                player.stamina / player.maxStamina
            )
        );

    /*
       270 градусов —
       полукруглая шкала.
    */

    healthFill.style.background =
        `conic-gradient(
            #e7e7e7 ${hpPercent * 270}deg,
            transparent ${hpPercent * 270}deg
        )`;

    staminaFill.style.background =
        `conic-gradient(
            #aaa ${staminaPercent * 270}deg,
            transparent ${staminaPercent * 270}deg
        )`;

    healthText.textContent =
        Math.ceil(player.hp);

    staminaText.textContent =
        Math.ceil(player.stamina);
}

/* =========================================================
   GAME LOOP
========================================================= */

let lastTime =
    performance.now();

function gameLoop(time) {

    const dt =
        Math.min(
            .033,
            (time - lastTime) / 1000
        );

    lastTime = time;

    update(dt);

    drawWorld();

    drawWeapon();

    updateUI();

    requestAnimationFrame(gameLoop);
}

weaponName.textContent =
    currentWeapon.name;

updateUI();

requestAnimationFrame(gameLoop);
