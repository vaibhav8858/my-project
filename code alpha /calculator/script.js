
const display = document.getElementById("display");
const result = document.getElementById("result");
const buttons = document.querySelector(".buttons");

let expression = "";
let finished = false;

function calculate(exp) {
    if (!exp || !/^[0-9+\-*/().%\s]+$/.test(exp)) {
        throw new Error("Invalid expression");
    }

    // Convert percentage values, e.g. 50% becomes 50/100.
    const safeExpression = exp.replace(
        /(\d*\.?\d+)%/g,
        "($1/100)"
    );

    // Only validated arithmetic characters are permitted.
    const answer = Function(
        '"use strict"; return (' + safeExpression + ')'
    )();

    if (typeof answer !== "number" || !Number.isFinite(answer)) {
        throw new Error("Invalid calculation");
    }

    return Number(answer.toPrecision(12));
}

function updateDisplay() {
    display.value = expression;

    if (!expression) {
        result.textContent = "Ready";
        return;
    }

    try {
        // Show a live answer only for complete expressions.
        const answer = calculate(expression);
        result.textContent = "= " + answer;
    } catch {
        result.textContent = "";
    }
}

buttons.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (action === "clear") {
        expression = "";
        finished = false;
        updateDisplay();
        return;
    }

    if (action === "delete") {
        expression = expression.slice(0, -1);
        finished = false;
        updateDisplay();
        return;
    }

    if (action === "calculate") {
        try {
            expression = String(calculate(expression));
            display.value = expression;
            result.textContent = "= " + expression;
            finished = true;
        } catch {
            result.textContent = "Invalid expression";
        }
        return;
    }

    if (action === "sign") {
        const match = expression.match(/(\d*\.?\d+)$/);

        if (match) {
            const number = match[1];
            const start = match.index;

            const before = expression.slice(0, start);
            const previous = before.trimEnd();

            if (previous.endsWith("-") &&
                (previous.length === 1 ||
                    "+-*/(".includes(previous.at(-2)))) {
                expression = before.slice(0, before.lastIndexOf("-")) + number;
            } else {
                expression = before + "(-" + number + ")";
            }
        } else if (!expression) {
            expression = "-";
        }

        finished = false;
        updateDisplay();
        return;
    }

    if (value !== undefined) {
        if (finished && /[0-9.]/.test(value)) {
            expression = "";
        }

        finished = false;

        if (/[+\-*/]/.test(value)) {
            if (!expression && value !== "-") return;

            if (/[+\-*/]$/.test(expression)) {
                expression = expression.slice(0, -1);
            }
        }

        if (value === ".") {
            const currentNumber = expression.split(/[+\-*/()%]/).pop();
            if (currentNumber.includes(".")) return;
            if (!currentNumber) expression += "0";
        }

        expression += value;
        updateDisplay();
    }
});

// Keyboard support
document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        event.preventDefault();
        buttons.querySelector(
            `[data-value="${key}"]`
        ).click();
    } else if (["+", "-", "*", "/", "%"].includes(key)) {
        event.preventDefault();
        buttons.querySelector(
            `[data-value="${key}"]`
        ).click();
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        buttons.querySelector(
            '[data-action="calculate"]'
        ).click();
    } else if (key === "Backspace") {
        buttons.querySelector(
            '[data-action="delete"]'
        ).click();
    } else if (key === "Escape") {
        buttons.querySelector(
            '[data-action="clear"]'
        ).click();
    }
});
