const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

const shootButton = document.getElementById("shootButton");
const interactButton = document.getElementById("interactButton");
const weaponButton = document.getElementById("weaponButton");

const weaponName = document.getElementById("weaponName");
const message = document.getElementById("message");


/* =========================================================
   CANVAS
========================================================= */

function resize() {
    canvas.width = Math.max(1, Math.floor(window.innerWidth));
    canvas.height = Math.max(1, Math.floor(window.innerHeight));
}

window.addEventListener("resize", resize);
resize();


/* =========================================================
   ТЕКСТУРЫ КУЛАКОВ
========================================================= */

const leftFistTexture = new Image();
const rightFistTexture = new Image();

let leftFistLoaded = false;
let rightFistLoaded = false;

leftFistTexture.onload = function () {
    leftFistLoaded = true;
};

rightFistTexture.onload = function () {
    rightFistLoaded = true;
};

leftFistTexture.onerror = function () {
    console.warn("Не найден textures/left_fist.png");
};

rightFistTexture.onerror = function () {
    console.warn("Не найден textures/right_fist.png");
};

leftFistTexture.src = "textures/left_fist.png";
rightFistTexture.src = "textures/right_fist.png";


/* =========================================================
   КАРТА
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
   ИГРОК
========================================================= */

const player = {
    x: 6,
    y: 8,
    angle: 0,
    speed: 2.7,
    radius: 0.18
};


/* =========================================================
   RAYCASTING
========================================================= */

const FOV = Math.PI / 3;
const MAX_DEPTH = 20;
const RAYS = 240;


/* =========================================================
   КЛАВИАТУРА
========================================================= */

const keys = {};

window.addEventListener("keydown", function (e) {

    keys[e.code] = true;

    if (e.code === "Space") {
        e.preventDefault();
        shoot();
    }

    if (e.code === "KeyE") {
        interact();
    }

    if (e.code === "KeyQ") {
        switchWeapon();
    }
});

window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
});


/* =========================================================
   ВРАГИ
========================================================= */

let enemies = [
    {
        x: 6,
        y: 3,
        hp: 100,
        alive: true,
        hit: 0
    }
];


/* =========================================================
   РЫЧАГ
========================================================= */

const lever = {
    x: 9.2,
    y: 2.0
};


/* =========================================================
   ОРУЖИЕ
========================================================= */

let weapon = "fists";

let weaponAnimation = 0;
let muzzleFlash = 0;


/* =========================================================
   АНИМАЦИЯ КУЛАКОВ
========================================================= */

let fistAttackTimer = 0;

const FIST_ATTACK_TIME = 280;


/* =========================================================
   ПЕРЕКЛЮЧЕНИЕ ОРУЖИЯ
========================================================= */

weaponButton.addEventListener("pointerdown", function (e) {

    e.preventDefault();

    switchWeapon();
});


function switchWeapon() {

    if (weapon === "fists") {

        weapon = "pistol";

        weaponName.textContent = "ПИСТОЛЕТ";

    } else if (weapon === "pistol") {

        weapon = "shotgun";

        weaponName.textContent = "ДРОБОВИК";

    } else {

        weapon = "fists";

        weaponName.textContent = "КУЛАКИ";
    }

    fistAttackTimer = 0;
}


/* =========================================================
   СТРЕЛЬБА
========================================================= */

shootButton.addEventListener("pointerdown", function (e) {

    e.preventDefault();

    shoot();
});


function shoot() {

    if (weaponAnimation > 0) {
        return;
    }


    if (weapon === "fists") {

        weaponAnimation = FIST_ATTACK_TIME;
        fistAttackTimer = FIST_ATTACK_TIME;

        punch();

    } else if (weapon === "pistol") {

        weaponAnimation = 220;
        muzzleFlash = 80;

        pistol();

    } else if (weapon === "shotgun") {

        weaponAnimation = 300;

        shotgun();
    }
}


/* =========================================================
   КУЛАК
========================================================= */

