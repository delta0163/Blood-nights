"use strict";

/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = Math.max(320, window.innerWidth);
    canvas.height = Math.max(240, window.innerHeight);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


/* =========================================================
   UI
========================================================= */

const moveJoystick = document.getElementById("moveJoystick");
const moveStick = document.getElementById("moveStick");

const lookJoystick = document.getElementById("lookJoystick");
const lookStick = document.getElementById("lookStick");

const shootButton = document.getElementById("shootButton");
const jumpButton = document.getElementById("jumpButton");
const interactButton = document.getElementById("interactButton");
const weaponButton = document.getElementById("weaponButton");

const weaponName = document.getElementById("weaponName");

const styleBox = document.getElementById("styleBox");
const styleRankElement = document.getElementById("styleRank");
const styleMultiplierElement = document.getElementById("styleMultiplier");
const stylePointsElement = document.getElementById("stylePoints");


/* =========================================================
   TEXTURES
========================================================= */

const leftFist = new Image();
const rightFist = new Image();

let leftFistReady = false;
let rightFistReady = false;

leftFist.onload = () => {
    leftFistReady = true;
};

rightFist.onload = () => {
    rightFistReady = true;
};

leftFist.src = "textures/left_fist.png";
rightFist.src = "textures/right_fist.png";


/* =========================================================
   MAP
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
   PLAYER
========================================================= */

const player = {

    x: 6,
    y: 8,

    angle: 0,

    pitch: 0,

    /* Высота ног над землёй */
    z: 0,

    /* Вертикальная скорость */
    verticalVelocity: 0,

    /* Скорость движения */
    currentSpeed: 0,

    maxSpeed: 4.8,

    acceleration: 10,

    friction: 8,

    radius: 0.18,

    /* Прыжок */
    jumpPower: 5.6,

    gravity: 15,

    grounded: true,

    /* На какой высоте сейчас стоим */
    standingHeight: 0
};


/* =========================================================
   ПЛАТФОРМА
========================================================= */

/*
   x/y — положение
   width/height — размер
   z — высота верхней поверхности
*/

const platform = {

    x: 7.1,
    y: 5.3,

    width: 2.2,
    height: 1.5,

    z: 1.35,

    thickness: 0.35
};


/*
   Проверяет, находится ли игрок
   над платформой по X/Y.
*/

function isOverPlatform(x, y) {

    return (
        x >= platform.x &&
        x <= platform.x + platform.width &&
        y >= platform.y &&
        y <= platform.y + platform.height
    );
}


/* =========================================================
   CAMERA
========================================================= */

const MAX_PITCH = 0.75;


/*
   Настройки правого джойстика.

   Чем меньше LOOK_SPEED —
   тем удобнее и медленнее поворот.
*/

const LOOK_SPEED_X = 2.0;
const LOOK_SPEED_Y = 1.25;


/* =========================================================
   RENDER
========================================================= */

const FOV = Math.PI / 3;
const MAX_DEPTH = 20;
const RAYS = 240;


/* =========================================================
   ENEMIES
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
   LEVER
========================================================= */

const lever = {
    x: 9,
    y: 2
};


/* =========================================================
   WEAPON
========================================================= */

let weapon = "fists";

let weaponAnimation = 0;

let muzzleFlash = 0;


/* =========================================================
   STYLE
========================================================= */

let styleScore = 0;
let styleCombo = 0;
let styleMultiplier = 1;
let lastStyleAction = "";
let styleVisible = false;
let styleTimer = 0;

const STYLE_TIMEOUT = 10000;


function getStyleRank() {

    if (styleScore >= 1800) return "SSS";
    if (styleScore >= 1200) return "SS";
    if (styleScore >= 750) return "S";
    if (styleScore >= 450) return "A";
    if (styleScore >= 250) return "B";
    if (styleScore >= 100) return "C";

    return "D";
}


function addStyle(amount, action) {

    if (action !== lastStyleAction) {
        styleCombo++;
    } else {
        amount *= 0.5;
    }

    styleMultiplier =
        Math.min(
            8,
            1 + Math.floor(styleCombo / 2)
        );

    const gained =
        Math.max(
            1,
            Math.round(amount * styleMultiplier)
        );

    styleScore += gained;

    lastStyleAction = action;

    styleTimer = STYLE_TIMEOUT;

    styleVisible = true;

    styleBox.style.display = "block";

    updateStyleUI();
}


