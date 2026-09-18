const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const attackButton = document.getElementById("attackButton");
const comboText = document.getElementById("comboText");


// ==================================================
// CANVAS
// ==================================================

function resize() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

}

window.addEventListener("resize", resize);

resize();


// ==================================================
// ИГРОК
// ==================================================

const player = {

    x: 0,
    y: 0,

    speed: 3

};


// ==================================================
// КАМЕРА
// ==================================================

const camera = {

    x: 0,
    y: 0

};


// ==================================================
// ДВИЖЕНИЕ
// ==================================================

const keys = {

    forward: false,
    back: false,
    left: false,
    right: false

};


// Клавиатура для ПК

window.addEventListener("keydown", function(e) {

    if (e.code === "KeyW" || e.code === "ArrowUp") {
        keys.forward = true;
    }

    if (e.code === "KeyS" || e.code === "ArrowDown") {
        keys.back = true;
    }

    if (e.code === "KeyA" || e.code === "ArrowLeft") {
        keys.left = true;
    }

    if (e.code === "KeyD" || e.code === "ArrowRight") {
        keys.right = true;
    }

});


window.addEventListener("keyup", function(e) {

    if (e.code === "KeyW" || e.code === "ArrowUp") {
        keys.forward = false;
    }

    if (e.code === "KeyS" || e.code === "ArrowDown") {
        keys.back = false;
    }

    if (e.code === "KeyA" || e.code === "ArrowLeft") {
        keys.left = false;
    }

    if (e.code === "KeyD" || e.code === "ArrowRight") {
        keys.right = false;
    }

});


// ==================================================
// МОБИЛЬНОЕ ДВИЖЕНИЕ
// ==================================================

// На этом этапе оставляем простое управление.
// Его можно заменить твоим предыдущим D-Pad,
// если он уже был в твоей версии.


// ==================================================
// КУЛАКИ
// ==================================================

let fistAnimation = {

    active: false,

    // 0 = нет
    // 1 = правый
    // 2 = левый
    // 3 = аперкот

    type: 0,

    time: 0,

    duration: 180
};


// ==================================================
// КОМБО
// ==================================================

let combo = 0;

let comboTimer = 0;

const comboDelay = 700;


// ==================================================
// КНОПКА УДАРА
// ==================================================

attackButton.addEventListener("pointerdown", function(e) {

    e.preventDefault();

    punch();

});


// Для теста на ПК можно нажимать Space

window.addEventListener("keydown", function(e) {

    if (e.code === "Space") {

        punch();

    }

});


// ==================================================
// УДАР
// ==================================================

function punch() {

    // Если прошло слишком много времени,
    // начинаем комбинацию заново.

    if (comboTimer <= 0) {

        combo = 0;

    }


    combo++;

    if (combo > 3) {

        combo = 1;

    }


    // Первый удар

    if (combo === 1) {

        fistAnimation.type = 1;

        showComboText("ПРАВЫЙ");

    }


    // Второй удар

    else if (combo === 2) {

        fistAnimation.type = 2;

        showComboText("ЛЕВЫЙ");

    }


    // Третий удар

    else if (combo === 3) {

        fistAnimation.type = 3;

        showComboText("АПЕРКОТ!");

    }


    fistAnimation.active = true;

    fistAnimation.time = 0;

    comboTimer = comboDelay;

}


// ==================================================
// ТЕКСТ
// ==================================================

let textTimer = 0;

function showComboText(text) {

    comboText.textContent = text;

    comboText.style.opacity = "1";

    textTimer = 350;

}


// ==================================================
// ОБНОВЛЕНИЕ
// ==================================================

function update(delta) {


    // ----------------------------
    // ДВИЖЕНИЕ
    // ----------------------------

    if (keys.forward) {
        player.y -= player.speed * delta / 16;
    }

    if (keys.back) {
        player.y += player.speed * delta / 16;
    }

    if (keys.left) {
        player.x -= player.speed * delta / 16;
    }

    if (keys.right) {
        player.x += player.speed * delta / 16;
    }


    // ----------------------------
    // КОМБО-ТАЙМЕР
    // ----------------------------

    if (comboTimer > 0) {

        comboTimer -= delta;

    }

    else {

        combo = 0;

    }


    // ----------------------------
    // АНИМАЦИЯ КУЛАКА
    // ----------------------------

    if (fistAnimation.active) {

        fistAnimation.time += delta;

        if (fistAnimation.time >= fistAnimation.duration) {

            fistAnimation.active = false;

            fistAnimation.type = 0;

        }

    }


    // ----------------------------
    // ТЕКСТ
    // ----------------------------

    if (textTimer > 0) {

        textTimer -= delta;

    }

    else {

        comboText.style.opacity = "0";

    }

}


// ==================================================
// РИСОВАНИЕ
// ==================================================

