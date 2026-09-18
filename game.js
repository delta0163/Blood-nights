/* =====================================================
   BLOOD NIGHT
   Тестовая система камер + Lichi + время
===================================================== */


/* =====================================================
   НАСТРОЙКИ НОЧИ
===================================================== */

// Сколько реальных секунд длится один игровой час.
// 60 секунд = один час.
// 6 игровых часов = 6 минут.
const HOUR_LENGTH = 60;


// Начальное время
let gameHour = 12;


// Текущая камера
let currentCamera = 1;


// Где сейчас находится Lichi
//
// 1 = главный зал
// 2 = сцена
// 3 = левая часть
// 4 = правая часть
// 5 = кухня
// 6 = коридор
// 7 = вентиляция
// 8 = офис
//
let lichiPosition = 2;


// Идёт ли игра
let gameRunning = true;


// Таймеры
let gameTimer;
let lichiTimer;


/* =====================================================
   КАМЕРЫ
===================================================== */

const cameras = {

    1: {
        name: "CAM 01 — ГЛАВНЫЙ ЗАЛ",
        location: "ГЛАВНЫЙ ЗАЛ"
    },

    2: {
        name: "CAM 02 — СЦЕНА",
        location: "СЦЕНА"
    },

    3: {
        name: "CAM 03 — ЛЕВАЯ ЧАСТЬ",
        location: "ЛЕВАЯ ЧАСТЬ"
    },

    4: {
        name: "CAM 04 — ПРАВАЯ ЧАСТЬ",
        location: "ПРАВАЯ ЧАСТЬ"
    },

    5: {
        name: "CAM 05 — КУХНЯ",
        location: "КУХНЯ"
    },

    6: {
        name: "CAM 06 — КОРИДОР",
        location: "КОРИДОР"
    },

    7: {
        name: "CAM 07 — ВЕНТИЛЯЦИЯ",
        location: "ВЕНТИЛЯЦИЯ"
    },

    8: {
        name: "CAM 08 — ОФИС",
        location: "ОФИС"
    }

};


/* =====================================================
   DOM
===================================================== */

const office =
    document.getElementById("office");

const camerasScreen =
    document.getElementById("cameras");

const gameOver =
    document.getElementById("gameOver");

const winScreen =
    document.getElementById("winScreen");

const officeTime =
    document.getElementById("officeTime");

const cameraTime =
    document.getElementById("cameraTime");

const cameraTitle =
    document.getElementById("cameraTitle");

const locationText =
    document.getElementById("locationText");

const lichiCamera =
    document.getElementById("lichiCamera");

const openCameras =
    document.getElementById("openCameras");

const closeCameras =
    document.getElementById("closeCameras");

const flashButton =
    document.getElementById("flashButton");

const cameraFlash =
    document.getElementById("cameraFlash");

const restart =
    document.getElementById("restart");

const winRestart =
    document.getElementById("winRestart");


/* =====================================================
   ЭКРАНЫ
===================================================== */

function showScreen(screen) {

    office.classList.remove("active");
    camerasScreen.classList.remove("active");
    gameOver.classList.remove("active");
    winScreen.classList.remove("active");

    screen.classList.add("active");

}


/* =====================================================
   ФОРМАТ ВРЕМЕНИ
===================================================== */

function getTimeText() {

    if (gameHour === 12) {
        return "12 AM";
    }

    if (gameHour < 12) {
        return gameHour + " AM";
    }

    return (gameHour - 12) + " PM";
}


/* =====================================================
   ОБНОВЛЕНИЕ ВРЕМЕНИ
===================================================== */

function updateTime() {

    const text = getTimeText();

    officeTime.textContent = text;
    cameraTime.textContent = text;

}


/* =====================================================
   ИГРОВЫЕ ЧАСЫ
===================================================== */

function startGameClock() {

    clearInterval(gameTimer);

    gameTimer = setInterval(() => {

        if (!gameRunning) {
            return;
        }

        gameHour++;

        updateTime();


        // После 6 AM ночь закончена

        if (gameHour >= 6) {

            winGame();

        }

    }, HOUR_LENGTH * 1000);

}