function updateStyleUI() {

    styleRankElement.textContent =
        getStyleRank();

    styleMultiplierElement.textContent =
        "×" + styleMultiplier;

    stylePointsElement.textContent =
        Math.floor(styleScore);
}


function hideStyle() {

    styleVisible = false;

    styleScore = 0;
    styleCombo = 0;
    styleMultiplier = 1;

    lastStyleAction = "";

    styleTimer = 0;

    styleBox.style.display = "none";
}


/* =========================================================
   KEYBOARD
========================================================= */

const keys = {};

window.addEventListener("keydown", function(e) {

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

    if (e.code === "KeyC") {
        jump();
    }
});


window.addEventListener("keyup", function(e) {
    keys[e.code] = false;
});


/* =========================================================
   WEAPON
========================================================= */

weaponButton.addEventListener(
    "pointerdown",
    function(e) {

        e.preventDefault();

        switchWeapon();
    }
);


function switchWeapon() {

    if (weapon === "fists") {

        weapon = "pistol";

        weaponName.textContent =
            "ПИСТОЛЕТ";

    } else if (weapon === "pistol") {

        weapon = "shotgun";

        weaponName.textContent =
            "ДРОБОВИК";

    } else {

        weapon = "fists";

        weaponName.textContent =
            "КУЛАКИ";
    }
}


/* =========================================================
   SHOOT
========================================================= */

shootButton.addEventListener(
    "pointerdown",
    function(e) {

        e.preventDefault();

        shoot();
    }
);


function shoot() {

    if (weaponAnimation > 0) {
        return;
    }

    if (weapon === "fists") {

        weaponAnimation = 280;

        punch();

    } else if (weapon === "pistol") {

        weaponAnimation = 220;

        muzzleFlash = 80;

        pistol();

    } else {

        weaponAnimation = 300;

        shotgun();
    }
}


/* =========================================================
   PUNCH
========================================================= */

function punch() {

    const target = getTargetEnemy(2);

    if (!target) return;

    target.hp -= 20;

    target.hit = 1;

    addStyle(15, "punch");

    if (target.hp <= 0) {

        target.hp = 0;

        target.alive = false;

        addStyle(50, "kill");
    }
}


/* =========================================================
   PISTOL
========================================================= */

function pistol() {

    const target = getTargetEnemy(12);

    if (!target) return;

    target.hp -= 25;

    target.hit = 1;

    addStyle(20, "pistol");

    if (target.hp <= 0) {

        target.hp = 0;

        target.alive = false;

        addStyle(50, "kill");
    }
}


/* =========================================================
   SHOTGUN
========================================================= */

function shotgun() {

    const spread = [
        -.08,
        -.04,
        0,
        .04,
        .08
    ];

    for (const offset of spread) {

        const target =
            getTargetEnemy(8, offset);

        if (!target) continue;

        target.hp -= 20;

        target.hit = 1;

        addStyle(25, "shotgun");

        if (target.hp <= 0) {

            target.hp = 0;

            target.alive = false;

            addStyle(50, "kill");
        }
    }
}


/* =========================================================
   TARGET
========================================================= */

function getTargetEnemy(
    maxDistance,
    offset = 0
) {

    let result = null;

    let closest = Infinity;

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const dx =
            enemy.x - player.x;

        const dy =
            enemy.y - player.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (distance > maxDistance) {
            continue;
        }

        const angle =
            Math.atan2(dy, dx);

        const difference =
            normalizeAngle(
                angle -
                player.angle -
                offset
            );

        if (Math.abs(difference) < .13) {

            if (distance < closest) {

                closest = distance;

                result = enemy;
            }
        }
    }

    return result;
}


/* =========================================================
   JUMP
========================================================= */

jumpButton.addEventListener(
    "pointerdown",
    function(e) {

        e.preventDefault();

        jump();
    }
);


function jump() {

    /*
       Прыжок только с поверхности.
    */

    if (!player.grounded) {
        return;
    }

    player.verticalVelocity =
        player.jumpPower;

    player.grounded = false;

    addStyle(5, "jump");
}


/* =========================================================
   INTERACT
========================================================= */

interactButton.addEventListener(
    "pointerdown",
    function(e) {

        e.preventDefault();

        interact();
    }
);


