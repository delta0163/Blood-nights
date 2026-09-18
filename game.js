"use strict";

/*
====================================================
 DOOM-STYLE 2.5D SHOOTER
 Без WebGL.
 Без библиотек.
 Работает на Canvas.
====================================================
*/

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

const hpElement = document.getElementById("hp");
const dummyHpElement = document.getElementById("dummyHp");
const messageElement = document.getElementById("message");
const weaponElement = document.getElementById("weapon");

let screenWidth = 0;
let screenHeight = 0;

function resizeCanvas() {

    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    canvas.width = Math.max(320, Math.floor(screenWidth * 0.75));
    canvas.height = Math.max(180, Math.floor(screenHeight * 0.75));

}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();

/*
====================================================
 КАРТА

 # = стена
 . = пол
====================================================
*/

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
    "############"

];

const TILE = 64;

/*
====================================================
 ИГРОК
====================================================
*/

const player = {

    x: TILE * 3.5,

    y: TILE * 5.5,

    angle: 0,

    speed: 2.7,

    hp: 100

};

/*
====================================================
 МАНЕКЕН
====================================================
*/

const dummy = {

    x: TILE * 8,

    y: TILE * 5,

    hp: 100,

    maxHp: 100,

    hitTimer: 0,

    attackCooldown: 0

};

/*
====================================================
 УПРАВЛЕНИЕ
====================================================
*/

const input = {

    forward: false,

    backward: false,

    left: false,

    right: false,

    turnLeft: false,

    turnRight: false

};

/*
====================================================
 RAYCAST
====================================================
*/

const FOV = Math.PI / 3;

const RAYS = 320;

const MAX_DISTANCE = 900;

function wallAt(x, y) {

    const mapX = Math.floor(x / TILE);
    const mapY = Math.floor(y / TILE);

    if (
        mapY < 0 ||
        mapY >= map.length ||
        mapX < 0 ||
        mapX >= map[0].length
    ) {
        return true;
    }

    return map[mapY][mapX] === "#";
}

/*
====================================================
 ПРОВЕРКА ДВИЖЕНИЯ
====================================================
*/

function movePlayer(dx, dy) {

    const radius = 12;

    if (
        !wallAt(player.x + dx + radius, player.y) &&
        !wallAt(player.x + dx - radius, player.y)
    ) {

        player.x += dx;

    }

    if (
        !wallAt(player.x, player.y + dy + radius) &&
        !wallAt(player.x, player.y + dy - radius)
    ) {

        player.y += dy;

    }

}

/*
====================================================
 ЛУЧ
====================================================
*/

function castRay(angle) {

    const step = 3;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (
        let distance = 0;
        distance < MAX_DISTANCE;
        distance += step
    ) {

        const x =
            player.x +
            cos * distance;

        const y =
            player.y +
            sin * distance;

        if (wallAt(x, y)) {

            return distance;

        }

    }

    return MAX_DISTANCE;

}

/*
====================================================
 ФОН
====================================================
*/

function drawSkyAndFloor() {

    /*
        Небо
    */

    const skyGradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height / 2
        );

    skyGradient.addColorStop(
        0,
        "#151515"
    );

    skyGradient.addColorStop(
        1,
        "#4b4b4b"
    );

    ctx.fillStyle = skyGradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height / 2
    );

    /*
        Пол
    */

    const floorGradient =
        ctx.createLinearGradient(
            0,
            canvas.height / 2,
            0,
            canvas.height
        );

    floorGradient.addColorStop(
        0,
        "#303030"
    );

    floorGradient.addColorStop(
        1,
        "#080808"
    );

    ctx.fillStyle = floorGradient;

    ctx.fillRect(
        0,
        canvas.height / 2,
        canvas.width,
        canvas.height / 2
    );

}

/*
====================================================
 СТЕНЫ
====================================================
*/

const depthBuffer = new Array(RAYS);

