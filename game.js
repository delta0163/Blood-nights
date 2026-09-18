const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

const shootButton = document.getElementById("shootButton");
const interactButton = document.getElementById("interactButton");
const weaponButton = document.getElementById("weaponButton");

const weaponName = document.getElementById("weaponName");
const message = document.getElementById("message");


// ======================================================
// CANVAS
// ======================================================

function resize() {

    canvas.width = Math.floor(window.innerWidth);
    canvas.height = Math.floor(window.innerHeight);

}

window.addEventListener("resize", resize);
resize();


// ======================================================
// КАРТА
// ======================================================
//
// # = стена
// . = свободное место
// L = рычаг
//
// Игрок начинает в центре комнаты.
//

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


// ======================================================
// ИГРОК
// ======================================================

const player = {

    x: 6,
    y: 8,

    angle: 0,

    speed: 2.7,

    radius: 0.18

};


// ======================================================
// НАСТРОЙКИ RAYCASTING
// ======================================================

const FOV = Math.PI / 3;

const MAX_DEPTH = 20;

const RAYS = 240;


// ======================================================
// МАНЕКЕНЫ
// ======================================================

let enemies = [

    {
        x: 6,
        y: 3,

        hp: 100,

        alive: true,

        hit: 0
    }

];


// ======================================================
// РЫЧАГ
// ======================================================

const lever = {

    x: 9.2,
    y: 2.0,

    used: false

};


// ======================================================
// ОРУЖИЕ
// ======================================================

let weapon = "fists";

let shooting = false;

let weaponAnimation = 0;


// ======================================================
// ПЕРЕКЛЮЧЕНИЕ ОРУЖИЯ
// ======================================================

weaponButton.addEventListener("pointerdown", function(e) {

    e.preventDefault();

    if (weapon === "fists") {

        weapon = "shotgun";

        weaponName.textContent = "ДРОБОВИК";

    }

    else {

        weapon = "fists";

        weaponName.textContent = "КУЛАКИ";

    }

});


// ======================================================
// СТРЕЛЬБА
// ======================================================

shootButton.addEventListener("pointerdown", function(e) {

    e.preventDefault();

    shoot();

});


// ПК

window.addEventListener("keydown", function(e) {

    if (e.code === "Space") {

        shoot();

    }

    if (e.code === "KeyE") {

        interact();

    }

    if (e.code === "KeyQ") {

        weaponButton.click();

    }

});


// ======================================================
// ВЫСТРЕЛ
// ======================================================

function shoot() {

    if (weaponAnimation > 0) {
        return;
    }

    weaponAnimation = weapon === "shotgun" ? 300 : 180;


    if (weapon === "fists") {

        punch();

    }

    else {

        shotgun();

    }

}


// ======================================================
// КУЛАК
// ======================================================

function punch() {

    const target = getTargetEnemy(2.0);

    if (target) {

        target.hp -= 20;

        target.hit = 1;

        if (target.hp <= 0) {

            target.alive = false;

            showMessage("МАНЕКЕН ПОВАЛЕН");

        }

    }

}


// ======================================================
// ДРОБОВИК
// ======================================================

function shotgun() {

    const range = 8;

    let hitSomething = false;


    // Несколько небольших направлений,
    // имитирующих разброс дроби.

    const spread = [

        -0.08,
        -0.04,
        0,
        0.04,
        0.08

    ];


    for (const offset of spread) {

        const target = getTargetEnemy(
            range,
            offset
        );

        if (target) {

            target.hp -= 20;

            target.hit = 1;

            hitSomething = true;

        }

    }


    if (hitSomething) {

        showMessage("ПОПАДАНИЕ");

    }

}


// ======================================================
// ПОИСК МАНЕКЕНА
// ======================================================

function getTargetEnemy(maxDistance, angleOffset = 0) {

    let best = null;

    let bestDistance = Infinity;


    for (const enemy of enemies) {

        if (!enemy.alive) {
            continue;
        }


        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;

        const distance = Math.sqrt(
            dx * dx +
            dy * dy
        );


        if (distance > maxDistance) {
            continue;
        }


        let angle = Math.atan2(
            dy,
            dx
        );


        let difference =
            normalizeAngle(
                angle -
                player.angle -
                angleOffset
            );


        // Примерный размер цели

        if (Math.abs(difference) < 0.13) {

            if (distance < bestDistance) {

                best = enemy;

                bestDistance = distance;

            }

        }

    }


    return best;

}


