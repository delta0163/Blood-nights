const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const attackButton = document.getElementById("attackButton");

const comboText = document.getElementById("combo");
const enemyHealthText = document.getElementById("enemyHealth");


// =========================
// CANVAS
// =========================

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();


// =========================
// ИГРОК
// =========================

const player = {
    hp: 100
};


// =========================
// МАНЕКЕН
// =========================

const enemy = {
    hp: 100,

    x: 0,
    y: 0,

    hitFlash: 0
};


// =========================
// КОМБО
// =========================

// 0 = нет комбо
// 1 = правый
// 2 = левый
// 3 = аперкот

let comboStep = 0;

let comboTimer = 0;

const COMBO_TIME = 900;


// =========================
// УДАР
// =========================

let attackAnimation = 0;
let currentAttack = "";

let canAttack = true;


// =========================
// УПРАВЛЕНИЕ
// =========================

attackButton.addEventListener("pointerdown", function(e) {

    e.preventDefault();

    attack();

});


// Можно также играть мышкой/клавишей

window.addEventListener("keydown", function(e) {

    if (e.code === "Space" || e.code === "KeyZ") {
        attack();
    }

});


// =========================
// АТАКА
// =========================

function attack() {

    if (!canAttack) return;

    canAttack = false;

    // Проверяем время комбо

    if (comboTimer <= 0) {
        comboStep = 0;
    }


    // Следующий удар

    comboStep++;

    if (comboStep > 3) {
        comboStep = 1;
    }


    if (comboStep === 1) {

        currentAttack = "RIGHT";

        comboText.textContent = "КОМБО: ПРАВЫЙ";

        damageEnemy(15);

    }

    else if (comboStep === 2) {

        currentAttack = "LEFT";

        comboText.textContent = "КОМБО: ЛЕВЫЙ";

        damageEnemy(20);

    }

    else if (comboStep === 3) {

        currentAttack = "UPPER";

        comboText.textContent = "КОМБО: АПЕРКОТ!";

        damageEnemy(35);

    }


    attackAnimation = 1;


    // Следующий удар можно делать после анимации

    setTimeout(() => {

        canAttack = true;

    }, 220);


    // Таймер комбо

    comboTimer = COMBO_TIME;

}


// =========================
// УРОН
// =========================

function damageEnemy(damage) {

    enemy.hp -= damage;

    if (enemy.hp < 0) {
        enemy.hp = 0;
    }

    enemy.hitFlash = 1;

    enemyHealthText.textContent =
        "МАНЕКЕН: " + enemy.hp;


    if (enemy.hp <= 0) {

        comboText.textContent = "МАНЕКЕН ПОВАЛЕН!";

        setTimeout(resetEnemy, 1200);

    }

}


// =========================
// ВОЗРОЖДЕНИЕ МАНЕКЕНА
// =========================

function resetEnemy() {

    enemy.hp = 100;

    enemyHealthText.textContent =
        "МАНЕКЕН: 100";

    comboStep = 0;

    comboTimer = 0;

    comboText.textContent = "КОМБО: —";

}


// =========================
// РИСОВАНИЕ
// =========================

function draw() {

    const w = canvas.width;
    const h = canvas.height;


    // =====================
    // НЕБО
    // =====================

    const sky = ctx.createLinearGradient(
        0,
        0,
        0,
        h / 2
    );

    sky.addColorStop(0, "#090909");
    sky.addColorStop(1, "#292929");

    ctx.fillStyle = sky;

    ctx.fillRect(
        0,
        0,
        w,
        h / 2
    );


    // =====================
    // ПОЛ
    // =====================

    const floor = ctx.createLinearGradient(
        0,
        h / 2,
        0,
        h
    );

    floor.addColorStop(0, "#252525");
    floor.addColorStop(1, "#050505");

    ctx.fillStyle = floor;

    ctx.fillRect(
        0,
        h / 2,
        w,
        h / 2
    );


    // =====================
    // СТЕНЫ
    // =====================

    ctx.fillStyle = "#333";

    ctx.fillRect(
        0,
        h * 0.25,
        w,
        10
    );

    ctx.fillStyle = "#202020";

    ctx.fillRect(
        0,
        h * 0.25 + 10,
        w,
        4
    );


    // =====================
    // ПОЛОСЫ ПЕРСПЕКТИВЫ
    // =====================

    ctx.strokeStyle = "#303030";

    ctx.lineWidth = 2;

    for (let i = 1; i < 8; i++) {

        const y =
            h / 2 +
            (i * i) * 10;

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(w, y);

        ctx.stroke();
    }


    // =====================
    // МАНЕКЕН
    // =====================

    drawEnemy();


    // =====================
    // КУЛАКИ
    // =====================

    drawFists();
}


// =========================
// МАНЕКЕН
// =========================