function renderWalls() {

    const columnWidth =
        canvas.width / RAYS;

    for (
        let ray = 0;
        ray < RAYS;
        ray++
    ) {

        const rayAngle =
            player.angle -
            FOV / 2 +
            (ray / RAYS) * FOV;

        let distance =
            castRay(rayAngle);

        /*
            Убираем fish-eye.
        */

        distance *=
            Math.cos(
                rayAngle -
                player.angle
            );

        distance =
            Math.max(
                distance,
                0.1
            );

        depthBuffer[ray] = distance;

        /*
            Высота стены
        */

        const wallHeight =
            (TILE * canvas.height) /
            distance;

        const top =
            canvas.height / 2 -
            wallHeight / 2;

        /*
            Затемнение по расстоянию
        */

        let brightness =
            190 -
            distance * 0.25;

        brightness =
            Math.max(
                35,
                Math.min(
                    190,
                    brightness
                )
            );

        const color =
            Math.floor(brightness);

        ctx.fillStyle =
            `rgb(${color},${color},${color})`;

        ctx.fillRect(
            ray * columnWidth,
            top,
            columnWidth + 1,
            wallHeight
        );

    }

}

/*
====================================================
 УГОЛ ДО ОБЪЕКТА
====================================================
*/

function relativeAngle(targetX, targetY) {

    let angle =
        Math.atan2(
            targetY - player.y,
            targetX - player.x
        ) -
        player.angle;

    while (angle > Math.PI) {
        angle -= Math.PI * 2;
    }

    while (angle < -Math.PI) {
        angle += Math.PI * 2;
    }

    return angle;

}

/*
====================================================
 МАНЕКЕН
====================================================
*/

