"use strict";


/* =========================================================
   CANVAS
========================================================= */

const canvas =
    document.getElementById("game");

const ctx =
    canvas.getContext("2d");


function resizeCanvas() {

    canvas.width =
        Math.max(
            320,
            window.innerWidth
        );

    canvas.height =
        Math.max(
            240,
            window.innerHeight
        );
}


window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =========================================================
   UI
========================================================= */

const joystick =
    document.getElementById(
        "joystick"
    );

const stick =
    document.getElementById(
        "stick"
    );

const shootButton =
    document.getElementById(
        "shootButton"
    );

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


const styleBox =
    document.getElementById(
        "styleBox"
    );

const styleRank =
    document.getElementById(
        "styleRank"
    );

const styleMultiplier =
    document.getElementById(
        "styleMultiplier"
    );

const stylePoints =
    document.getElementById(
        "stylePoints"
    );


/* =========================================================
   PNG
========================================================= */

const leftFist =
    new Image();

const rightFist =
    new Image();


let leftFistReady =
    false;

let rightFistReady =
    false;


leftFist.onload =
    function () {

        leftFistReady =
            true;
    };


rightFist.onload =
    function () {

        rightFistReady =
            true;
    };


/*
   Если PNG отсутствует,
   ничего страшного.
*/

leftFist.onerror =
    function () {

        leftFistReady =
            false;
    };


rightFist.onerror =
    function () {

        rightFistReady =
            false;
    };


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
   RENDER
========================================================= */

const FOV =
    Math.PI / 3;

const MAX_DEPTH =
    20;

const RAYS =
    220;


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

    x: 9,

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
   КЛАВИАТУРА
========================================================= */

const keys = {};


window.addEventListener(
    "keydown",
    function (e) {

        keys[e.code] =
            true;


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

        keys[e.code] =
            false;
    }
);


/* =========================================================
   STYLE
========================================================= */

let stylePoints = 0;

let styleCombo = 0;

let styleMultiplier = 1;

let lastStyleAction = "";

let styleVisible = false;

let styleTimer = 0;


/*
   10 секунд.
*/

const STYLE_TIMEOUT =
    10000;


/* =========================================================
   STYLE RANK
========================================================= */

function getStyleRank() {

    if (
        stylePoints >= 1800
    ) {

        return "SSS";
    }

    if (
        stylePoints >= 1200
    ) {

        return "SS";
    }

    if (
        stylePoints >= 750
    ) {

        return "S";
    }

    if (
        stylePoints >= 450
    ) {

        return "A";
    }

    if (
        stylePoints >= 250
    ) {

        return "B";
    }

    if (
        stylePoints >= 100
    ) {

        return "C";
    }

    return "D";
}


/* =========================================================
   ДОБАВИТЬ STYLE
========================================================= */

function addStyle(
    amount,
    action
) {

    /*
       Если это новое действие —
       увеличиваем комбо.
    */

    if (
        action !==
        lastStyleAction
    ) {

        styleCombo++;

    } else {

        /*
           Повторение одного действия
           менее эффективно.
        */

        amount *= .5;
    }


    styleMultiplier =
        Math.min(
            8,
            1 +
            Math.floor(
                styleCombo / 2
            )
        );


    const gained =
        Math.max(
            1,
            Math.round(
                amount *
                styleMultiplier
            )
        );


    stylePoints +=
        gained;


    stylePoints =
        Math.min(
            stylePoints,
            99999
        );


    lastStyleAction =
        action;


    /*
       Самое главное:
       после КАЖДОГО стильного
       действия таймер снова
       становится 10 секунд.
    */

    styleTimer =
        STYLE_TIMEOUT;


    /*
       Style становится видимым
       только здесь.
    */

    styleVisible =
        true;


    styleBox.style.display =
        "block";


    updateStyleUI();
}


/* =========================================================
   UI STYLE
========================================================= */

function updateStyleUI() {

    styleRank.textContent =
        getStyleRank();


    styleMultiplier.textContent =
        "×" +
        styleMultiplier;


    stylePoints.textContent =
        Math.floor(
            stylePoints
        );
}


/* =========================================================
   ПОЛНОСТЬЮ УБРАТИТЬ STYLE
========================================================= */

function hideStyle() {

    styleVisible =
        false;


    stylePoints =
        0;


    styleCombo =
        0;


    styleMultiplier =
        1;


    lastStyleAction =
        "";


    styleTimer =
        0;


    styleBox.style.display =
        "none";
}