function interact() {

    const dx =
        lever.x - player.x;

    const dy =
        lever.y - player.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    if (distance > 1.5) {
        return;
    }

    spawnEnemy();
}


/* =========================================================
   SPAWN ENEMY
========================================================= */

function spawnEnemy() {

    const points = [

        { x: 3, y: 3 },
        { x: 8, y: 3 },
        { x: 3, y: 8 },
        { x: 8, y: 8 },
        { x: 6, y: 5 }

    ];

    for (const point of points) {

        let occupied = false;

        for (const enemy of enemies) {

            if (!enemy.alive) continue;

            const dx =
                enemy.x - point.x;

            const dy =
                enemy.y - point.y;

            if (
                Math.sqrt(
                    dx * dx +
                    dy * dy
                ) < .8
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

            addStyle(10, "lever");

            return;
        }
    }
}


/* =========================================================
   LEFT JOYSTICK
========================================================= */

let moveJoyActive = false;

let moveJoyX = 0;
let moveJoyY = 0;


moveJoystick.addEventListener(
    "pointerdown",
    function(e) {

        e.preventDefault();

        moveJoyActive = true;

        moveJoystick.setPointerCapture(
            e.pointerId
        );

        updateMoveJoystick(e);
    }
);


moveJoystick.addEventListener(
    "pointermove",
    function(e) {

        if (!moveJoyActive) return;

        updateMoveJoystick(e);
    }
);


moveJoystick.addEventListener(
    "pointerup",
    resetMoveJoystick
);


moveJoystick.addEventListener(
    "pointercancel",
    resetMoveJoystick
);


function resetMoveJoystick() {

    moveJoyActive = false;

    moveJoyX = 0;
    moveJoyY = 0;

    moveStick.style.left = "50%";
    moveStick.style.top = "50%";
}


function updateMoveJoystick(e) {

    const rect =
        moveJoystick.getBoundingClientRect();

    const centerX =
        rect.left + rect.width / 2;

    const centerY =
        rect.top + rect.height / 2;

    let x =
        e.clientX - centerX;

    let y =
        e.clientY - centerY;

    const max =
        rect.width / 2 - 26;

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

    moveJoyX = x / max;
    moveJoyY = y / max;

    moveStick.style.left =
        "calc(50% + " + x + "px)";

    moveStick.style.top =
        "calc(50% + " + y + "px)";
}


/* =========================================================
   RIGHT JOYSTICK
========================================================= */

let lookJoyActive = false;

let lookJoyX = 0;
let lookJoyY = 0;


/*
   Центр мёртвой зоны.

   Маленькие движения возле центра
   больше не будут дёргать камеру.
*/

const LOOK_DEADZONE = 0.12;


lookJoystick.addEventListener(
    "pointerdown",
    function(e) {

        e.preventDefault();

        lookJoyActive = true;

        lookJoystick.setPointerCapture(
            e.pointerId
        );

        updateLookJoystick(e);
    }
);


lookJoystick.addEventListener(
    "pointermove",
    function(e) {

        if (!lookJoyActive) return;

        updateLookJoystick(e);
    }
);


lookJoystick.addEventListener(
    "pointerup",
    resetLookJoystick
);


lookJoystick.addEventListener(
    "pointercancel",
    resetLookJoystick
);


function resetLookJoystick() {

    lookJoyActive = false;

    lookJoyX = 0;
    lookJoyY = 0;

    lookStick.style.left = "50%";
    lookStick.style.top = "50%";
}


function updateLookJoystick(e) {

    const rect =
        lookJoystick.getBoundingClientRect();

    const centerX =
        rect.left + rect.width / 2;

    const centerY =
        rect.top + rect.height / 2;

    let x =
        e.clientX - centerX;

    let y =
        e.clientY - centerY;

    const max =
        rect.width / 2 - 26;

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

    let normalizedX =
        x / max;

    let normalizedY =
        y / max;


    /*
       Мёртвая зона.
    */

    if (
        Math.abs(normalizedX) <
        LOOK_DEADZONE
    ) {

        normalizedX = 0;
    }

    if (
        Math.abs(normalizedY) <
        LOOK_DEADZONE
    ) {

        normalizedY = 0;
    }


    /*
       Более плавная чувствительность.
       Возле центра очень медленно,
       дальше быстрее.
    */

    lookJoyX =
        Math.sign(normalizedX) *
        Math.pow(
            Math.abs(normalizedX),
            1.35
        );

    lookJoyY =
        Math.sign(normalizedY) *
        Math.pow(
            Math.abs(normalizedY),
            1.35
        );


    lookStick.style.left =
        "calc(50% + " + x + "px)";

    lookStick.style.top =
        "calc(50% + " + y + "px)";
}


/* =========================================================
   WALL
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
   PLAYER MOVEMENT
========================================================= */

function movePlayer(delta) {

    let forward =
        -moveJoyY;

    let strafe =
        moveJoyX;


    if (
        keys["KeyW"] ||
        keys["ArrowUp"]
    ) {

        forward += 1;
    }

    if (
        keys["KeyS"] ||
        keys["ArrowDown"]
    ) {

        forward -= 1;
    }

    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    ) {

        strafe += 1;
    }

    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ) {

        strafe -= 1;
    }


    const inputLength =
        Math.sqrt(
            forward * forward +
            strafe * strafe
        );


    if (inputLength > .05) {

        forward /= Math.max(inputLength, 1);
        strafe /= Math.max(inputLength, 1);


        /*
           Плавный разгон.
        */

        player.currentSpeed +=
            player.acceleration *
            delta / 1000;


        player.currentSpeed =
            Math.min(
                player.currentSpeed,
                player.maxSpeed
            );

    } else {

        /*
           Плавное торможение.
        */

        player.currentSpeed -=
            player.friction *
            delta / 1000;


        player.currentSpeed =
            Math.max(
                0,
                player.currentSpeed
            );

        return;
    }


    const speed =
        player.currentSpeed *
        delta / 1000;


    const dx =
        Math.cos(player.angle) *
        forward *
        speed -

        Math.sin(player.angle) *
        strafe *
        speed;


    const dy =
        Math.sin(player.angle) *
        forward *
        speed +

        Math.cos(player.angle) *
        strafe *
        speed;


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
   CAMERA