function punch() {

    const target = getTargetEnemy(2.0);

    if (!target) {
        showMessage("ПРОМАХ");
        return;
    }

    target.hp -= 20;
    target.hit = 1;

    if (target.hp <= 0) {

        target.hp = 0;
        target.alive = false;

        showMessage("МАНЕКЕН ПОВАЛЕН");

    } else {

        showMessage("УДАР");
    }
}


/* =========================================================
   ПИСТОЛЕТ
========================================================= */

function pistol() {

    const target = getTargetEnemy(12);

    if (!target) {
        showMessage("ПРОМАХ");
        return;
    }

    target.hp -= 25;
    target.hit = 1;

    if (target.hp <= 0) {

        target.hp = 0;
        target.alive = false;

        showMessage("МАНЕКЕН ПОВАЛЕН");

    } else {

        showMessage("ПОПАДАНИЕ");
    }
}


/* =========================================================
   ДРОБОВИК
========================================================= */

function shotgun() {

    const range = 8;

    let hitSomething = false;

    const spread = [
        -0.08,
        -0.04,
        0,
        0.04,
        0.08
    ];


    for (const offset of spread) {

        const target =
            getTargetEnemy(range, offset);

        if (!target) {
            continue;
        }

        target.hp -= 20;
        target.hit = 1;

        hitSomething = true;

        if (target.hp <= 0) {

            target.hp = 0;
            target.alive = false;
        }
    }


    if (hitSomething) {
        showMessage("ПОПАДАНИЕ");
    } else {
        showMessage("ПРОМАХ");
    }
}


/* =========================================================
   ПОИСК ЦЕЛИ
========================================================= */

function getTargetEnemy(maxDistance, angleOffset = 0) {

    let best = null;
    let bestDistance = Infinity;


    for (const enemy of enemies) {

        if (!enemy.alive) {
            continue;
        }


        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;


        const distance =
            Math.sqrt(dx * dx + dy * dy);


        if (distance > maxDistance) {
            continue;
        }


        const angle =
            Math.atan2(dy, dx);


        const difference =
            normalizeAngle(
                angle -
                player.angle -
                angleOffset
            );


        if (Math.abs(difference) < 0.13) {

            if (distance < bestDistance) {

                best = enemy;
                bestDistance = distance;
            }
        }
    }


    return best;
}


/* =========================================================
   ВЗАИМОДЕЙСТВИЕ
========================================================= */

interactButton.addEventListener("pointerdown", function (e) {

    e.preventDefault();

    interact();
});


function interact() {

    const dx = lever.x - player.x;
    const dy = lever.y - player.y;


    const distance =
        Math.sqrt(dx * dx + dy * dy);


    if (distance > 1.5) {

        showMessage(
            "ПОДОЙДИ БЛИЖЕ К РЫЧАГУ"
        );

        return;
    }


    spawnEnemy();
}


/* =========================================================
   СПАВН
========================================================= */

function spawnEnemy() {

    const spawnPoints = [

        { x: 3, y: 3 },
        { x: 8, y: 3 },
        { x: 3, y: 8 },
        { x: 8, y: 8 },
        { x: 6, y: 5 }

    ];


    for (const point of spawnPoints) {

        let occupied = false;


        for (const enemy of enemies) {

            if (!enemy.alive) {
                continue;
            }


            const dx =
                enemy.x - point.x;

            const dy =
                enemy.y - point.y;


            if (
                Math.sqrt(
                    dx * dx +
                    dy * dy
                ) < 0.8
            ) {

                occupied = true;
                break;
            }
        }


        if (!occupied) {

            enemies.push({

                x: point.x,
                y: point.y,

                hp: 100,

                alive: true,

                hit: 0

            });


            showMessage("НОВЫЙ МАНЕКЕН");

            return;
        }
    }


    showMessage("НЕТ СВОБОДНОГО МЕСТА");
}


/* =========================================================
   ДЖОЙСТИК
========================================================= */

let joystickActive = false;

let joyX = 0;
let joyY = 0;


joystick.addEventListener("pointerdown", function (e) {

    e.preventDefault();

    joystickActive = true;

    try {
        joystick.setPointerCapture(e.pointerId);
    } catch (_) {}

    updateJoystick(e);
});