/* =========================================================
   ОРУЖИЕ
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

        weapon =
            "pistol";

        weaponName.textContent =
            "ПИСТОЛЕТ";

    }

    else if (
        weapon === "pistol"
    ) {

        weapon =
            "shotgun";

        weaponName.textContent =
            "ДРОБОВИК";

    }

    else {

        weapon =
            "fists";

        weaponName.textContent =
            "КУЛАКИ";
    }
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

        weaponAnimation =
            280;

        punch();

    }

    else if (
        weapon === "pistol"
    ) {

        weaponAnimation =
            220;

        muzzleFlash =
            80;

        pistol();

    }

    else {

        weaponAnimation =
            300;

        shotgun();
    }
}


/* =========================================================
   КУЛАК
========================================================= */

function punch() {

    const target =
        getTargetEnemy(
            2
        );


    if (!target) {

        return;
    }


    target.hp -=
        20;

    target.hit =
        1;


    addStyle(
        15,
        "punch"
    );


    if (
        target.hp <= 0
    ) {

        target.hp =
            0;

        target.alive =
            false;


        addStyle(
            50,
            "kill"
        );
    }
}


/* =========================================================
   ПИСТОЛЕТ
========================================================= */

function pistol() {

    const target =
        getTargetEnemy(
            12
        );


    if (!target) {

        return;
    }


    target.hp -=
        25;

    target.hit =
        1;


    addStyle(
        20,
        "pistol"
    );


    if (
        target.hp <= 0
    ) {

        target.hp =
            0;

        target.alive =
            false;


        addStyle(
            50,
            "kill"
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


        target.hp -=
            20;

        target.hit =
            1;


        addStyle(
            25,
            "shotgun"
        );


        if (
            target.hp <= 0
        ) {

            target.hp =
                0;

            target.alive =
                false;


            addStyle(
                50,
                "kill"
            );
        }
    }
}


/* =========================================================
   ПОИСК ЦЕЛИ
========================================================= */

function getTargetEnemy(
    maxDistance,
    offset
) {

    if (
        offset === undefined
    ) {

        offset = 0;
    }


    let result =
        null;

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
        distance >
        1.5
    ) {

        return;
    }


    spawnEnemy();
}


/* =========================================================
   SPAWN
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

                x:
                    point.x,

                y:
                    point.y,

                hp:
                    100,

                alive:
                    true,

                hit:
                    0

            });


            /*
               Рычаг тоже считается
               стильным действием.
            */

            addStyle(
                10,
                "lever"
            );


            return;
        }
    }
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

        } catch (error) {}


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
            x /
            length *
            max;


        y =
            y /
            length *
            max;
    }


    joyX =
        x / max;


    joyY =
        y / max;


    stick.style.left =
        "calc(50% + " +
        x +
        "px)";


    stick.style.top =
        "calc(50% + " +
        y +
        "px)";
}


/* =========================================================
   LOOK
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

        } catch (error) {}
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
            dx *
            .006;


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
   WALL
========================================================= */