function drawEnemy() {

    const w = canvas.width;
    const h = canvas.height;

    const centerX = w / 2;

    const groundY = h * 0.78;

    const scale = Math.min(w, h) / 500;

    let bodyScale = scale;

    if (enemy.hp <= 0) {
        bodyScale = scale * 0.65;
    }


    // Вспышка попадания

    if (enemy.hitFlash > 0) {

        ctx.fillStyle = "#fff";

    } else {

        ctx.fillStyle = "#777";

    }


    // Голова

    ctx.beginPath();

    ctx.arc(
        centerX,
        groundY - 170 * bodyScale,
        32 * bodyScale,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Тело

    ctx.fillRect(
        centerX - 45 * bodyScale,
        groundY - 135 * bodyScale,
        90 * bodyScale,
        120 * bodyScale
    );


    // Левая рука

    ctx.fillRect(
        centerX - 75 * bodyScale,
        groundY - 125 * bodyScale,
        30 * bodyScale,
        100 * bodyScale
    );


    // Правая рука

    ctx.fillRect(
        centerX + 45 * bodyScale,
        groundY - 125 * bodyScale,
        30 * bodyScale,
        100 * bodyScale
    );


    // Ноги

    ctx.fillRect(
        centerX - 38 * bodyScale,
        groundY - 15 * bodyScale,
        28 * bodyScale,
        110 * bodyScale
    );

    ctx.fillRect(
        centerX + 10 * bodyScale,
        groundY - 15 * bodyScale,
        28 * bodyScale,
        110 * bodyScale
    );


    // Глаза

    ctx.fillStyle = "#111";

    ctx.fillRect(
        centerX - 16 * bodyScale,
        groundY - 180 * bodyScale,
        8 * bodyScale,
        8 * bodyScale
    );

    ctx.fillRect(
        centerX + 8 * bodyScale,
        groundY - 180 * bodyScale,
        8 * bodyScale,
        8 * bodyScale
    );


    // HP полоска

    const barWidth = 130;

    const hpWidth =
        barWidth * (enemy.hp / 100);

    ctx.fillStyle = "#111";

    ctx.fillRect(
        centerX - barWidth / 2,
        groundY - 220 * bodyScale,
        barWidth,
        10
    );

    ctx.fillStyle = "#d00000";

    ctx.fillRect(
        centerX - barWidth / 2,
        groundY - 220 * bodyScale,
        hpWidth,
        10
    );
}


// =========================
// КУЛАКИ
// =========================

function drawFists() {

    const w = canvas.width;
    const h = canvas.height;


    // Обычное положение

    let leftX = w * 0.30;
    let leftY = h * 0.88;

    let rightX = w * 0.70;
    let rightY = h * 0.88;


    let leftSize = Math.min(w, h) * 0.10;
    let rightSize = Math.min(w, h) * 0.10;


    // =====================
    // ПРАВЫЙ УДАР
    // =====================

    if (currentAttack === "RIGHT" && attackAnimation > 0) {

        rightX = w * 0.52;
        rightY = h * 0.60;

        rightSize *= 1.25;
    }


    // =====================
    // ЛЕВЫЙ УДАР
    // =====================

    if (currentAttack === "LEFT" && attackAnimation > 0) {

        leftX = w * 0.48;
        leftY = h * 0.60;

        leftSize *= 1.25;
    }


    // =====================
    // АПЕРКОТ
    // =====================

    if (currentAttack === "UPPER" && attackAnimation > 0) {

        leftX = w * 0.43;
        leftY = h * 0.53;

        rightX = w * 0.57;
        rightY = h * 0.53;

        leftSize *= 1.2;
        rightSize *= 1.2;
    }


    drawFist(
        leftX,
        leftY,
        leftSize,
        currentAttack === "LEFT" && attackAnimation > 0
    );

    drawFist(
        rightX,
        rightY,
        rightSize,
        currentAttack === "RIGHT" && attackAnimation > 0
    );


    // Апперкот двумя руками

    if (currentAttack === "UPPER" && attackAnimation > 0) {

        drawFist(
            w * 0.43,
            h * 0.55,
            leftSize,
            true
        );

        drawFist(
            w * 0.57,
            h * 0.55,
            rightSize,
            true
        );
    }
}


// =========================
// РИСОВАНИЕ КУЛАКА
// =========================

function drawFist(x, y, size, active) {

    ctx.save();

    ctx.translate(x, y);


    if (active) {

        ctx.scale(1.15, 1.15);

    }


    // предплечье

    ctx.fillStyle = "#c58c67";

    ctx.fillRect(
        -size * 0.28,
        size * 0.15,
        size * 0.56,
        size * 0.75
    );


    // кулак

    ctx.fillStyle = "#d59b73";

    ctx.beginPath();

    ctx.roundRect(
        -size * 0.48,
        -size * 0.45,
        size * 0.96,
        size * 0.65,
        size * 0.15
    );

    ctx.fill();


    // пальцы

    ctx.fillStyle = "#b97958";

    for (let i = 0; i < 4; i++) {

        ctx.fillRect(
            -size * 0.38 + i * size * 0.20,
            -size * 0.25,
            size * 0.14,
            size * 0.28
        );
    }


    ctx.restore();
}


// =========================
// UPDATE
// =========================

function update(delta) {


    // Таймер комбо

    if (comboTimer > 0) {

        comboTimer -= delta;

        if (comboTimer <= 0) {

            comboTimer = 0;

            comboStep = 0;

            comboText.textContent =
                "КОМБО: —";
        }
    }


    // Анимация удара

    if (attackAnimation > 0) {

        attackAnimation -= delta / 220;

        if (attackAnimation <= 0) {

            attackAnimation = 0;

            currentAttack = "";
        }
    }


    // Вспышка манекена

    if (enemy.hitFlash > 0) {

        enemy.hitFlash -= delta / 150;

        if (enemy.hitFlash < 0) {
            enemy.hitFlash = 0;
        }
    }
}


// =========================
// GAME LOOP
// =========================

let lastTime = performance.now();

function loop(time) {

    const delta = time - lastTime;

    lastTime = time;


    update(delta);

    draw();


    requestAnimationFrame(loop);
}


requestAnimationFrame(loop);