joystick.addEventListener("pointermove", function (e) {

    if (!joystickActive) {
        return;
    }

    updateJoystick(e);
});


joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);


function resetJoystick() {

    joystickActive = false;

    joyX = 0;
    joyY = 0;

    stick.style.left = "50%";
    stick.style.top = "50%";
}


function updateJoystick(e) {

    const rect =
        joystick.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;

    const centerY =
        rect.top +
        rect.height / 2;


    let x =
        e.clientX -
        centerX;

    let y =
        e.clientY -
        centerY;


    const max =
        rect.width / 2 - 28;


    const length =
        Math.sqrt(
            x * x +
            y * y
        );


    if (length > max) {

        x =
            x / length * max;

        y =
            y / length * max;
    }


    joyX = x / max;
    joyY = y / max;


    stick.style.left =
        `calc(50% + ${x}px)`;

    stick.style.top =
        `calc(50% + ${y}px)`;
}


/* =========================================================
   ОБЗОР КАМЕРЫ
========================================================= */

let lookActive = false;
let lastLookX = 0;


canvas.addEventListener("pointerdown", function (e) {

    if (
        e.clientX <
        window.innerWidth * 0.45
    ) {
        return;
    }


    lookActive = true;

    lastLookX = e.clientX;


    try {
        canvas.setPointerCapture(e.pointerId);
    } catch (_) {}
});


canvas.addEventListener("pointermove", function (e) {

    if (!lookActive) {
        return;
    }


    const dx =
        e.clientX -
        lastLookX;


    player.angle += dx * 0.006;

    lastLookX = e.clientX;
});


canvas.addEventListener("pointerup", function () {

    lookActive = false;
});


canvas.addEventListener("pointercancel", function () {

    lookActive = false;
});


/* =========================================================
   СТЕНА
========================================================= */

function isWall(x, y) {

    const mapX = Math.floor(x);
    const mapY = Math.floor(y);


    if (
        mapX < 0 ||
        mapY < 0 ||
        mapX >= MAP_W ||
        mapY >= MAP_H
    ) {
        return true;
    }


    return map[mapY][mapX] === "#";
}


/* =========================================================
   ДВИЖЕНИЕ
========================================================= */

function movePlayer(delta) {

    const forward = -joyY;
    const strafe = joyX;


    let keyboardForward = 0;
    let keyboardStrafe = 0;


    if (
        keys["KeyW"] ||
        keys["ArrowUp"]
    ) {
        keyboardForward += 1;
    }


    if (
        keys["KeyS"] ||
        keys["ArrowDown"]
    ) {
        keyboardForward -= 1;
    }


    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    ) {
        keyboardStrafe += 1;
    }


    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ) {
        keyboardStrafe -= 1;
    }


    const f =
        forward +
        keyboardForward;

    const s =
        strafe +
        keyboardStrafe;


    const length =
        Math.sqrt(
            f * f +
            s * s
        );


    if (length <= 0) {
        return;
    }


    const nf =
        f / Math.max(length, 1);

    const ns =
        s / Math.max(length, 1);


    const moveSpeed =
        player.speed *
        delta /
        1000;


    const dx =
        Math.cos(player.angle) *
        nf *
        moveSpeed -

        Math.sin(player.angle) *
        ns *
        moveSpeed;


    const dy =
        Math.sin(player.angle) *
        nf *
        moveSpeed +

        Math.cos(player.angle) *
        ns *
        moveSpeed;


    if (
        !isWall(
            player.x +
            dx +
            Math.sign(dx) *
            player.radius,

            player.y
        )
    ) {

        player.x += dx;
    }


    if (
        !isWall(
            player.x,

            player.y +
            dy +
            Math.sign(dy) *
            player.radius
        )
    ) {

        player.y += dy;
    }
}


/* =========================================================
   RAY
========================================================= */

function castRay(angle) {

    const sin = Math.sin(angle);
    const cos = Math.cos(angle);


    let distance = 0;

    const step = 0.025;


    while (distance < MAX_DEPTH) {

        distance += step;


        const x =
            player.x +
            cos * distance;

        const y =
            player.y +
            sin * distance;


        if (isWall(x, y)) {
            return distance;
        }
    }


    return MAX_DEPTH;
}


