"use strict";


/* =========================================================
   CANVAS
========================================================= */

const canvas =
    document.getElementById("game");

const ctx =
    canvas.getContext("2d");


const joystick =
    document.getElementById("joystick");

const stick =
    document.getElementById("stick");


const shootButton =
    document.getElementById("shootButton");


const interactButton =
    document.getElementById(
        "interactButton"
    );


const weaponButton =
    document.getElementById(
        "weaponButton"
    );


const weaponName =
    document.getElementById(
        "weaponName"
    );


const message =
    document.getElementById(
        "message"
    );


/* =========================================================
   РАЗМЕР CANVAS
========================================================= */

function resize() {

    canvas.width =
        Math.max(
            1,
            Math.floor(
                window.innerWidth
            )
        );

    canvas.height =
        Math.max(
            1,
            Math.floor(
                window.innerHeight
            )
        );
}


window.addEventListener(
    "resize",
    resize
);

resize();


/* =========================================================
   PNG КУЛАКОВ
========================================================= */

const leftFist =
    new Image();

const rightFist =
    new Image();


let leftFistReady = false;
let rightFistReady = false;


leftFist.onload =
    function () {

        leftFistReady = true;
    };


rightFist.onload =
    function () {

        rightFistReady = true;
    };


leftFist.onerror =
    function () {

        console.log(
            "left_fist.png не найден. Используется запасной кулак."
        );
    };


rightFist.onerror =
    function () {

        console.log(
            "right_fist.png не найден. Используется запасной кулак."
        );
    };


/*
   ВАЖНО:

   Если PNG нет, это НЕ ломает игру.
*/

leftFist.src =
    "textures/left_fist.png";

rightFist.src =
    "textures/right_fist.png";


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


const MAP_W =
    map[0].length;

const MAP_H =
    map.length;


/* =========================================================
   ИГРОК
========================================================= */

const player = {

    x: 6,

    y: 8,

    angle: 0,

    speed: 2.7,

    radius: .18
};


/* =========================================================
   RAYCASTING
========================================================= */

const FOV =
    Math.PI / 3;

const MAX_DEPTH =
    20;

const RAYS =
    240;


/* =========================================================
   КЛАВИАТУРА
========================================================= */

const keys = {};


window.addEventListener(
    "keydown",
    function (e) {

        keys[e.code] = true;


        if (
            e.code === "Space"
        ) {

            e.preventDefault();

            shoot();
        }


        if (
            e.code === "KeyE"
        ) {

            interact();
        }


        if (
            e.code === "KeyQ"
        ) {

            switchWeapon();
        }
    }
);


window.addEventListener(
    "keyup",
    function (e) {

        keys[e.code] = false;
    }
);


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

    y: 2
};


/* =========================================================
   ОРУЖИЕ
========================================================= */

let weapon =
    "fists";


let weaponAnimation =
    0;


let muzzleFlash =
    0;


/* =========================================================
   ПЕРЕКЛЮЧЕНИЕ ОРУЖИЯ
========================================================= */

weaponButton.addEventListener(
    "pointerdown",
    function (e) {

        e.preventDefault();

        switchWeapon();
    }
);


function switchWeapon() {

    if (
        weapon === "fists"
    ) {

        weapon = "pistol";

        weaponName.textContent =
            "ПИСТОЛЕТ";

    }

    else if (
        weapon === "pistol"
    ) {

        weapon = "shotgun";

        weaponName.textContent =
            "ДРОБОВИК";

    }

    else {

        weapon = "fists";

        weaponName.textContent =
            "КУЛАКИ";
    }


    weaponAnimation = 0;
}


/* =========================================================
   СТРЕЛЬБА
========================================================= */

shootButton.addEventListener(
    "pointerdown",
    function (e) {

        e.preventDefault();

        shoot();
    }
);


function shoot() {

    if (
        weaponAnimation > 0
    ) {

        return;
    }


    if (
        weapon === "fists"
    ) {

        weaponAnimation = 280;

        punch();

    }

    else if (
        weapon === "pistol"
    ) {

        weaponAnimation = 220;

        muzzleFlash = 80;

        pistol();

    }

    else {

        weaponAnimation = 300;

        shotgun();
    }
}


/* =========================================================
   КУЛАК
========================================================= */

function punch() {

    const target =
        getTargetEnemy(2);


    if (!target) {

        showMessage(
            "ПРОМАХ"
        );

        return;
    }


    target.hp -= 20;

    target.hit = 1;


    if (
        target.hp <= 0
    ) {

        target.hp = 0;

        target.alive = false;

        showMessage(
            "МАНЕКЕН ПОВАЛЕН"
        );

    }

    else {

        showMessage(
            "УДАР"
        );
    }
}