========================================================= */

function updateCamera(delta) {

    /*
       Горизонтальный поворот.
    */

    player.angle +=
        lookJoyX *
        LOOK_SPEED_X *
        delta / 1000;


    /*
       Вертикальный взгляд.
    */

    player.pitch +=
        lookJoyY *
        LOOK_SPEED_Y *
        delta / 1000;


    player.pitch =
        Math.max(
            -MAX_PITCH,

            Math.min(
                MAX_PITCH,
                player.pitch
            )
        );
}


/* =========================================================
   JUMP PHYSICS
========================================================= */

function updateJump(delta) {

    const dt =
        delta / 1000;


    /*
       Гравитация.
    */

    player.verticalVelocity -=
        player.gravity * dt;


    /*
       Изменяем высоту.
    */

    player.z +=
        player.verticalVelocity * dt;


    /*
       Определяем поверхность,
       на которой находится игрок.
    */

    let targetHeight = 0;


    /*
       Платформа считается поверхностью
       только если игрок находится над ней.
    */

    if (
        isOverPlatform(
            player.x,
            player.y
        )
    ) {

        /*
           На платформу можно попасть
           только сверху.
        */

        if (
            player.z <=
            platform.z + 0.08 &&

            player.verticalVelocity <= 0
        ) {

            targetHeight =
                platform.z;
        }
    }


    /*
       Если игрок падает и достиг
       поверхности — приземляемся.
    */

    if (
        player.z <= targetHeight
    ) {

        player.z =
            targetHeight;

        player.verticalVelocity =
            0;

        player.grounded =
            true;

        player.standingHeight =
            targetHeight;

    } else {

        player.grounded =
            false;
    }
}


/* =========================================================
   RAYCAST
========================================================= */

function castRay(angle) {

    const sin =
        Math.sin(angle);

    const cos =
        Math.cos(angle);

    let distance = 0;


    while (
        distance < MAX_DEPTH
    ) {

        distance += .025;

        const x =
            player.x +
            cos * distance;

        const y =
            player.y +
            sin * distance;


        if (
            isWall(x, y)
        ) {

            return distance;
        }
    }


    return MAX_DEPTH;
}


/* =========================================================
   WORLD
========================================================= */