function draw() {

    const w = canvas.width;
    const h = canvas.height;


    // ==================================================
    // НЕБО
    // ==================================================

    ctx.fillStyle = "#101010";

    ctx.fillRect(
        0,
        0,
        w,
        h / 2
    );


    // ==================================================
    // ПОЛ
    // ==================================================

    ctx.fillStyle = "#252525";

    ctx.fillRect(
        0,
        h / 2,
        w,
        h / 2
    );


    // ==================================================
    // ПОЛОСЫ ПЕРСПЕКТИВЫ
    // ==================================================

    ctx.strokeStyle = "#353535";

    ctx.lineWidth = 2;

    for (let i = 1; i < 8; i++) {

        const y =
            h / 2 +
            i * i * 8;

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(w, y);

        ctx.stroke();

    }


    // ==================================================
    // СТЕНА
    // ==================================================

    ctx.fillStyle = "#303030";

    ctx.fillRect(
        0,
        h * 0.25,
        w,
        10
    );


    // ==================================================
    // МАНЕКЕН
    // ==================================================

    drawDummy();


    // ==================================================
    // КУЛАКИ
    // ==================================================

    drawFists();

}


// ==================================================
// МАНЕКЕН
// ==================================================

function drawDummy() {

    const w = canvas.width;
    const h = canvas.height;

    const x = w / 2;

    const ground = h * 0.80;

    const scale = Math.min(w, h) / 600;


    ctx.fillStyle = "#777";


    // Голова

    ctx.beginPath();

    ctx.arc(
        x,
        ground - 190 * scale,
        35 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Тело

    ctx.fillRect(
        x - 45 * scale,
        ground - 150 * scale,
        90 * scale,
        120 * scale
    );


    // Левая рука

    ctx.fillRect(
        x - 75 * scale,
        ground - 145 * scale,
        30 * scale,
        100 * scale
    );


    // Правая рука

    ctx.fillRect(
        x + 45 * scale,
        ground - 145 * scale,
        30 * scale,
        100 * scale
    );


    // Ноги

    ctx.fillRect(
        x - 35 * scale,
        ground - 30 * scale,
        25 * scale,
        110 * scale
    );

    ctx.fillRect(
        x + 10 * scale,
        ground - 30 * scale,
        25 * scale,
        110 * scale
    );

}


// ==================================================
// КУЛАК
// ==================================================

function drawFist(x, y, size, rotation) {

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(rotation);


    // Рука

    ctx.fillStyle = "#c88b68";

    ctx.fillRect(
        -size * 0.25,
        0,
        size * 0.5,
        size * 0.9
    );


    // Кулак

    ctx.fillStyle = "#d99a75";

    ctx.beginPath();

    ctx.roundRect(
        -size * 0.5,
        -size * 0.4,
        size,
        size * 0.65,
        size * 0.15
    );

    ctx.fill();


    // Пальцы

    ctx.fillStyle = "#b97858";

    for (let i = 0; i < 4; i++) {

        ctx.fillRect(
            -size * 0.38 + i * size * 0.2,
            -size * 0.22,
            size * 0.13,
            size * 0.25
        );

    }


    ctx.restore();

}


// ==================================================
// КУЛАКИ НА ЭКРАНЕ
// ==================================================

function drawFists() {

    const w = canvas.width;
    const h = canvas.height;

    const size = Math.min(w, h) * 0.13;


    let leftX = w * 0.30;
    let leftY = h * 0.90;

    let rightX = w * 0.70;
    let rightY = h * 0.90;

    let leftRotation = 0;
    let rightRotation = 0;


    // ==================================================
    // АНИМАЦИЯ
    // ==================================================

    if (fistAnimation.active) {

        const progress =
            fistAnimation.time /
            fistAnimation.duration;


        // Плавное движение

        const punch =
            Math.sin(progress * Math.PI);


        // --------------------------
        // ПРАВЫЙ
        // --------------------------

        if (fistAnimation.type === 1) {

            rightX -= punch * w * 0.22;

            rightY -= punch * h * 0.25;

            rightRotation =
                -punch * 0.15;

        }


        // --------------------------
        // ЛЕВЫЙ
        // --------------------------

        if (fistAnimation.type === 2) {

            leftX += punch * w * 0.22;

            leftY -= punch * h * 0.25;

            leftRotation =
                punch * 0.15;

        }


        // --------------------------
        // АПЕРКОТ
        // --------------------------

        if (fistAnimation.type === 3) {

            leftY -= punch * h * 0.30;

            rightY -= punch * h * 0.30;

            leftX -= punch * w * 0.04;

            rightX += punch * w * 0.04;

        }

    }


    // Рисуем левый кулак

    drawFist(
        leftX,
        leftY,
        size,
        leftRotation
    );


    // Рисуем правый кулак

    drawFist(
        rightX,
        rightY,
        size,
        rightRotation
    );

}


// ==================================================
// GAME LOOP
// ==================================================

let lastTime = performance.now();

function gameLoop(time) {

    const delta = time - lastTime;

    lastTime = time;


    update(delta);

    draw();


    requestAnimationFrame(gameLoop);

}


requestAnimationFrame(gameLoop);