/* =========================================================
   МИР
========================================================= */

function drawWorld() {

    const w = canvas.width;
    const h = canvas.height;


    /* Небо */

    ctx.fillStyle = "#101010";

    ctx.fillRect(
        0,
        0,
        w,
        h / 2
    );


    /* Пол */

    ctx.fillStyle = "#252525";

    ctx.fillRect(
        0,
        h / 2,
        w,
        h / 2
    );


    const rayCount =
        Math.min(
            RAYS,
            Math.max(80, Math.floor(w / 2))
        );


    const columnWidth =
        w / rayCount;


    for (
        let i = 0;
        i < rayCount;
        i++
    ) {

        const cameraX =
            i / rayCount - 0.5;


        const rayAngle =
            player.angle +
            cameraX * FOV;


        let distance =
            castRay(rayAngle);


        distance *=
            Math.cos(
                rayAngle -
                player.angle
            );


        const wallHeight =
            h /
            Math.max(
                distance,
                0.001
            );


        const wallTop =
            h / 2 -
            wallHeight / 2;


        const brightness =
            Math.max(
                25,
                180 -
                distance * 15
            );


        ctx.fillStyle =
            `rgb(${brightness},${brightness},${brightness})`;


        ctx.fillRect(
            i * columnWidth,
            wallTop,
            columnWidth + 1,
            wallHeight
        );
    }
}


/* =========================================================
   СПРАЙТЫ
========================================================= */

function drawSprites() {

    const sprites = [];


    for (const enemy of enemies) {

        if (!enemy.alive) {
            continue;
        }


        sprites.push({

            type: "enemy",

            x: enemy.x,
            y: enemy.y,

            object: enemy
        });
    }


    sprites.push({

        type: "lever",

        x: lever.x,
        y: lever.y,

        object: lever
    });


    sprites.sort(function (a, b) {

        return (
            distanceToPlayer(b) -
            distanceToPlayer(a)
        );
    });


    for (const sprite of sprites) {

        drawSprite(sprite);
    }
}