/* =========================================================
   ПИСТОЛЕТ
========================================================= */

function pistol() {

    const target =
        getTargetEnemy(12);


    if (!target) {

        showMessage(
            "ПРОМАХ"
        );

        return;
    }


    target.hp -= 25;

    target.hit = 1;


    if (
        target.hp <= 0
    ) {

        target.hp = 0;

        target.alive = false;

        showMessage(
            "МАНЕКЕН ПОВАЛЕН"
        );

    }

    else {

        showMessage(
            "ПОПАДАНИЕ"
        );
    }
}


/* =========================================================
   ДРОБОВИК
========================================================= */

function shotgun() {

    const spread = [

        -.08,

        -.04,

        0,

        .04,

        .08

    ];


    let hit = false;


    for (
        const offset of spread
    ) {

        const target =
            getTargetEnemy(
                8,
                offset
            );


        if (!target) {
            continue;
        }


        target.hp -= 20;

        target.hit = 1;

        hit = true;


        if (
            target.hp <= 0
        ) {

            target.hp = 0;

            target.alive = false;
        }
    }


    showMessage(
        hit
            ? "ПОПАДАНИЕ"
            : "ПРОМАХ"
    );
}


/* =========================================================
   ПОИСК ВРАГА
========================================================= */

function getTargetEnemy(
    maxDistance,
    offset = 0
) {

    let result = null;

    let closest =
        Infinity;


    for (
        const enemy of enemies
    ) {

        if (
            !enemy.alive
        ) {

            continue;
        }


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


        if (
            distance >
            maxDistance
        ) {

            continue;
        }


        const angle =
            Math.atan2(
                dy,
                dx
            );


        const difference =
            normalizeAngle(
                angle -
                player.angle -
                offset
            );


        if (
            Math.abs(
                difference
            ) < .13
        ) {

            if (
                distance <
                closest
            ) {

                closest =
                    distance;

                result =
                    enemy;
            }
        }
    }


    return result;
}


/* =========================================================
   РЫЧАГ
========================================================= */

interactButton.addEventListener(
    "pointerdown",
    function (e) {

        e.preventDefault();

        interact();
    }
);


function interact() {

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


    if (
        distance > 1.5
    ) {

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

    const points = [

        {x:3,y:3},

        {x:8,y:3},

        {x:3,y:8},

        {x:8,y:8},

        {x:6,y:5}

    ];


    for (
        const point of points
    ) {

        let occupied =
            false;


        for (
            const enemy of enemies
        ) {

            if (
                !enemy.alive
            ) {

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
                ) < .8
            ) {

                occupied =
                    true;

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


            showMessage(
                "НОВЫЙ МАНЕКЕН"
            );


            return;
        }
    }


    showMessage(
        "НЕТ СВОБОДНОГО МЕСТА"
    );
}


/* =========================================================
   ДЖОЙСТИК
========================================================= */

let joystickActive =
    false;


let joyX = 0;
let joyY = 0;


joystick.addEventListener(
    "pointerdown",
    function (e) {

        e.preventDefault();

        joystickActive =
            true;


        try {

            joystick.setPointerCapture(
                e.pointerId
            );

        } catch (_) {}


        updateJoystick(e);
    }
);


joystick.addEventListener(
    "pointermove",
    function (e) {

        if (
            !joystickActive
        ) {

            return;
        }


        updateJoystick(e);
    }
);


joystick.addEventListener(
    "pointerup",
    resetJoystick
);


joystick.addEventListener(
    "pointercancel",
    resetJoystick
);


function resetJoystick() {

    joystickActive =
        false;


    joyX = 0;

    joyY = 0;


    stick.style.left =
        "50%";

    stick.style.top =
        "50%";
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
        rect.width / 2 -
        28;


    const length =
        Math.sqrt(
            x * x +
            y * y
        );


    if (
        length > max
    ) {

        x =
            x / length *
            max;


        y =
            y / length *
            max;
    }


    joyX =
        x / max;


    joyY =
        y / max;


    stick.style.left =
        `calc(50% + ${x}px)`;


    stick.style.top =
        `calc(50% + ${y}px)`;
}


/* =========================================================
   ПОВОРОТ КАМЕРЫ
========================================================= */

let lookActive =
    false;


let lastLookX =
    0;


canvas.addEventListener(
    "pointerdown",
    function (e) {

        if (
            e.clientX <
            window.innerWidth *
            .45
        ) {

            return;
        }


        lookActive =
            true;


        lastLookX =
            e.clientX;


        try {

            canvas.setPointerCapture(
                e.pointerId
            );

        } catch (_) {}
    }
);


canvas.addEventListener(
    "pointermove",
    function (e) {

        if (
            !lookActive
        ) {

            return;
        }


        const dx =
            e.clientX -
            lastLookX;


        player.angle +=
            dx * .006;


        lastLookX =
            e.clientX;
    }
);


canvas.addEventListener(
    "pointerup",
    function () {

        lookActive =
            false;
    }
);


canvas.addEventListener(
    "pointercancel",
    function () {

        lookActive =
            false;
    }
);


/* =========================================================
   СТЕНЫ
========================================================= */

function isWall(x, y) {

    const mx =
        Math.floor(x);


    const my =
        Math.floor(y);


    if (
        mx < 0 ||
        my < 0 ||
        mx >= MAP_W ||
        my >= MAP_H
    ) {

        return true;
    }


    return (
        map[my][mx] === "#"
    );
}


/* =========================================================
   ДВИЖЕНИЕ
========================================================= */

function movePlayer(delta) {

    const forward =
        -joyY;


    const strafe =
        joyX;


    let keyboardForward =
        0;


    let keyboardStrafe =
        0;


    if (
        keys["KeyW"] ||
        keys["ArrowUp"]
    ) {

        keyboardForward++;
    }


    if (
        keys["KeyS"] ||
        keys["ArrowDown"]
    ) {

        keyboardForward--;
    }


    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    ) {

        keyboardStrafe++;
    }


    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ) {

        keyboardStrafe--;
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


    if (
        length <= 0
    ) {

        return;
    }


    const nf =
        f /
        Math.max(
            length,
            1
        );


    const ns =
        s /
        Math.max(
            length,
            1
        );


    const speed =
        player.speed *
        delta /
        1000;


    const dx =
        Math.cos(
            player.angle
        ) *
        nf *
        speed -

        Math.sin(
            player.angle
        ) *
        ns *
        speed;


    const dy =
        Math.sin(
            player.angle
        ) *
        nf *
        speed +

        Math.cos(
            player.angle
        ) *
        ns *
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

        player.x +=
            dx;
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

        player.y +=
            dy;
    }
}