function isWall(
    x,
    y
) {

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

function movePlayer(
    delta
) {

    let forward =
        -joyY;

    let strafe =
        joyX;


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


    const length =
        Math.sqrt(
            forward *
            forward +

            strafe *
            strafe
        );


    if (
        length === 0
    ) {

        return;
    }


    forward /=
        Math.max(
            length,
            1
        );


    strafe /=
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
        forward *
        speed -

        Math.sin(
            player.angle
        ) *
        strafe *
        speed;


    const dy =
        Math.sin(
            player.angle
        ) *
        forward *
        speed +

        Math.cos(
            player.angle
        ) *
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
   RAYCAST
========================================================= */

function castRay(
    angle
) {

    const sin =
        Math.sin(angle);

    const cos =
        Math.cos(angle);


    let distance =
        0;


    while (
        distance <
        MAX_DEPTH
    ) {

        distance +=
            .025;


        const x =
            player.x +
            cos *
            distance;


        const y =
            player.y +
            sin *
            distance;


        if (
            isWall(
                x,
                y
            )
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
       Небо
    */

    ctx.fillStyle =
        "#101010";


    ctx.fillRect(
        0,
        0,
        w,
        h / 2
    );


    /*
       Пол
    */

    ctx.fillStyle =
        "#252525";


    ctx.fillRect(
        0,
        h / 2,
        w,
        h / 2
    );


    const rays =
        Math.min(
            RAYS,
            Math.floor(
                w / 2
            )
        );


    const column =
        w / rays;


    for (
        let i = 0;
        i < rays;
        i++
    ) {

        const cameraX =
            i / rays -
            .5;


        const angle =
            player.angle +
            cameraX *
            FOV;


        let distance =
            castRay(
                angle
            );


        distance *=
            Math.cos(
                angle -
                player.angle
            );


        const height =
            h /
            Math.max(
                distance,
                .001
            );


        const top =
            h / 2 -
            height / 2;


        const brightness =
            Math.max(
                25,
                180 -
                distance *
                15
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

            top,

            column + 1,

            height
        );
    }
}


/* =========================================================
   SPRITES
========================================================= */

function drawSprites() {

    for (
        const enemy of enemies
    ) {

        if (
            enemy.alive
        ) {

            drawEnemy(
                enemy
            );
        }
    }


    drawLever();
}


/* =========================================================
   ENEMY
========================================================= */

function drawEnemy(
    enemy
) {

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
        Math.abs(
            relative
        ) >
        FOV / 2
    ) {

        return;
    }


    const wall =
        castRay(
            player.angle +
            relative
        );


    if (
        distance >
        wall
    ) {

        return;
    }


    const w =
        canvas.width;

    const h =
        canvas.height;


    const screenX =
        w / 2 +

        Math.tan(
            relative
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


    const scale =
        Math.min(
            size *
            .003,
            1.5
        );


    const body =
        170 *
        scale;


    const head =
        32 *
        scale;


    ctx.fillStyle =
        enemy.hit > 0
            ? "#fff"
            : "#888";


    ctx.fillRect(

        screenX -
        35 * scale,

        h / 2,

        70 * scale,

        body
    );


    ctx.beginPath();


    ctx.arc(

        screenX,

        h / 2 -
        35 * scale,

        head,

        0,

        Math.PI * 2
    );


    ctx.fill();


    /*
       HP
    */

    ctx.fillStyle =
        "#111";


    ctx.fillRect(

        screenX -
        40 * scale,

        h / 2 -
        80 * scale,

        80 * scale,

        7
    );


    ctx.fillStyle =
        "#d00000";


    ctx.fillRect(

        screenX -
        40 * scale,

        h / 2 -
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
        Math.abs(
            relative
        ) >
        FOV / 2
    ) {

        return;
    }


    const wall =
        castRay(
            player.angle +
            relative
        );


    if (
        distance >
        wall
    ) {

        return;
    }


    const w =
        canvas.width;

    const h =
        canvas.height;


    const x =
        w / 2 +

        Math.tan(
            relative
        ) *

        (w / 2) /
        Math.tan(
            FOV / 2
        );


    const scale =
        Math.min(
            h /
            Math.max(
                distance,
                .1
            ) *
            .004,

            1.5
        );


    const y =
        h / 2 +
        50 *
        scale;


    ctx.fillStyle =
        "#333";


    ctx.fillRect(

        x -
        18 * scale,

        y,

        36 * scale,

        65 * scale
    );


    ctx.strokeStyle =
        "#777";


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

        x +
        25 * scale,

        y -
        30 * scale
    );


    ctx.stroke();
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


    if (
        weapon === "fists"
    ) {

        drawFists(
            w,
            h,
            recoil
        );

    }

    else if (
        weapon === "pistol"
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


    const y =
        h *
        .68 -
        punch *
        h *
        .12;


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


    if (
        leftFistReady
    ) {

        ctx.save();


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


        /*
           Canvas сохраняет
           прозрачность PNG.
        */

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
            size *
            .65,

            size *
            .35,

            -.1
        );
    }


    if (
        rightFistReady
    ) {

        ctx.save();


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
            size *
            .65,

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
        muzzleFlash > 0
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
   ANGLE
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
        weaponAnimation > 0
    ) {

        weaponAnimation -=
            delta;


        if (
            weaponAnimation < 0
        ) {

            weaponAnimation = 0;
        }
    }


    if (
        muzzleFlash > 0
    ) {

        muzzleFlash -=
            delta;


        if (
            muzzleFlash < 0
        ) {

            muzzleFlash = 0;
        }
    }


    for (
        const enemy of enemies
    ) {

        if (
            enemy.hit > 0
        ) {

            enemy.hit -=
                delta / 100;


            if (
                enemy.hit < 0
            ) {

                enemy.hit = 0;
            }
        }
    }


    /*
       STYLE TIMER

       Важно:
       мы НЕ уменьшаем очки каждую
       миллисекунду.

       Просто ждём 10 секунд
       после последнего действия.
    */

    if (
        styleVisible
    ) {

        styleTimer -=
            delta;


        if (
            styleTimer <= 0
        ) {

            hideStyle();
        }
    }
}


/* =========================================================
   LOOP
========================================================= */

function loop(
    time
) {

    const delta =
        Math.min(
            50,
            Math.max(
                0,
                time -
                lastTime
            )
        );


    lastTime =
        time;


    update(
        delta
    );


    drawWorld();

    drawSprites();

    drawWeapon();


    requestAnimationFrame(
        loop
    );
}


/* =========================================================
   START
========================================================= */

styleBox.style.display =
    "none";


requestAnimationFrame(
    loop
);