function drawWorld() {

    const w =
        canvas.width;

    const h =
        canvas.height;


    /*
       Камера выше при прыжке.
    */

    const jumpCamera =
        player.z *
        h *
        .12;


    const horizon =
        h / 2 +

        player.pitch *
        h *
        .45 -

        jumpCamera;


    /*
       Небо.
    */

    ctx.fillStyle =
        "#101010";

    ctx.fillRect(
        0,
        0,
        w,
        Math.max(horizon, 0)
    );


    /*
       Пол.
    */

    ctx.fillStyle =
        "#252525";

    ctx.fillRect(
        0,
        Math.max(horizon, 0),
        w,
        h
    );


    const rays =
        Math.min(
            RAYS,
            Math.floor(w / 2)
        );


    const column =
        w / rays;


    for (
        let i = 0;
        i < rays;
        i++
    ) {

        const cameraX =
            i / rays - .5;


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
                .001
            );


        const wallTop =
            horizon -
            wallHeight / 2;


        const brightness =
            Math.max(
                25,
                180 -
                distance * 15
            );


        ctx.fillStyle =
            "rgb(" +
            brightness +
            "," +
            brightness +
            "," +
            brightness +
            ")";


        ctx.fillRect(
            i * column,
            wallTop,
            column + 1,
            wallHeight
        );
    }


    /*
       Платформа рисуется после пола,
       поэтому её видно в комнате.
    */

    drawPlatform();
}


/* =========================================================
   PLATFORM
========================================================= */

function drawPlatform() {

    const w =
        canvas.width;

    const h =
        canvas.height;


    const centerX =
        platform.x +
        platform.width / 2;

    const centerY =
        platform.y +
        platform.height / 2;


    const dx =
        centerX -
        player.x;

    const dy =
        centerY -
        player.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const angle =
        Math.atan2(dy, dx);


    const relative =
        normalizeAngle(
            angle -
            player.angle
        );


    if (
        Math.abs(relative) >
        FOV
    ) {

        return;
    }


    if (
        distance < .1
    ) {

        return;
    }


    const screenX =
        w / 2 +

        Math.tan(relative) *
        (w / 2) /
        Math.tan(FOV / 2);


    const scale =
        Math.min(
            h /
            distance *
            .12,
            1.2
        );


    const platformWidth =
        platform.width *
        h /
        distance *
        .55;


    const platformDepth =
        platform.height *
        h /
        distance *
        .45;


    const jumpCamera =
        player.z *
        h *
        .12;


    const horizon =
        h / 2 +

        player.pitch *
        h *
        .45 -

        jumpCamera;


    /*
       Высота платформы
       визуально поднимает её над полом.
    */

    const topY =
        horizon +
        platform.z *
        h /
        distance *
        .42;


    /*
       Верх.
    */

    ctx.fillStyle =
        "#555555";


    ctx.fillRect(

        screenX -
        platformWidth / 2,

        topY,

        platformWidth,

        platformDepth
    );


    /*
       Передняя стенка.
    */

    ctx.fillStyle =
        "#303030";


    ctx.fillRect(

        screenX -
        platformWidth / 2,

        topY +
        platformDepth,

        platformWidth,

        platform.thickness *
        h /
        distance *
        .25
    );


    /*
       Край.
    */

    ctx.strokeStyle =
        "#777777";

    ctx.lineWidth = 2;

    ctx.strokeRect(

        screenX -
        platformWidth / 2,

        topY,

        platformWidth,

        platformDepth
    );
}


/* =========================================================
   SPRITES
========================================================= */

function drawSprites() {

    for (const enemy of enemies) {

        if (enemy.alive) {

            drawEnemy(enemy);
        }
    }

    drawLever();
}


/* =========================================================
   ENEMY
========================================================= */