/* =========================================================
   RAY
========================================================= */

function castRay(angle) {

    const sin =
        Math.sin(angle);


    const cos =
        Math.cos(angle);


    let distance =
        0;


    const step =
        .025;


    while (
        distance <
        MAX_DEPTH
    ) {

        distance +=
            step;


        const x =
            player.x +
            cos *
            distance;


        const y =
            player.y +
            sin *
            distance;


        if (
            isWall(x,y)
        ) {

            return distance;
        }
    }


    return MAX_DEPTH;
}


/* =========================================================
   МИР
========================================================= */

function drawWorld() {

    const w =
        canvas.width;


    const h =
        canvas.height;


    /* Небо */

    ctx.fillStyle =
        "#101010";


    ctx.fillRect(
        0,
        0,
        w,
        h / 2
    );


    /* Пол */

    ctx.fillStyle =
        "#252525";


    ctx.fillRect(
        0,
        h / 2,
        w,
        h / 2
    );


    const rayCount =
        Math.min(
            RAYS,
            Math.max(
                80,
                Math.floor(
                    w / 2
                )
            )
        );


    const columnWidth =
        w /
        rayCount;


    for (
        let i = 0;
        i < rayCount;
        i++
    ) {

        const cameraX =
            i /
            rayCount -
            .5;


        const rayAngle =
            player.angle +
            cameraX *
            FOV;


        let distance =
            castRay(
                rayAngle
            );


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
            i *
            columnWidth,

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


    for (
        const enemy of enemies
    ) {

        if (
            !enemy.alive
        ) {

            continue;
        }


        sprites.push({

            type:
                "enemy",

            x:
                enemy.x,

            y:
                enemy.y,

            object:
                enemy
        });
    }


    sprites.push({

        type:
            "lever",

        x:
            lever.x,

        y:
            lever.y,

        object:
            lever
    });


    sprites.sort(
        function (a,b) {

            return (
                distanceToPlayer(b) -
                distanceToPlayer(a)
            );
        }
    );


    for (
        const sprite of sprites
    ) {

        drawSprite(
            sprite
        );
    }
}


/* =========================================================
   РАССТОЯНИЕ
========================================================= */

function distanceToPlayer(
    sprite
) {

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
   СПРАЙТ
========================================================= */

function drawSprite(
    sprite
) {

    const w =
        canvas.width;


    const h =
        canvas.height;


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
        Math.abs(
            relativeAngle
        ) >
        FOV * .65
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
        wallDistance +
        .1
    ) {

        return;
    }


    const screenX =
        w / 2 +

        Math.tan(
            relativeAngle
        ) *

        (w / 2) /

        Math.tan(
            FOV / 2
        );


    const size =
        h /
        Math.max(
            distance,
            .1
        );


    if (
        sprite.type ===
        "enemy"
    ) {

        drawEnemy(
            screenX,
            h / 2,
            size,
            sprite.object
        );
    }


    if (
        sprite.type ===
        "lever"
    ) {

        drawLever(
            screenX,
            h / 2,
            size
        );
    }
}


/* =========================================================
   МАНЕКЕН
========================================================= */

function drawEnemy(
    x,
    centerY,
    size,
    enemy
) {

    const scale =
        Math.min(
            size * .003,
            1.5
        );


    const bodyHeight =
        170 *
        scale;


    const headSize =
        32 *
        scale;


    ctx.fillStyle =
        enemy.hit > 0
            ? "#fff"
            : "#888";


    ctx.fillRect(

        x -
        35 *
        scale,

        centerY,

        70 *
        scale,

        bodyHeight
    );


    ctx.beginPath();


    ctx.arc(

        x,

        centerY -
        35 *
        scale,

        headSize,

        0,

        Math.PI * 2
    );


    ctx.fill();


    ctx.fillRect(

        x -
        65 *
        scale,

        centerY +
        5 *
        scale,

        22 *
        scale,

        80 *
        scale
    );


    ctx.fillRect(

        x +
        43 *
        scale,

        centerY +
        5 *
        scale,

        22 *
        scale,

        80 *
        scale
    );


    ctx.fillRect(

        x -
        28 *
        scale,

        centerY +
        bodyHeight,

        20 *
        scale,

        80 *
        scale
    );


    ctx.fillRect(

        x +
        8 *
        scale,

        centerY +
        bodyHeight,

        20 *
        scale,

        80 *
        scale
    );


    /* HP */

    const barWidth =
        80 *
        scale;


    ctx.fillStyle =
        "#111";


    ctx.fillRect(

        x -
        barWidth / 2,

        centerY -
        80 *
        scale,

        barWidth,

        8
    );


    ctx.fillStyle =
        "#d00000";


    ctx.fillRect(

        x -
        barWidth / 2,

        centerY -
        80 *
        scale,

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

function drawLever(
    x,
    centerY,
    size
) {

    const scale =
        Math.min(
            size * .004,
            1.5
        );


    const y =
        centerY +
        50 *
        scale;


    ctx.fillStyle =
        "#333";


    ctx.fillRect(

        x -
        18 *
        scale,

        y,

        36 *
        scale,

        65 *
        scale
    );


    ctx.strokeStyle =
        "#777";


    ctx.lineWidth =
        Math.max(
            5 *
            scale,

            2
        );


    ctx.beginPath();


    ctx.moveTo(

        x,

        y +
        10 *
        scale
    );


    ctx.lineTo(

        x +
        25 *
        scale,

        y -
        30 *
        scale
    );


    ctx.stroke();


    ctx.fillStyle =
        "#c33";


    ctx.beginPath();


    ctx.arc(

        x +
        25 *
        scale,

        y -
        30 *
        scale,

        9 *
        scale,

        0,

        Math.PI * 2
    );


    ctx.fill();
}


/* =========================================================
   ОРУЖИЕ
========================================================= */

function drawWeapon() {

    const w =
        canvas.width;


    const h =
        canvas.height;


    let recoil =
        0;


    if (
        weaponAnimation >
        0
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


    if (
        weapon ===
        "fists"
    ) {

        drawFists(
            w,
            h,
            recoil
        );

    }

    else if (
        weapon ===
        "pistol"
    ) {

        drawPistol(
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


/* =========================================================
   КУЛАКИ
========================================================= */

function drawFists(
    w,
    h,
    punch
) {

    const size =
        Math.min(
            w,
            h
        ) *
        .34;


    const leftX =
        w *
        .04 +
        punch *
        w *
        .09;


    const rightX =
        w *
        .62 -
        punch *
        w *
        .09;


    const y =
        h *
        .67 -
        punch *
        h *
        .12;


    /*
       ЛЕВЫЙ PNG
    */

    if (
        leftFistReady
    ) {

        ctx.save();


        ctx.globalAlpha =
            1;


        ctx.translate(

            leftX +
            size / 2,

            y +
            size / 2
        );


        ctx.rotate(
            -punch *
            .12
        );


        ctx.drawImage(

            leftFist,

            -size / 2,

            -size / 2,

            size,

            size
        );


        ctx.restore();

    }

    else {

        drawFallbackFist(

            leftX +
            size / 2,

            y +
            size * .65,

            size *
            .35,

            -.1
        );
    }


    /*
       ПРАВЫЙ PNG
    */

    if (
        rightFistReady
    ) {

        ctx.save();


        ctx.globalAlpha =
            1;


        ctx.translate(

            rightX +
            size / 2,

            y +
            size / 2
        );


        ctx.rotate(
            punch *
            .12
        );


        ctx.drawImage(

            rightFist,

            -size / 2,

            -size / 2,

            size,

            size
        );


        ctx.restore();

    }

    else {

        drawFallbackFist(

            rightX +
            size / 2,

            y +
            size * .65,

            size *
            .35,

            .1
        );
    }
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


    ctx.translate(
        x,
        y
    );


    ctx.rotate(
        rotation
    );


    ctx.fillStyle =
        "#b97858";


    ctx.fillRect(

        -size * .5,

        -size * .2,

        size,

        size * .7
    );


    ctx.fillStyle =
        "#d59a73";


    ctx.beginPath();


    if (
        ctx.roundRect
    ) {

        ctx.roundRect(

            -size * .65,

            -size * .7,

            size * 1.3,

            size * .7,

            size * .15
        );

    } else {

        ctx.rect(

            -size * .65,

            -size * .7,

            size * 1.3,

            size * .7
        );
    }


    ctx.fill();


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

    const cx =
        w / 2;


    ctx.save();


    ctx.translate(
        0,
        recoil * 35
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
        "#222";


    ctx.fillRect(

        cx - 45,

        h * .68,

        90,

        65
    );


    ctx.fillStyle =
        "#111";


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


    if (
        muzzleFlash >
        0
    ) {

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
   ДРОБОВИК
========================================================= */

function drawShotgun(
    w,
    h,
    recoil
) {

    const cx =
        w / 2;


    ctx.save();


    ctx.translate(
        0,
        recoil * 45
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
        "#000";


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
   УГОЛ
========================================================= */

function normalizeAngle(
    angle
) {

    while (
        angle > Math.PI
    ) {

        angle -=
            Math.PI * 2;
    }


    while (
        angle < -Math.PI
    ) {

        angle +=
            Math.PI * 2;
    }


    return angle;
}


/* =========================================================
   СООБЩЕНИЯ
========================================================= */

let messageTimer =
    0;


function showMessage(
    text
) {

    message.textContent =
        text;


    message.style.opacity =
        "1";


    messageTimer =
        900;
}


/* =========================================================
   UPDATE
========================================================= */

let lastTime =
    performance.now();


function update(
    delta
) {

    movePlayer(
        delta
    );


    if (
        weaponAnimation >
        0
    ) {

        weaponAnimation -=
            delta;


        if (
            weaponAnimation <
            0
        ) {

            weaponAnimation =
                0;
        }
    }


    if (
        muzzleFlash >
        0
    ) {

        muzzleFlash -=
            delta;


        if (
            muzzleFlash <
            0
        ) {

            muzzleFlash =
                0;
        }
    }


    for (
        const enemy of enemies
    ) {

        if (
            enemy.hit >
            0
        ) {

            enemy.hit -=
                delta / 100;


            if (
                enemy.hit <
                0
            ) {

                enemy.hit =
                    0;
            }
        }
    }


    if (
        messageTimer >
        0
    ) {

        messageTimer -=
            delta;

    } else {

        message.style.opacity =
            "0";
    }
}


/* =========================================================
   ГЛАВНЫЙ ЦИКЛ
========================================================= */

let lastErrorShown =
    false;


function loop(
    time
) {

    try {

        const delta =
            Math.min(

                Math.max(
                    time -
                    lastTime,

                    0
                ),

                50
            );


        lastTime =
            time;


        update(
            delta
        );


        drawWorld();

        drawSprites();

        drawWeapon();


    } catch (error) {

        /*
           Если ошибка всё-таки возникнет,
           она будет видна в консоли браузера,
           а не будет молча ломать цикл.
        */

        if (
            !lastErrorShown
        ) {

            console.error(
                "ОШИБКА ИГРЫ:",
                error
            );

            lastErrorShown =
                true;
        }
    }


    requestAnimationFrame(
        loop
    );
}


/* =========================================================
   ЗАПУСК
========================================================= */

requestAnimationFrame(
    loop
);