function renderDummy() {

    if (dummy.hp <= 0) {
        return;
    }

    const dx =
        dummy.x -
        player.x;

    const dy =
        dummy.y -
        player.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    let angle =
        relativeAngle(
            dummy.x,
            dummy.y
        );

    /*
        За пределами поля зрения
    */

    if (
        Math.abs(angle) >
        FOV / 2 + 0.25
    ) {

        return;

    }

    const correctedDistance =
        distance *
        Math.cos(angle);

    if (
        correctedDistance <= 1
    ) {

        return;

    }

    /*
        Позиция на экране
    */

    const centerX =
        canvas.width / 2;

    const screenX =
        centerX +
        Math.tan(angle) *
        (canvas.width / 2) /
        Math.tan(FOV / 2);

    /*
        Размер спрайта
    */

    const spriteHeight =
        (TILE * canvas.height * 1.7) /
        correctedDistance;

    const spriteWidth =
        spriteHeight * 0.48;

    const bottom =
        canvas.height / 2 +
        spriteHeight / 2;

    const x =
        screenX -
        spriteWidth / 2;

    const y =
        bottom -
        spriteHeight;

    ctx.save();

    /*
        Эффект попадания
    */

    if (dummy.hitTimer > 0) {

        ctx.translate(
            Math.random() * 6 - 3,
            Math.random() * 6 - 3
        );

    }

    /*
        Тень
    */

    ctx.fillStyle =
        "rgba(0,0,0,.5)";

    ctx.beginPath();

    ctx.ellipse(
        screenX,
        bottom,
        spriteWidth * .55,
        spriteHeight * .07,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
        Ноги
    */

    ctx.fillStyle = "#444";

    ctx.fillRect(
        x + spriteWidth * .25,
        y + spriteHeight * .68,
        spriteWidth * .2,
        spriteHeight * .32
    );

    ctx.fillRect(
        x + spriteWidth * .55,
        y + spriteHeight * .68,
        spriteWidth * .2,
        spriteHeight * .32
    );

    /*
        Тело
    */

    ctx.fillStyle = "#777";

    ctx.fillRect(
        x + spriteWidth * .18,
        y + spriteHeight * .32,
        spriteWidth * .64,
        spriteHeight * .4
    );

    /*
        Левая рука
    */

    ctx.fillStyle = "#666";

    ctx.fillRect(
        x + spriteWidth * .02,
        y + spriteHeight * .34,
        spriteWidth * .2,
        spriteHeight * .38
    );

    /*
        Правая рука
    */

    ctx.fillRect(
        x + spriteWidth * .78,
        y + spriteHeight * .34,
        spriteWidth * .2,
        spriteHeight * .38
    );

    /*
        Голова
    */

    ctx.fillStyle = "#aaa";

    ctx.beginPath();

    ctx.arc(
        screenX,
        y + spriteHeight * .19,
        spriteWidth * .23,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
        Лицо
    */

    ctx.fillStyle = "#111";

    ctx.fillRect(
        screenX -
        spriteWidth * .11,

        y +
        spriteHeight * .17,

        spriteWidth * .06,

        spriteHeight * .035
    );

    ctx.fillRect(
        screenX +
        spriteWidth * .05,

        y +
        spriteHeight * .17,

        spriteWidth * .06,

        spriteHeight * .035
    );

    ctx.restore();

    /*
        Полоска здоровья
    */

    const barWidth =
        spriteWidth * 1.2;

    const barHeight = 7;

    ctx.fillStyle = "#111";

    ctx.fillRect(
        screenX -
        barWidth / 2,

        y - 13,

        barWidth,

        barHeight
    );

    ctx.fillStyle = "#d22";

    ctx.fillRect(
        screenX -
        barWidth / 2,

        y - 13,

        barWidth *
        (dummy.hp / dummy.maxHp),

        barHeight
    );

}

/*
====================================================
 УДАР
====================================================
*/

let punchSide = false;

function punch() {

    if (dummy.hp <= 0) {
        return;
    }

    /*
        Анимация
    */

    punchSide = !punchSide;

    weaponElement.classList.remove(
        "punchLeft",
        "punchRight"
    );

    void weaponElement.offsetWidth;

    weaponElement.classList.add(
        punchSide ?
        "punchLeft" :
        "punchRight"
    );

    /*
        Проверка попадания
    */

    const dx =
        dummy.x -
        player.x;

    const dy =
        dummy.y -
        player.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    const angle =
        Math.abs(
            relativeAngle(
                dummy.x,
                dummy.y
            )
        );

    /*
        Радиус удара
    */

    if (
        distance < 130 &&
        angle < 0.35
    ) {

        dummy.hp -= 25;

        dummy.hitTimer = 10;

        if (dummy.hp < 0) {
            dummy.hp = 0;
        }

        dummyHpElement.textContent =
            dummy.hp;

        if (dummy.hp <= 0) {

            messageElement.textContent =
                "МАНЕКЕН ПОВАЛЕН";

        }

    }

}

/*
====================================================
 ИИ МАНЕКЕНА
====================================================
*/

function updateDummy() {

    if (dummy.hp <= 0) {
        return;
    }

    const dx =
        player.x -
        dummy.x;

    const dy =
        player.y -
        dummy.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    /*
        Идёт к игроку
    */

    if (
        distance > 80 &&
        distance < 600
    ) {

        const angle =
            Math.atan2(
                dy,
                dx
            );

        const speed = 0.35;

        const newX =
            dummy.x +
            Math.cos(angle) *
            speed;

        const newY =
            dummy.y +
            Math.sin(angle) *
            speed;

        if (!wallAt(newX, newY)) {

            dummy.x = newX;
            dummy.y = newY;

        }

    }

    /*
        Атака
    */

    if (distance < 65) {

        dummy.attackCooldown++;

        if (
            dummy.attackCooldown > 60
        ) {

            player.hp -= 5;

            player.hp =
                Math.max(
                    0,
                    player.hp
                );

            hpElement.textContent =
                player.hp;

            dummy.attackCooldown = 0;

            if (player.hp <= 0) {

                messageElement.textContent =
                    "ТЫ ПРОИГРАЛ";

            }

        }

    } else {

        dummy.attackCooldown = 0;

    }

}

/*
====================================================
 ОБНОВЛЕНИЕ ИГРЫ
====================================================
*/

function update() {

    if (player.hp <= 0) {
        return;
    }

    /*
        Поворот
    */

    if (input.turnLeft) {
        player.angle -= 0.045;
    }

    if (input.turnRight) {
        player.angle += 0.045;
    }

    /*
        Движение
    */

    let moveX = 0;
    let moveY = 0;

    const cos =
        Math.cos(player.angle);

    const sin =
        Math.sin(player.angle);

    if (input.forward) {

        moveX +=
            cos *
            player.speed;

        moveY +=
            sin *
            player.speed;

    }

    if (input.backward) {

        moveX -=
            cos *
            player.speed;

        moveY -=
            sin *
            player.speed;

    }

    if (input.left) {

        moveX +=
            sin *
            player.speed;

        moveY -=
            cos *
            player.speed;

    }

    if (input.right) {

        moveX -=
            sin *
            player.speed;

        moveY +=
            cos *
            player.speed;

    }

    movePlayer(
        moveX,
        moveY
    );

    /*
        Манекен
    */

    updateDummy();

    if (dummy.hitTimer > 0) {
        dummy.hitTimer--;
    }

}

/*
====================================================
 РЕНДЕР
====================================================
*/

function render() {

    drawSkyAndFloor();

    renderWalls();

    renderDummy();

}

/*
====================================================
 GAME LOOP
====================================================
*/

function gameLoop() {

    update();

    render();

    requestAnimationFrame(
        gameLoop
    );

}

gameLoop();

/*
====================================================
 МОБИЛЬНЫЕ КНОПКИ
====================================================
*/

function holdButton(
    elementId,
    property
) {

    const element =
        document.getElementById(
            elementId
        );

    function start(event) {

        event.preventDefault();

        input[property] = true;

    }

    function stop(event) {

        event.preventDefault();

        input[property] = false;

    }

    element.addEventListener(
        "pointerdown",
        start
    );

    element.addEventListener(
        "pointerup",
        stop
    );

    element.addEventListener(
        "pointercancel",
        stop
    );

    element.addEventListener(
        "pointerleave",
        stop
    );

}

holdButton(
    "forward",
    "forward"
);

holdButton(
    "moveBack",
    "backward"
);

holdButton(
    "moveLeft",
    "left"
);

holdButton(
    "moveRight",
    "right"
);

holdButton(
    "turnLeft",
    "turnLeft"
);

holdButton(
    "turnRight",
    "turnRight"
);

/*
====================================================
 КНОПКА УДАРА
====================================================
*/

document
    .getElementById("attack")
    .addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            punch();

        }
    );

/*
====================================================
 КЛАВИАТУРА
====================================================
*/

window.addEventListener(
    "keydown",
    function(event) {

        if (event.code === "KeyW") {
            input.forward = true;
        }

        if (event.code === "KeyS") {
            input.backward = true;
        }

        if (event.code === "KeyA") {
            input.left = true;
        }

        if (event.code === "KeyD") {
            input.right = true;
        }

        if (event.code === "ArrowLeft") {
            input.turnLeft = true;
        }

        if (event.code === "ArrowRight") {
            input.turnRight = true;
        }

        if (event.code === "Space") {
            punch();
        }

    }
);

window.addEventListener(
    "keyup",
    function(event) {

        if (event.code === "KeyW") {
            input.forward = false;
        }

        if (event.code === "KeyS") {
            input.backward = false;
        }

        if (event.code === "KeyA") {
            input.left = false;
        }

        if (event.code === "KeyD") {
            input.right = false;
        }

        if (event.code === "ArrowLeft") {
            input.turnLeft = false;
        }

        if (event.code === "ArrowRight") {
            input.turnRight = false;
        }

    }
);