function distanceToPlayer(sprite) {

    const dx =
        sprite.x -
        player.x;

    const dy =
        sprite.y -
        player.y;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


/* =========================================================
   ОТРИСОВКА СПРАЙТА
========================================================= */

function drawSprite(sprite) {

    const w = canvas.width;
    const h = canvas.height;


    const dx =
        sprite.x -
        player.x;

    const dy =
        sprite.y -
        player.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const angle =
        Math.atan2(
            dy,
            dx
        );


    const relativeAngle =
        normalizeAngle(
            angle -
            player.angle
        );


    if (
        Math.abs(relativeAngle) >
        FOV * 0.65
    ) {
        return;
    }


    const wallDistance =
        castRay(
            player.angle +
            relativeAngle
        );


    if (
        distance >
        wallDistance + 0.1
    ) {
        return;
    }


    const screenX =
        w / 2 +
        Math.tan(relativeAngle) *
        (w / 2) /
        Math.tan(FOV / 2);


    const size =
        h /
        Math.max(
            distance,
            0.1
        );


    if (sprite.type === "enemy") {

        drawEnemySprite(
            screenX,
            h / 2,
            size,
            sprite.object
        );
    }


    if (sprite.type === "lever") {

        drawLeverSprite(
            screenX,
            h / 2,
            size
        );
    }
}


/* =========================================================
   МАНЕКЕН
========================================================= */

function drawEnemySprite(
    x,
    centerY,
    size,
    enemy
) {

    const scale =
        Math.min(
            size * 0.003,
            1.5
        );


    const bodyHeight =
        170 * scale;

    const headSize =
        32 * scale;


    const color =
        enemy.hit > 0
            ? "#ffffff"
            : "#888888";


    ctx.fillStyle = color;


    ctx.fillRect(
        x - 35 * scale,
        centerY,
        70 * scale,
        bodyHeight
    );


    ctx.beginPath();

    ctx.arc(
        x,
        centerY - 35 * scale,
        headSize,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillRect(
        x - 65 * scale,
        centerY + 5 * scale,
        22 * scale,
        80 * scale
    );


    ctx.fillRect(
        x + 43 * scale,
        centerY + 5 * scale,
        22 * scale,
        80 * scale
    );


    ctx.fillRect(
        x - 28 * scale,
        centerY + bodyHeight,
        20 * scale,
        80 * scale
    );


    ctx.fillRect(
        x + 8 * scale,
        centerY + bodyHeight,
        20 * scale,
        80 * scale
    );


    /* HP */

    const barWidth =
        80 * scale;


    ctx.fillStyle = "#111";


    ctx.fillRect(
        x - barWidth / 2,
        centerY - 80 * scale,
        barWidth,
        8
    );


    ctx.fillStyle = "#d00000";


    ctx.fillRect(
        x - barWidth / 2,
        centerY - 80 * scale,
        barWidth *
        Math.max(
            enemy.hp / 100,
            0
        ),
        8
    );
}


/* =========================================================
   РЫЧАГ
========================================================= */

function drawLeverSprite(
    x,
    centerY,
    size
) {

    const scale =
        Math.min(
            size * 0.004,
            1.5
        );


    const y =
        centerY +
        50 * scale;


    ctx.fillStyle = "#333";


    ctx.fillRect(
        x - 18 * scale,
        y,
        36 * scale,
        65 * scale
    );


    ctx.strokeStyle = "#777";

    ctx.lineWidth =
        Math.max(
            5 * scale,
            2
        );


    ctx.beginPath();


    ctx.moveTo(
        x,
        y + 10 * scale
    );


    ctx.lineTo(
        x + 25 * scale,
        y - 30 * scale
    );


    ctx.stroke();


    ctx.fillStyle = "#c33";


    ctx.beginPath();


    ctx.arc(
        x + 25 * scale,
        y - 30 * scale,
        9 * scale,
        0,
        Math.PI * 2
    );


    ctx.fill();
}


/* =========================================================
   ОРУЖИЕ
========================================================= */

function drawWeapon() {

    const w = canvas.width;
    const h = canvas.height;


    let recoil = 0;


    if (weaponAnimation > 0) {

        recoil =
            Math.sin(
                (
                    weaponAnimation /
                    300
                ) *
                Math.PI
            );
    }


    if (weapon === "fists") {

        drawFists(
            w,
            h
        );

    } else if (weapon === "pistol") {

        drawPistol(
            w,
            h,
            recoil
        );

    } else {

        drawShotgun(
            w,
            h,
            recoil
        );
    }
}


/* =========================================================
   КУЛАКИ — PNG
========================================================= */

function drawFists(w, h) {

    /*
        Прогресс удара:

        0   = обычное положение
        0.5 = кулаки максимально впереди
        1   = возврат
    */

    let attackProgress = 0;


    if (fistAttackTimer > 0) {

        attackProgress =
            1 -
            fistAttackTimer /
            FIST_ATTACK_TIME;
    }


    /*
        Плавная анимация.
    */

    let punchAmount = 0;


    if (attackProgress > 0) {

        punchAmount =
            Math.sin(
                attackProgress *
                Math.PI
            );
    }


    /*
        Размер PNG.
    */

    const fistSize =
        Math.min(w, h) * 0.36;


    /*
        Обычные позиции.
    */

    const leftBaseX =
        w * 0.05;

    const rightBaseX =
        w * 0.59;

    const baseY =
        h * 0.68;


    /*
        Во время удара:

        левый кулак идёт немного
        вправо и вверх;

        правый — немного влево
        и вверх.

        Получается ощущение,
        что оба кулака бьют вперёд.
    */

    const leftX =
        leftBaseX +
        punchAmount *
        w * 0.09;

    const rightX =
        rightBaseX -
        punchAmount *
        w * 0.09;


    const leftY =
        baseY -
        punchAmount *
        h * 0.15;

    const rightY =
        baseY -
        punchAmount *
        h * 0.15;


    /*
        Небольшой поворот во время удара.
    */

    const leftRotation =
        -0.08 -
        punchAmount * 0.12;

    const rightRotation =
        0.08 +
        punchAmount * 0.12;


    /*
        ЛЕВЫЙ PNG
    */

    if (leftFistLoaded) {

        drawFistTexture(
            leftFistTexture,
            leftX,
            leftY,
            fistSize,
            fistSize,
            leftRotation
        );

    } else {

        drawFallbackFist(
            leftX +
            fistSize * 0.35,

            leftY +
            fistSize * 0.75,

            fistSize * 0.32,

            leftRotation
        );
    }


    /*
        ПРАВЫЙ PNG
    */

    if (rightFistLoaded) {

        drawFistTexture(
            rightFistTexture,
            rightX,
            rightY,
            fistSize,
            fistSize,
            rightRotation
        );

    } else {

        drawFallbackFist(
            rightX +
            fistSize * 0.35,

            rightY +
            fistSize * 0.75,

            fistSize * 0.32,

            rightRotation
        );
    }
}


/* =========================================================
   ОТРИСОВКА PNG КУЛАКА
========================================================= */

function drawFistTexture(
    image,
    x,
    y,
    width,
    height,
    rotation
) {

    ctx.save();


    /*
        Важно:

        drawImage сохраняет прозрачность
        PNG автоматически.

        Никакого fillStyle поверх
        изображения нет.
    */


    ctx.translate(
        x + width / 2,
        y + height / 2
    );


    ctx.rotate(rotation);


    ctx.globalAlpha = 1;


    ctx.imageSmoothingEnabled = true;


    ctx.drawImage(
        image,

        -width / 2,
        -height / 2,

        width,
        height
    );


    ctx.restore();
}


/* =========================================================
   ЗАПАСНОЙ КУЛАК
========================================================= */

function drawFallbackFist(
    x,
    y,
    size,
    rotation
) {

    ctx.save();


    ctx.translate(x, y);

    ctx.rotate(rotation);


    ctx.fillStyle = "#b97858";


    ctx.fillRect(
        -size * 0.23,
        0,
        size * 0.46,
        size * 0.9
    );


    ctx.fillStyle = "#d59a73";


    ctx.beginPath();


    if (ctx.roundRect) {

        ctx.roundRect(
            -size * 0.48,
            -size * 0.40,
            size * 0.96,
            size * 0.62,
            size * 0.14
        );

    } else {

        ctx.rect(
            -size * 0.48,
            -size * 0.40,
            size * 0.96,
            size * 0.62
        );
    }


    ctx.fill();


    ctx.fillStyle = "#b87858";


    for (let i = 0; i < 4; i++) {

        ctx.fillRect(
            -size * 0.37 +
            i * size * 0.19,

            -size * 0.20,

            size * 0.13,

            size * 0.24
        );
    }


    ctx.restore();
}


/* =========================================================
   ПИСТОЛЕТ
========================================================= */

function drawPistol(
    w,
    h,
    recoil
) {

    const cx = w / 2;


    ctx.save();


    ctx.translate(
        0,
        recoil * 35
    );


    ctx.fillStyle = "#c88c68";


    ctx.fillRect(
        cx - 28,
        h * 0.78,
        56,
        130
    );


    ctx.fillStyle = "#222";


    ctx.beginPath();


    ctx.moveTo(
        cx - 25,
        h * 0.76
    );


    ctx.lineTo(
        cx + 25,
        h * 0.76
    );


    ctx.lineTo(
        cx + 18,
        h * 0.98
    );


    ctx.lineTo(
        cx - 18,
        h * 0.98
    );


    ctx.closePath();

    ctx.fill();


    ctx.fillStyle = "#333";


    ctx.fillRect(
        cx - 45,
        h * 0.68,
        90,
        65
    );


    ctx.fillStyle = "#111";


    ctx.fillRect(
        cx - 42,
        h * 0.64,
        84,
        35
    );


    ctx.fillStyle = "#151515";


    ctx.fillRect(
        cx - 12,
        h * 0.55,
        24,
        100
    );


    ctx.fillStyle = "#777";


    ctx.fillRect(
        cx - 4,
        h * 0.53,
        8,
        15
    );


    if (muzzleFlash > 0) {

        ctx.fillStyle = "#ffd34d";


        ctx.beginPath();


        ctx.moveTo(
            cx,
            h * 0.51
        );


        ctx.lineTo(
            cx - 25,
            h * 0.43
        );


        ctx.lineTo(
            cx,
            h * 0.46
        );


        ctx.lineTo(
            cx + 25,
            h * 0.43
        );


        ctx.closePath();


        ctx.fill();
    }


    ctx.restore();
}


/* =========================================================
   ДРОБОВИК
========================================================= */

function drawShotgun(
    w,
    h,
    recoil
) {

    const cx = w / 2;


    ctx.save();


    ctx.translate(
        0,
        recoil * 45
    );


    ctx.fillStyle = "#181818";


    ctx.fillRect(
        cx - 45,
        h * 0.67,
        90,
        h * 0.34
    );


    ctx.fillStyle = "#292929";


    ctx.fillRect(
        cx - 28,
        h * 0.58,
        56,
        h * 0.38
    );


    ctx.fillStyle = "#080808";


    ctx.beginPath();


    ctx.arc(
        cx,
        h * 0.58,
        28,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.fillStyle = "#000";


    ctx.beginPath();


    ctx.arc(
        cx - 11,
        h * 0.58,
        8,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.beginPath();


    ctx.arc(
        cx + 11,
        h * 0.58,
        8,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.fillStyle = "#75482d";


    ctx.fillRect(
        cx - 70,
        h * 0.82,
        140,
        35
    );


    ctx.fillStyle = "#c88c68";


    ctx.fillRect(
        cx - 100,
        h * 0.80,
        35,
        120
    );


    ctx.fillRect(
        cx + 65,
        h * 0.80,
        35,
        120
    );


    ctx.restore();
}


/* =========================================================
   НОРМАЛИЗАЦИЯ УГЛА
========================================================= */

function normalizeAngle(angle) {

    while (angle > Math.PI) {
        angle -= Math.PI * 2;
    }


    while (angle < -Math.PI) {
        angle += Math.PI * 2;
    }


    return angle;
}


/* =========================================================
   СООБЩЕНИЯ
========================================================= */

let messageTimer = 0;


function showMessage(text) {

    message.textContent = text;

    message.style.opacity = "1";

    messageTimer = 900;
}


/* =========================================================
   UPDATE
========================================================= */

let lastTime = performance.now();


function update(delta) {

    movePlayer(delta);


    if (weaponAnimation > 0) {

        weaponAnimation -= delta;

        if (weaponAnimation < 0) {
            weaponAnimation = 0;
        }
    }


    if (fistAttackTimer > 0) {

        fistAttackTimer -= delta;

        if (fistAttackTimer < 0) {
            fistAttackTimer = 0;
        }
    }


    if (muzzleFlash > 0) {

        muzzleFlash -= delta;

        if (muzzleFlash < 0) {
            muzzleFlash = 0;
        }
    }


    for (const enemy of enemies) {

        if (enemy.hit > 0) {

            enemy.hit -= delta / 100;

            if (enemy.hit < 0) {
                enemy.hit = 0;
            }
        }
    }


    if (messageTimer > 0) {

        messageTimer -= delta;

    } else {

        message.style.opacity = "0";
    }
}


/* =========================================================
   ГЛАВНЫЙ ЦИКЛ
========================================================= */

function loop(time) {

    const delta =
        Math.min(
            Math.max(
                time - lastTime,
                0
            ),
            50
        );


    lastTime = time;


    update(delta);


    /*
        Сначала мир.
    */

    drawWorld();


    /*
        Потом объекты.
    */

    drawSprites();


    /*
        Потом оружие поверх мира.
    */

    drawWeapon();


    requestAnimationFrame(loop);
}


/* =========================================================
   ЗАПУСК
========================================================= */

requestAnimationFrame(loop);
