let score = 0;

const scoreDisplay = document.getElementById("score");
const cookieButton = document.getElementById("cookieButton");
const resetButton = document.getElementById("resetButton");
const message = document.getElementById("message");

cookieButton.addEventListener("click", function () {

    score++;

    scoreDisplay.textContent = score;

    if (score === 10) {
        message.textContent = "Nice! 10 cookies!";
    }

    else if (score === 25) {
        message.textContent = "Great job! 25 cookies!";
    }

    else if (score === 50) {
        message.textContent = "🍪 Cookie Master!";
    }

    else if (score === 100) {
        message.textContent = "🏆 100 COOKIES!";
    }

});

resetButton.addEventListener("click", function () {

    score = 0;

    scoreDisplay.textContent = score;

    message.textContent = "Start clicking!";

});