function drawEnemy(enemy) {

    const dx =
        enemy.x -
        player.x;

    const dy =
        enemy.y -
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

    const relative =
        normalizeAngle(
            angle -
            player.angle
        );


    if (
        Math.abs(relative) >
        FOV / 2
    ) {

        return;
    }


    const wallDistance =
        castRay(
            player.angle +
            relative
        );


    if (
        distance >
        wallDistance
    ) {

        return;
    }


    const w =
        canvas.width;

    const h =
        canvas.height;


    const jumpCamera =
        player.z *
        h *
        .12;


    const horizon =
        h / 2 +

        player.pitch *
        h *
        .45 -

        jumpCamera;


    const screenX =
        w / 2 +

        Math.tan(relative) *
        (w / 2) /
        Math.tan(FOV / 2);


    const size =
        h /
        Math.max(distance, .1);


    const scale =
        Math.min(
            size * .003,
            1.5
        );


    const bodyHeight =
        170 * scale;


    const headSize =
        32 * scale;


    const centerY =
        horizon;


    ctx.fillStyle =
        enemy.hit > 0
            ? "#ffffff"
            : "#888888";


    ctx.fillRect(
        screenX -
        35 * scale,

        centerY,

        70 * scale,

        bodyHeight
    );


    ctx.beginPath();


    ctx.arc(
        screenX,

        centerY -
        35 * scale,

        headSize,

        0,
        Math.PI * 2
    );


    ctx.fill();


    /*
       HP.
    */

    ctx.fillStyle =
        "#111111";


    ctx.fillRect(
        screenX -
        40 * scale,

        centerY -
        80 * scale,

        80 * scale,

        7
    );


    ctx.fillStyle =
        "#d00000";


    ctx.fillRect(
        screenX -
        40 * scale,

        centerY -
        80 * scale,

        80 *
        scale *
        Math.max(
            enemy.hp / 100,
            0
        ),

        7
    );
}


/* =========================================================
   LEVER
========================================================= */