// ======================================================
// РЫЧАГ
// ======================================================

interactButton.addEventListener("pointerdown", function(e) {

    e.preventDefault();

    interact();

});


function interact() {

    const dx = lever.x - player.x;
    const dy = lever.y - player.y;

    const distance = Math.sqrt(
        dx * dx +
        dy * dy
    );


    if (distance > 1.5) {

        showMessage("ПОДОЙДИ БЛИЖЕ К РЫЧАГУ");

        return;

    }


    // Спавним нового манекена

    spawnEnemy();

}


// ======================================================
// СПАВН МАНЕКЕНА
// ======================================================

function spawnEnemy() {

    // Несколько заранее подготовленных точек.

    const spawnPoints = [

        { x: 3, y: 3 },
        { x: 8, y: 3 },
        { x: 3, y: 8 },
        { x: 8, y: 8 },
        { x: 6, y: 5 }

    ];


    // Ищем свободную точку

    for (const point of spawnPoints) {

        let occupied = false;


        for (const enemy of enemies) {

            if (!enemy.alive) {
                continue;
            }


            const dx =
                enemy.x -
                point.x;

            const dy =
                enemy.y -
                point.y;


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


// ======================================================
// JOYSTICK
// ======================================================

let joystickActive = false;

let joyX = 0;
let joyY = 0;


joystick.addEventListener("pointerdown", function(e) {

    joystickActive = true;

    joystick.setPointerCapture(e.pointerId);

    updateJoystick(e);

});


joystick.addEventListener("pointermove", function(e) {

    if (!joystickActive) {
        return;
    }

    updateJoystick(e);

});


joystick.addEventListener("pointerup", function() {

    joystickActive = false;

    joyX = 0;
    joyY = 0;

    stick.style.left = "50%";
    stick.style.top = "50%";

});


joystick.addEventListener("pointercancel", function() {

    joystickActive = false;

    joyX = 0;
    joyY = 0;

});


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
        rect.width / 2 -
        28;


    const length =
        Math.sqrt(
            x * x +
            y * y
        );


    if (length > max) {

        x =
            x /
            length *
            max;

        y =
            y /
            length *
            max;

    }


    joyX = x / max;
    joyY = y / max;


    stick.style.left =
        `calc(50% + ${x}px)`;

    stick.style.top =
        `calc(50% + ${y}px)`;

}


// ======================================================
// ПОВОРОТ КАМЕРЫ
// ======================================================

let lookActive = false;

let lastLookX = 0;


// Правая часть экрана

canvas.addEventListener("pointerdown", function(e) {

    if (e.clientX < window.innerWidth * 0.45) {
        return;
    }

    lookActive = true;

    lastLookX = e.clientX;

    canvas.setPointerCapture(e.pointerId);

});


canvas.addEventListener("pointermove", function(e) {

    if (!lookActive) {
        return;
    }


    const dx =
        e.clientX -
        lastLookX;


    player.angle += dx * 0.006;

    lastLookX = e.clientX;

});


canvas.addEventListener("pointerup", function() {

    lookActive = false;

});


canvas.addEventListener("pointercancel", function() {

    lookActive = false;

});


// ======================================================
// ПРОВЕРКА СТЕН
// ======================================================

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


// ======================================================
// ДВИЖЕНИЕ
// ======================================================

function movePlayer(delta) {

    const forward =
        -joyY;

    const strafe =
        joyX;


    // Клавиатура

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


    const nf = f / Math.max(length, 1);
    const ns = s / Math.max(length, 1);


    const moveSpeed =
        player.speed *
        delta /
        1000;


    const dx =
        Math.cos(player.angle) *
        nf *
        moveSpeed
        -
        Math.sin(player.angle) *
        ns *
        moveSpeed;


    const dy =
        Math.sin(player.angle) *
        nf *
        moveSpeed
        +
        Math.cos(player.angle) *
        ns *
        moveSpeed;


    // Коллизия X

    if (
        !isWall(
            player.x + dx + Math.sign(dx) * player.radius,
            player.y
        )
    ) {

        player.x += dx;

    }


    // Коллизия Y

    if (
        !isWall(
            player.x,
            player.y + dy + Math.sign(dy) * player.radius
        )
    ) {

        player.y += dy;

    }

}


// ======================================================
// КЛАВИАТУРА
// ======================================================

const keys = {};

window.addEventListener("keydown", function(e) {

    keys[e.code] = true;

});

window.addEventListener("keyup", function(e) {

    keys[e.code] = false;

});


// ======================================================
// RAYCAST
// ======================================================

function castRay(angle) {

    const sin = Math.sin(angle);
    const cos = Math.cos(angle);


    let distance = 0;

    const step = 0.025;


    while (distance < MAX_DEPTH) {

        distance += step;


        const x =
            player.x +
            cos *
            distance;

        const y =
            player.y +
            sin *
            distance;


        if (isWall(x, y)) {

            return distance;

        }

    }


    return MAX_DEPTH;

}


// ======================================================
// РИСОВАНИЕ МИРА
// ======================================================

function drawWorld() {

    const w = canvas.width;
    const h = canvas.height;


    // Небо

    ctx.fillStyle = "#101010";

    ctx.fillRect(
        0,
        0,
        w,
        h / 2
    );


    // Пол

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
            Math.floor(w / 2)
        );


    const columnWidth =
        w /
        rayCount;


    // Стены

    for (let i = 0; i < rayCount; i++) {

        const cameraX =
            i /
            rayCount -
            0.5;


        const rayAngle =
            player.angle +
            cameraX *
            FOV;


        let distance =
            castRay(rayAngle);


        // Убираем fish-eye

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


// ======================================================
// SPRITES
// ======================================================

function drawSprites() {

    const sprites = [];


    // Манекены

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


    // Рычаг

    sprites.push({

        type: "lever",

        x: lever.x,
        y: lever.y,

        object: lever

    });


    // Дальние рисуем первыми

    sprites.sort(function(a, b) {

        const da =
            distanceToPlayer(a);

        const db =
            distanceToPlayer(b);

        return db - da;

    });


    for (const sprite of sprites) {

        drawSprite(sprite);

    }

}


// ======================================================
// ДИСТАНЦИЯ
// ======================================================

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


// ======================================================
// SPRITE
// ======================================================

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


    let angle =
        Math.atan2(
            dy,
            dx
        );


    const relativeAngle =
        normalizeAngle(
            angle -
            player.angle
        );


    // За пределами обзора

    if (
        Math.abs(relativeAngle) >
        FOV * 0.65
    ) {

        return;

    }


    // Проверяем стену перед объектом

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


// ======================================================
// МАНЕКЕН
// ======================================================

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


    let color =
        enemy.hit > 0
            ? "#ffffff"
            : "#888888";


    // Тело

    ctx.fillStyle = color;

    ctx.fillRect(
        x - 35 * scale,
        centerY,
        70 * scale,
        bodyHeight
    );


    // Голова

    ctx.beginPath();

    ctx.arc(
        x,
        centerY - 35 * scale,
        headSize,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Руки

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


    // Ноги

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


    // HP

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


// ======================================================
// РЫЧАГ
// ======================================================

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


    // Основание

    ctx.fillStyle = "#333";

    ctx.fillRect(
        x - 18 * scale,
        y,
        36 * scale,
        65 * scale
    );


    // Рычаг

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


    // Рукоятка

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


// ======================================================
// ОРУЖИЕ НА ЭКРАНЕ
// ======================================================

function drawWeapon() {

    const w = canvas.width;
    const h = canvas.height;


    let recoil = 0;


    if (weaponAnimation > 0) {

        recoil =
            Math.sin(
                weaponAnimation /
                300 *
                Math.PI
            );

    }


    if (weapon === "fists") {

        drawFists(
            w,
            h,
            recoil
        );

    }

    else {

        drawShotgun(
            w,
            h,
            recoil
        );

    }

}


// ======================================================
// КУЛАКИ
// ======================================================

function drawFists(
    w,
    h,
    recoil
) {

    const size =
        Math.min(w, h) *
        0.12;


    drawFist(
        w * 0.30,
        h * 0.91 - recoil * 35,
        size,
        0.05
    );


    drawFist(
        w * 0.70,
        h * 0.91 - recoil * 35,
        size,
        -0.05
    );

}


function drawFist(
    x,
    y,
    size,
    rotation
) {

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(rotation);


    // Рука

    ctx.fillStyle = "#b97858";

    ctx.fillRect(
        -size * .23,
        0,
        size * .46,
        size * .9
    );


    // Кулак

    ctx.fillStyle = "#d59a73";

    ctx.beginPath();

    ctx.roundRect(
        -size * .48,
        -size * .40,
        size * .96,
        size * .62,
        size * .14
    );

    ctx.fill();


    // Пальцы

    ctx.fillStyle = "#b87858";

    for (let i = 0; i < 4; i++) {

        ctx.fillRect(
            -size * .37 +
            i * size * .19,

            -size * .20,

            size * .13,
            size * .24
        );

    }


    ctx.restore();

}


// ======================================================
// ДРОБОВИК
// ======================================================

function drawShotgun(
    w,
    h,
    recoil
) {

    const cx = w / 2;

    const bottom = h + 30;


    ctx.save();


    // Отдача

    ctx.translate(
        0,
        recoil * 45
    );


    // Ствол

    ctx.fillStyle = "#181818";

    ctx.fillRect(
        cx - 45,
        h * .67,
        90,
        h * .34
    );


    // Верх ствола

    ctx.fillStyle = "#292929";

    ctx.fillRect(
        cx - 28,
        h * .58,
        56,
        h * .38
    );


    // Конец ствола

    ctx.fillStyle = "#080808";

    ctx.beginPath();

    ctx.arc(
        cx,
        h * .58,
        28,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Два отверстия

    ctx.fillStyle = "#000";

    ctx.beginPath();

    ctx.arc(
        cx - 11,
        h * .58,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        cx + 11,
        h * .58,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Деревянная часть

    ctx.fillStyle = "#75482d";

    ctx.fillRect(
        cx - 70,
        h * .82,
        140,
        35
    );


    // Руки

    ctx.fillStyle = "#c88c68";

    ctx.fillRect(
        cx - 100,
        h * .80,
        35,
        120
    );

    ctx.fillRect(
        cx + 65,
        h * .80,
        35,
        120
    );


    ctx.restore();

}


// ======================================================
// УПРАВЛЕНИЕ
// ======================================================

function normalizeAngle(angle) {

    while (angle > Math.PI) {

        angle -= Math.PI * 2;

    }

    while (angle < -Math.PI) {

        angle += Math.PI * 2;

    }

    return angle;

}


// ======================================================
// СООБЩЕНИЕ
// ======================================================

let messageTimer = 0;


function showMessage(text) {

    message.textContent = text;

    message.style.opacity = "1";

    messageTimer = 900;

}


// ======================================================
// UPDATE
// ======================================================

function update(delta) {

    movePlayer(delta);


    // Анимация оружия

    if (weaponAnimation > 0) {

        weaponAnimation -= delta;

    }


    // Вспышка попадания

    for (const enemy of enemies) {

        if (enemy.hit > 0) {

            enemy.hit -=
                delta / 100;

        }

    }


    // Сообщение

    if (messageTimer > 0) {

        messageTimer -= delta;

    }

    else {

        message.style.opacity = "0";

    }

}


// ======================================================
// GAME LOOP
// ======================================================

let lastTime =
    performance.now();


function loop(time) {

    const delta =
        Math.min(
            time - lastTime,
            50
        );

    lastTime = time;


    update(delta);


    // Мир

    drawWorld();


    // Манекены и рычаг

    drawSprites();


    // Оружие

    drawWeapon();


    requestAnimationFrame(loop);

}


requestAnimationFrame(loop);