/* =====================================================
   ОТКРЫТЬ КАМЕРЫ
===================================================== */

openCameras.addEventListener("click", () => {

    if (!gameRunning) {
        return;
    }

    showScreen(camerasScreen);

    updateCamera();

});


/* =====================================================
   ЗАКРЫТЬ КАМЕРЫ
===================================================== */

closeCameras.addEventListener("click", () => {

    if (!gameRunning) {
        return;
    }

    showScreen(office);

});


/* =====================================================
   ВЫБОР КАМЕРЫ
===================================================== */

document.querySelectorAll(".camera-button")
.forEach(button => {

    button.addEventListener("click", () => {

        if (!gameRunning) {
            return;
        }

        currentCamera =
            Number(button.dataset.camera);

        updateCamera();

    });

});


/* =====================================================
   ОБНОВЛЕНИЕ КАМЕРЫ
===================================================== */

function updateCamera() {

    const camera =
        cameras[currentCamera];

    cameraTitle.textContent =
        camera.name;

    locationText.textContent =
        camera.location;


    // Снимаем выделение со всех камер

    document
        .querySelectorAll(".camera-button")
        .forEach(button => {

            button.classList.remove("active");

        });


    // Выделяем выбранную

    const selected =
        document.querySelector(
            `[data-camera="${currentCamera}"]`
        );

    if (selected) {
        selected.classList.add("active");
    }


    // Показываем Lichi,
    // только если он находится
    // на выбранной камере

    if (currentCamera === lichiPosition) {

        lichiCamera.classList.remove("hidden");

    } else {

        lichiCamera.classList.add("hidden");

    }

}


/* =====================================================
   ДВИЖЕНИЕ LICHИ
===================================================== */

function startLichiMovement() {

    clearInterval(lichiTimer);

    lichiTimer = setInterval(() => {

        if (!gameRunning) {
            return;
        }


        // Lichi двигается вперёд

        if (lichiPosition < 8) {

            lichiPosition++;

        } else {

            // Если дошёл до офиса —
            // игрок должен был его отпугнуть

            loseGame(
                "Lichi добрался до офиса."
            );

            return;
        }


        updateCamera();


    }, 15000); // каждые 15 секунд

}


/* =====================================================
   ВСПЫШКА
===================================================== */

function flash() {

    if (!gameRunning) {
        return;
    }


    // Визуальная вспышка

    const effect =
        document.createElement("div");

    effect.className =
        "flash-effect";

    document.body.appendChild(effect);


    setTimeout(() => {

        effect.remove();

    }, 300);


    /*
       Если Lichi находится рядом
       с игроком — вспышка его отпугивает.
    */

    if (lichiPosition >= 6) {

        lichiPosition = 2;

        updateCamera();

    }

}


/* =====================================================
   КНОПКА ВСПЫШКИ В КАМЕРАХ
===================================================== */

cameraFlash.addEventListener(
    "click",
    flash
);


/* =====================================================
   КНОПКА ВСПЫШКИ В ОФИСЕ
===================================================== */

flashButton.addEventListener(
    "click",
    flash
);


/* =====================================================
   ПРОИГРЫШ
===================================================== */

function loseGame(reason) {

    gameRunning = false;

    clearInterval(gameTimer);
    clearInterval(lichiTimer);

    document.getElementById(
        "gameOverText"
    ).textContent = reason;

    showScreen(gameOver);

}


/* =====================================================
   ПОБЕДА
===================================================== */

function winGame() {

    gameRunning = false;

    clearInterval(gameTimer);
    clearInterval(lichiTimer);

    showScreen(winScreen);

}


/* =====================================================
   ПЕРЕЗАПУСК
===================================================== */

function restartGame() {

    gameHour = 12;

    currentCamera = 1;

    lichiPosition = 2;

    gameRunning = true;

    updateTime();

    updateCamera();

    showScreen(office);

    startGameClock();

    startLichiMovement();

}


restart.addEventListener(
    "click",
    restartGame
);

winRestart.addEventListener(
    "click",
    restartGame
);


/* =====================================================
   ЗАПУСК
===================================================== */

updateTime();

updateCamera();

showScreen(office);

startGameClock();

startLichiMovement();