function drawLever() {

    const dx =
        lever.x -
        player.x;

    const dy =
        lever.y -
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


    const relative =
        normalizeAngle(
            angle -
            player.angle
        );


    if (
        Math.abs(relative) >
        FOV / 2
    ) {

        return;
    }


    const wallDistance =
        castRay(
            player.angle +
            relative
        );


    if (
        distance >
        wallDistance
    ) {

        return;
    }


    const w =
        canvas.width;

    const h =
        canvas.height;


    const jumpCamera =
        player.z *
        h *
        .12;


    const horizon =
        h / 2 +

        player.pitch *
        h *
        .45 -

        jumpCamera;


    const x =
        w / 2 +

        Math.tan(relative) *
        (w / 2) /
        Math.tan(FOV / 2);


    const scale =
        Math.min(
            h /
            Math.max(distance, .1) *
            .004,

            1.5
        );


    const y =
        horizon +
        50 * scale;


    ctx.fillStyle =
        "#333333";


    ctx.fillRect(
        x - 18 * scale,
        y,
        36 * scale,
        65 * scale
    );


    ctx.strokeStyle =
        "#777777";


    ctx.lineWidth =
        Math.max(
            2,
            5 * scale
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
}


/* =========================================================
   WEAPON
========================================================= */

function drawWeapon() {

    const w =
        canvas.width;

    const h =
        canvas.height;


    let recoil = 0;


    if (
        weaponAnimation > 0
    ) {

        recoil =
            Math.sin(
                (
                    1 -
                    weaponAnimation /
                    300
                ) *
                Math.PI
            );
    }


    const cameraY =
        player.pitch *
        h *
        .18;


    const jumpY =
        player.z *
        h *
        .06;


    if (weapon === "fists") {

        drawFists(
            w,
            h,
            recoil,
            cameraY,
            jumpY
        );

    } else if (
        weapon === "pistol"
    ) {

        drawPistol(
            w,
            h,
            recoil,
            cameraY,
            jumpY
        );

    } else {

        drawShotgun(
            w,
            h,
            recoil,
            cameraY,
            jumpY
        );
    }
}


/* =========================================================
   FISTS
========================================================= */

function drawFists(
    w,
    h,
    punch,
    cameraY,
    jumpY
) {

    const size =
        Math.min(w, h) * .34;


    const y =
        h * .68 -
        cameraY -
        jumpY -
        punch * h * .12;


    const leftX =
        w * .04 +
        punch * w * .09;


    const rightX =
        w * .62 -
        punch * w * .09;


    if (leftFistReady) {

        ctx.save();

        ctx.translate(
            leftX + size / 2,
            y + size / 2
        );

        ctx.rotate(
            -punch * .12
        );

        ctx.drawImage(
            leftFist,
            -size / 2,
            -size / 2,
            size,
            size
        );

        ctx.restore();

    } else {

        drawFallbackFist(
            leftX + size / 2,
            y + size * .65,
            size * .35,
            -.1
        );
    }


    if (rightFistReady) {

        ctx.save();

        ctx.translate(
            rightX + size / 2,
            y + size / 2
        );

        ctx.rotate(
            punch * .12
        );

        ctx.drawImage(
            rightFist,
            -size / 2,
            -size / 2,
            size,
            size
        );

        ctx.restore();

    } else {

        drawFallbackFist(
            rightX + size / 2,
            y + size * .65,
            size * .35,
            .1
        );
    }
}


/* =========================================================
   FALLBACK FIST
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

    ctx.fillStyle =
        "#b97858";


    ctx.fillRect(
        -size / 2,
        -size / 2,
        size,
        size
    );


    ctx.fillStyle =
        "#d59a73";


    ctx.beginPath();

    ctx.arc(
        0,
        -size * .25,
        size * .55,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


/* =========================================================
   PISTOL
========================================================= */

function drawPistol(
    w,
    h,
    recoil,
    cameraY,
    jumpY
) {

    const cx =
        w / 2;


    ctx.save();


    ctx.translate(
        0,
        recoil * 35 -
        cameraY -
        jumpY
    );


    ctx.fillStyle =
        "#c88c68";


    ctx.fillRect(
        cx - 28,
        h * .78,
        56,
        130
    );


    ctx.fillStyle =
        "#222222";


    ctx.fillRect(
        cx - 45,
        h * .68,
        90,
        65
    );


    ctx.fillStyle =
        "#111111";


    ctx.fillRect(
        cx - 42,
        h * .64,
        84,
        35
    );


    ctx.fillStyle =
        "#151515";


    ctx.fillRect(
        cx - 12,
        h * .55,
        24,
        100
    );


    if (muzzleFlash > 0) {

        ctx.fillStyle =
            "#ffd34d";


        ctx.beginPath();

        ctx.moveTo(
            cx,
            h * .51
        );

        ctx.lineTo(
            cx - 25,
            h * .43
        );

        ctx.lineTo(
            cx,
            h * .46
        );

        ctx.lineTo(
            cx + 25,
            h * .43
        );

        ctx.closePath();

        ctx.fill();
    }


    ctx.restore();
}


/* =========================================================
   SHOTGUN
========================================================= */

function drawShotgun(
    w,
    h,
    recoil,
    cameraY,
    jumpY
) {

    const cx =
        w / 2;


    ctx.save();


    ctx.translate(
        0,
        recoil * 45 -
        cameraY -
        jumpY
    );


    ctx.fillStyle =
        "#181818";


    ctx.fillRect(
        cx - 45,
        h * .67,
        90,
        h * .34
    );


    ctx.fillStyle =
        "#292929";


    ctx.fillRect(
        cx - 28,
        h * .58,
        56,
        h * .38
    );


    ctx.fillStyle =
        "#080808";


    ctx.beginPath();

    ctx.arc(
        cx,
        h * .58,
        28,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#000000";


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


    ctx.fillStyle =
        "#75482d";


    ctx.fillRect(
        cx - 70,
        h * .82,
        140,
        35
    );


    ctx.restore();
}


/* =========================================================
   ANGLE
========================================================= */

function normalizeAngle(angle) {

    while (angle > Math.PI) {

        angle -=
            Math.PI * 2;
    }


    while (angle < -Math.PI) {

        angle +=
            Math.PI * 2;
    }


    return angle;
}


/* =========================================================
   UPDATE
========================================================= */

let lastTime =
    performance.now();


function update(delta) {

    movePlayer(delta);

    updateCamera(delta);

    updateJump(delta);


    if (weaponAnimation > 0) {

        weaponAnimation -= delta;

        if (weaponAnimation < 0) {
            weaponAnimation = 0;
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

            enemy.hit -=
                delta / 100;

            if (enemy.hit < 0) {
                enemy.hit = 0;
            }
        }
    }


    if (styleVisible) {

        styleTimer -= delta;

        if (styleTimer <= 0) {

            hideStyle();
        }
    }
}


/* =========================================================
   GAME LOOP
========================================================= */

function loop(time) {

    const delta =
        Math.min(
            50,
            Math.max(
                0,
                time - lastTime
            )
        );


    lastTime = time;


    update(delta);

    drawWorld();

    drawSprites();

    drawWeapon();


    requestAnimationFrame(loop);
}


/* =========================================================
   START
========================================================= */

player.currentSpeed = 0;

styleBox.style.display = "none";

requestAnimationFrame(loop);
