// Game Variables
let userInput = false;
let activeShape;
let allRows = [];
let shapes = [];
let shapeCounter = 0;
let score = 0;
let hardDropped = false;
let holdPiece;
let hold = false;
let hasSwappedHold = false;
let level = 1;
let clearedLinesCount = 0;
let speedMS = 800;
let loopCount = 0;
let incrementLoopCount = false;
let paused = false;
let ghostDivs = [];
let controlsData = JSON.parse(localStorage.getItem("blockGameControls"));
let highScore = localStorage.getItem("high-score");
let gameStart = false;
let changeControls = false;
let targetChangeIcon;

if (!controlsData) {
    controlsData = {
        leftMoveKey: "ArrowLeft",
        rightMoveKey: "ArrowRight",
        softDropKey: "ArrowDown",
        hardDropKey: "ArrowUp",
        holdPieceKey: "Tab",
        leftRotateKey: "1",
        rightRotateKey: "2"
    };
    localStorage.setItem("blockGameControls", JSON.stringify(controlsData));
}

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const linesClearedEl = document.getElementById("lines");
const modal = document.getElementById("modal");
const startBtnEl = document.getElementById("start");
const startScreenEl = document.getElementById("start-screen");
const headerEl = document.getElementById("header");
const wrapperEl = document.getElementById("game");
const countdownEl = document.getElementById("countdown");
const settingsEl = document.getElementById("settings");
const settingsScreenEl = document.getElementById("settings-screen");
const goBackEl = document.getElementById("go-back");
const keyIconEls = [...document.getElementsByTagName("kbd")];
const copyrightEl = document.getElementById("copyright");
const settingsInstrucEl = document.getElementById("settings-instructions");
const playAgainEl = document.getElementById("play-again");
const endScreenEl = document.getElementById("end-screen");
const goBackEndEl = document.getElementById("go-back-end");
const finalScoreEl = document.getElementById("final-score");
const newHighScoreEl = document.getElementById("new-high-score");
const gameBox = document.getElementById("game-box");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const populateGrid = async (xCount, yCount, gridId) => {
    const isGameBox = gridId === "game-box";

    for (let i = 0; i < yCount; i++) {
        const section = document.createElement("section");
        section.id = (isGameBox ? "y" : `${gridId}-y`) + i;
        document.getElementById(gridId).appendChild(section);

        if (isGameBox) {
            allRows.push(section);
        }

        for (let j = 0; j < xCount; j++) {
            const div = document.createElement("div");
            div.classList.add(isGameBox ? "cell" : "small-cell");
            section.appendChild(div);
        }
    }
};

const unPopulateGrid = async (xCount, yCount, gridId) => {
    for (let i = yCount - 1; i > -1; i--) {
        const row = document.getElementById(`${gridId}-y${i}`);

        for (let j = xCount - 1; j > -1; j--) {
            row.children[j].remove();
        }

        row.remove();
    }
};

const durstendfeldShuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
};

const bagGeneration = () => {
    let pieces = [new I(5, 0), new J(5, 0), new L(5, 0), new O(5, 0), new S(5, 0), new T(5, 0), new Z(5, 0)];

    // Durstendfeld shuffle
    for (let i = pieces.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = pieces[i];
        pieces[i] = pieces[j];
        pieces[j] = temp;
    }

    return pieces;
};

const endGame = async () => {
    gameStart = false;
    userInput = false;

    await delay(250);

    const gameBoxStyles = getComputedStyle(gameBox);
    gameBox.style.height = gameBoxStyles.height;
    gameBox.style.width = gameBoxStyles.width;

    // We want to delete all the rows incrementally, similar to how we populated boxes and rows one at a time.
    // Remove divs from rows in reverse order and then remove the rows once they are empty to not mess with UI.
    const reversedAllRows = allRows.reverse();
    for (let i = 0; i < reversedAllRows.length; i++) {
        for (let j = 9; j > -1; j--) {
            reversedAllRows[i].children[j].remove();
            await delay(10);
        }
        reversedAllRows[i].remove();
    }

    await delay(500);

    // Remove elements from small side grids.
    await unPopulateGrid(5, 15, "next");
    await unPopulateGrid(5, 5, "hold");

    // Update high-score
    if (highScore === null || score > parseInt(highScore)) {
        localStorage.setItem("high-score", score);
        newHighScoreEl.classList.remove("display-none");
        finalScoreEl.parentElement.style.marginBottom = "10px";
    }

    // Update UI
    headerEl.classList.add("display-none");
    wrapperEl.classList.add("display-none");
    endScreenEl.classList.remove("display-none");
    finalScoreEl.textContent = score;

    gameBox.style.height = null;
    gameBox.style.width = null;
};

const createShapeByColor = (color) => {
    switch (color) {
        case "light-blue":
            return new I();
        case "yellow":
            return new O();
        case "orange":
            return new L();
        case "red":
            return new Z();
        case "green":
            return new S();
        case "magenta":
            return new T();
        default:
            return new J();
    }
};

const displayNextShapes = (i, currentBag, nextBag) => {
    // Clear existing shapes
    for (let i = 0; i < 15; i++) {
        const section = document.getElementById(`next-y${i}`);

        for (let j = 0; j < section.children.length; j++) {
            section.children[j].setAttribute("class", "small-cell");
        }
    }

    let shape1, shape2, shape3;

    if (i > 3) {
        switch (i) {
            case 4:
                shape1 = currentBag[i + 1];
                shape2 = currentBag[i + 2];
                shape3 = nextBag[0];
                break;
            case 5:
                shape1 = currentBag[i + 1];
                shape2 = nextBag[0];
                shape3 = nextBag[1];
                break;
            default:
                shape1 = nextBag[0];
                shape2 = nextBag[1];
                shape3 = nextBag[2];
                break;
        }
    } else {
        shape1 = currentBag[i + 1];
        shape2 = currentBag[i + 2];
        shape3 = currentBag[i + 3];
    }

    [shape1, shape2, shape3].forEach((shape, index) => {
        let newShape = createShapeByColor(shape.color);

        if (index === 1) {
            newShape.resetShape(2, 6);
        } else if (index === 2) {
            newShape.resetShape(2, 11);
        } else {
            newShape.resetShape(2, 2);
        }

        newShape.populateShape(true, "next");
    });
};

const shapeDrop = async () => {
    // Update the game variables
    activeShape.populateShape(true);
    determineShadow();
    userInput = true;
    loopCount = 1;

    // System should consistently drop the activeShape at a rate determined by the current game level.
    // System should stop dropping the piece once it hits a blocker, the user hard drops, or the user decides to hold the piece.
    while (!hold && activeShape.canShapeMove(controlsData.softDropKey) && !hardDropped && !paused) {
        // When holding a piece, there is a big delay if the speedMS is too high.
        // Split speedMS into quarters and check the hold after each one.
        let quarterSpeed = Math.floor(speedMS / 4);

        for (let i = 0; i < 4; i++) {
            await delay(quarterSpeed);
            if (hold || hardDropped || paused) {
                return;
            }
        }

        if (activeShape.canShapeMove(controlsData.softDropKey)) {
            activeShape.moveShape(controlsData.softDropKey, false);
        } else {
            resetShadow();
            break;
        }
    }

    // Give users a max of 1000 ms to rotate and move block around once it hits the bottom possible space.
    // Needs some rework
    let count = 0;
    incrementLoopCount = true;
    while (count <= loopCount && loopCount !== 0 && !hardDropped) {
        await delay(100);
        if (activeShape.canShapeMove(controlsData.softDropKey)) {
            if (hold || hardDropped || paused) {
                return;
            }
            return shapeDrop();
        }
        count++;
    }

    // Update Game Variables
    userInput = false;
    incrementLoopCount = false;

    // Update shape's focalBox x and y coordinates.
    let focalBoxIndex = activeShape.getFocalIndex();
    activeShape.x = activeShape.boxes[focalBoxIndex].x;
    activeShape.y = activeShape.boxes[focalBoxIndex].y;
};

const updateLevel = () => {
    const lineTarget = Math.min(100, level * 10 + 1);

    if (clearedLinesCount >= lineTarget) {
        level++;

        // To calculate the milliseconds between piece auto-drop, there were some calculations I did on my end to keep it accurate to the original system.
        // Per the Tetris wikipedia, piece drop speed is determined by how many frames between piece drop (level 1 is 48 frames).
        // To translate this into seconds, I took the frame drop amount and divided it by the frame rate of the original NES system (60 fps).
        // So to determine any level's drop speed, dropSpeed = Math.ceil(frameDrop / 60)
        switch (level) {
            case 2:
                speedMS = 717;
                break;
            case 3:
                speedMS = 550;
                break;
            case 4:
                speedMS = 470;
                break;
            case 5:
                speedMS = 384;
                break;
            case 6:
                speedMS = 300;
                break;
            case 7:
                speedMS = 217;
                break;
            case 8:
                speedMS = 134;
                break;
            case 9:
                speedMS = 100;
                break;
            default:
                break;
        }

        if (level > 9 && level < 13) {
            speedMS = 84;
        } else if (level > 12 && level < 16) {
            speedMS = 64;
        } else if (level > 15 && level < 19) {
            speedMS = 50;
        } else if (level > 18 && level < 29) {
            speedMS = 33;
        } else if (level > 28) {
            speedMS = 17;
        }

        document.getElementById("level").textContent = `Level: ${level}`;
    }
};

const clearRows = async () => {
    let clearedRows = [];
    let targetYRows = [];

    // Grab the unique y values from the activeShape's boxes.
    // Check to see if a row was cleared by any of those boxes.
    activeShape.boxes.forEach((box) => {
        // Only check unique rows.
        if (!targetYRows.includes(box.y)) {
            const targetY = box.y;

            const row = document.getElementById(`y${targetY}`);
            const childDivs = [...row.children];

            // If row is completely full...
            if (childDivs.every((div) => div.classList.length !== 1)) {
                // Update the array variables.
                clearedRows.push(targetY);
                targetYRows.push(targetY);

                // Clear all divs within row.
                childDivs.forEach((div) => {
                    div.setAttribute("class", "cell");
                    div.removeAttribute("shapeId");
                });
            }
        }
    });

    // Update every shape on the page to move down but still keep its form
    if (clearedRows.length > 0) {
        await delay(250);

        // Filter out shapes that have had all of their boxes deleted.
        // Update remaining shapes with remaining boxes.
        let filteredShapes = [];
        shapes.forEach((shape) => {
            const filteredBoxes = shape.boxes.filter((box) => !clearedRows.includes(box.y));

            if (filteredBoxes.length !== 0) {
                shape.boxes = filteredBoxes;
                filteredShapes.push(shape);
            }
        });
        shapes = filteredShapes;

        // Loop over all rows in reverse order (except the bottom one)
        for (let i = 16; i > -1; i--) {
            // If the row loop is not a cleared row...
            if (!clearedRows.includes(i)) {
                // For each box on the board, we want to drop it the appropriate amount based on lines cleared below it.
                shapes.forEach(({ boxes }) => {
                    boxes.forEach((box) => {
                        if (box.y === i) {
                            // Drop the box based on how many lines were cleared below it.
                            box.updateDom(false);
                            box.y += clearedRows.filter((num) => num > i).length;
                            box.updateDom(true);
                        }
                    });
                });
            }
        }

        // Update score based on number of lines cleared
        let mod;
        let levelMod = level === 0 ? 1 : level;
        switch (clearedRows.length) {
            case 4:
                mod = 800;
                break;
            case 3:
                mod = 500;
                break;
            case 2:
                mod = 300;
                break;
            default:
                mod = 100;
                break;
        }

        // Update the game variables
        clearedLinesCount += clearedRows.length;
        linesClearedEl.textContent = `Lines: ${clearedLinesCount}`;

        updateScore(mod * levelMod);

        // Update the game level based on rows cleared
        return updateLevel();
    }
};

const updateScore = (amount) => {
    score += amount;
    scoreEl.textContent = score;

    if (score > highScore) {
        highScoreEl.textContent = `New Best! ${score}`;
    }
};

const determineShadow = () => {
    // Reset Shadow
    resetShadow();

    let count = 0;
    while (true) {
        let canMove = true;

        activeShape.boxes.forEach(({ x, y }) => {
            let targetX = x;
            let targetY = y + count;

            // Blocked by borders
            if (targetY > 17) {
                canMove = false;
                return;
            }

            // Blocked by other shape
            const targetRow = document.getElementById(`y${targetY}`);
            const targetBox = targetRow.children[targetX];
            const shapeId = targetBox.getAttribute("shapeId");

            if (shapeId !== null && parseInt(shapeId) !== activeShape.shapeId) {
                canMove = false;
            }
        });

        if (canMove) {
            count++;
        } else {
            count--;
            break;
        }
    }

    activeShape.boxes.forEach(({ x, y }) => {
        let row = document.getElementById(`y${y + count}`);
        row.children[x].style.borderColor = "white";
        ghostDivs.push(row.children[x]);
    });
};

const resetShadow = () => {
    ghostDivs.forEach((cell) => {
        cell.style.borderColor = "transparent";
    });
    ghostDivs = [];
};

const onLoadUI = () => {
    let randomArrayOne = durstendfeldShuffle([1, 2, 3, 4, 5, 6, 7]);
    let randomArrayTwo = durstendfeldShuffle([1, 2, 3, 4, 5, 6, 7]);

    [...document.getElementById("text-drop").children].forEach((value, i) => {
        let index = i > 6 ? randomArrayTwo[i - 7] : randomArrayOne[i];
        value.style.color = `var(--color-${index})`;
    });

    copyrightEl.innerHTML = `&copy; ${new Date().getFullYear()} Copyright: <a href="https://github.com/jmasone15" target="_blank"> Jordan Masone</a>`;

    for (const control in controlsData) {
        updateControlKey(controlsData[control], document.getElementById(control));
    }
};

const countdown = async () => {
    countdownEl.classList.remove("display-none");

    for (let i = 3; i > -1; i--) {
        if (i === 0) {
            countdownEl.textContent = "Go!";
        } else {
            countdownEl.textContent = i;
        }

        await delay(1000);
    }

    countdownEl.classList.add("display-none");
};

const updateControlKey = (key, element) => {
    let keyText = key;

    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(keyText)) {
        switch (keyText) {
            case "ArrowLeft":
                keyText = "&larr;";
                break;
            case "ArrowUp":
                keyText = "&uarr;";
                break;
            case "ArrowRight":
                keyText = "&rarr;";
                break;
            default:
                keyText = "&darr;";
                break;
        }
    } else if (["Control", "Shift", "Backspace", "Enter", "CapsLock", "Alt", "Space"].includes(keyText)) {
        element.classList.add("kbd-small-text");

        switch (keyText) {
            case "Control":
                keyText = "CTRL";
                break;
            case "Shift":
                keyText = "SHIFT";
                break;
            case "Backspace":
                keyText = "BACK";
                break;
            case "Enter":
                keyText = "ENTER";
                break;
            case "Space":
                keyText = "SPACE";
                break;
            default:
                keyText = "CAPS";
                break;
        }
    } else {
        keyText = keyText.toUpperCase();
    }

    element.innerHTML = keyText;
};

const resetGameVariables = () => {
    activeShape = null;
    shapes = [];
    allRows = [];
    shapeCounter = 0;
    score = 0;
    ghostDivs = [];
    speedMS = 800;
    clearedLinesCount = 0;
    level = 1;
    hold = false;
    holdPiece = null;
    hardDropped = false;
    loopCount = 0;
    incrementLoopCount = false;
    highScoreEl.textContent = !highScore ? "" : highScore;
};

const game = async (existing, existingBag, existingNextBag, index) => {
    let currentBag, nextBag;

    if (existing) {
        currentBag = existingBag;
        nextBag = existingNextBag;
    } else {
        // Want to generate current bag and next bag to display pieces in "Next" box
        currentBag = bagGeneration();
        nextBag = bagGeneration();
    }

    for (let i = existing ? index : 0; i < currentBag.length; i++) {
        let shape = currentBag[i];

        // Block out
        for (let j = 0; j < shape.boxes.length; j++) {
            const { x, y } = shape.boxes[j];
            let targetRow = document.getElementById(`y${y}`);
            let targetBox = targetRow.children[x];
            let shapeId = targetBox.getAttribute("shapeId");

            // If there is an obstruction for any box of the spawning shape, end the game.
            if (shapeId !== null) {
                if (!existing && parseInt(shapeId) !== activeShape.shapeId) {
                    return endGame();
                }
            }
        }

        // Display the next shapes in the next sub-grid
        displayNextShapes(i, currentBag, nextBag);

        // Set the current shape to the activeShape global variable and start the shape drop.
        if (!existing) {
            shapeCounter++;
            shape.updateShapeId(shapeCounter);
            activeShape = shape;
        }
        await shapeDrop();

        if (existing) {
            existing = false;
        }

        // The shapeDrop function will be cancelled if the user presses the hold piece key.
        if (hold) {
            // Clear existing piece
            for (let i = 0; i < 5; i++) {
                const section = document.getElementById(`hold-y${i}`);

                for (let j = 0; j < section.children.length; j++) {
                    section.children[j].setAttribute("class", "small-cell");
                }
            }

            // Reset Piece
            activeShape.populateShape(false);
            activeShape.resetShape(5, 0);

            // If the user swapped pieces with the currently held piece,
            // We don't want to mess with the order of the bag Generation, so we decrement i.
            if (holdPiece) {
                currentBag[i] = holdPiece;
                i--;
            }

            // Update the game variables.
            holdPiece = activeShape;
            hold = false;
            hasSwappedHold = true;

            // Display the held shape on the UI
            let newShape = createShapeByColor(holdPiece.color);
            newShape.resetShape(2, 1);
            newShape.populateShape(true, "hold");

            continue;
        }

        if (paused) {
            while (paused) {
                await delay(250);
            }

            return game(true, currentBag, nextBag, i);
        }

        // Update the game variables.
        hardDropped = false;
        hasSwappedHold = false;
        shapes.push(activeShape);

        // Check to see if any rows have been cleared and update the UI accordingly.
        await clearRows();

        // Last iteration re-query bag generation.
        if (i === 6) {
            currentBag = nextBag;
            nextBag = bagGeneration();
            i = -1;
        }
    }
};

const calculateCellSize = (target) => {
    let multiplier = 0.8;
    if (window.innerHeight < 800) {
        multiplier = 0.75;
    } else if (window.innerHeight < 650) {
        multiplier - 0.7;
    }

    let calculatedCellSize = (window.innerHeight * multiplier) / 18;

    if (target === "small-cell") {
        calculatedCellSize = calculatedCellSize / 1.5;
    }

    [...document.getElementsByClassName(target)].forEach((box) => {
        box.setAttribute("style", `height: ${calculatedCellSize}px; width: ${calculatedCellSize}px;`);
    });
};

const startGame = async () => {
    headerEl.classList.remove("display-none");
    wrapperEl.classList.remove("display-none");
    newHighScoreEl.classList.add("display-none");

    gameStart = true;

    // Instead of coding 180 individual divs, figured it would look cool to populate them incrementally to simulate "loading up" on the old systems.
    // Creates rows and divs for the game grid with a 10 ms delay between each to simulate loading effect.
    await populateGrid(5, 15, "next");
    await populateGrid(5, 5, "hold");
    await populateGrid(10, 18, "game-box");

    calculateCellSize("cell");
    calculateCellSize("small-cell");

    await countdown();

    // Game Loop
    await game();
};

// Event Listeners
document.addEventListener("keydown", (e) => {
    e.preventDefault();

    console.log(e.key);

    // Key the user pressed
    let key = e.key === " " ? "Space" : e.key;
    let { leftMoveKey, rightMoveKey, softDropKey, hardDropKey, leftRotateKey, rightRotateKey, holdPieceKey } = controlsData;

    if (changeControls) {
        // Check to see if target key is already used for another control
        let isMatchingKey = false;
        for (const control in controlsData) {
            if (key === controlsData[control]) {
                isMatchingKey = true;
                break;
            }
        }

        if (isMatchingKey) {
            // Update UI
            settingsInstrucEl.textContent = "Key is already in use, please try a different key";
        } else {
            // Update UI
            updateControlKey(key, targetChangeIcon);
            settingsInstrucEl.textContent = "Key bind successfully updated";

            // Update controls
            controlsData[targetChangeIcon.getAttribute("id")] = key;
            localStorage.setItem("blockGameControls", JSON.stringify(controlsData));
        }

        // Reset change variables
        targetChangeIcon.classList.remove("kbd-active");
        targetChangeIcon = null;
        changeControls = false;
    }

    if (key === "Escape" && gameStart) {
        if (paused) {
            modal.style.display = "none";
            paused = false;
        } else {
            modal.style.display = "flex";
            paused = true;
        }
    }

    if (userInput && !paused) {
        if ([leftMoveKey, rightMoveKey, softDropKey, hardDropKey].includes(key)) {
            // Need count of rows for updating score.
            const totalRows = activeShape.moveShape(key, true);

            if (key === leftMoveKey || key === rightMoveKey) {
                determineShadow();
            }

            // Hard drop has some special features.
            if (key === hardDropKey) {
                resetShadow();
                hardDropped = true;
                userInput = false;
                loopCount = 0;
            } else if (incrementLoopCount && loopCount < 10) {
                loopCount++;
            }

            // Increment score
            if (totalRows !== 0) {
                updateScore(totalRows);
            }
        } else if ([leftRotateKey, rightRotateKey].includes(key)) {
            // Rotate piece
            activeShape.rotatePiece(key === leftRotateKey ? 1 : 2);
            determineShadow();
        } else if (key === holdPieceKey) {
            // Hold piece
            if (!hasSwappedHold) {
                hold = true;
            }
        }
    }
});
startBtnEl.addEventListener("click", async () => {
    highScoreEl.textContent = !highScore ? "" : highScore;
    startScreenEl.classList.add("display-none");
    copyrightEl.classList.add("display-none");

    return startGame();
});
settingsEl.addEventListener("click", () => {
    startScreenEl.classList.add("display-none");
    settingsScreenEl.classList.remove("display-none");
    goBackEl.classList.remove("display-none");
});
[goBackEl, goBackEndEl].forEach((icon) => {
    icon.addEventListener("click", () => {
        if (icon.id === "go-back-end") {
            resetGameVariables();
        }

        endScreenEl.classList.add("display-none");
        startScreenEl.classList.remove("display-none");
        settingsScreenEl.classList.add("display-none");
        goBackEl.classList.add("display-none");
    });
});
keyIconEls.forEach((keyIcon) => {
    keyIcon.addEventListener("click", () => {
        if (!changeControls) {
            keyIcon.classList.add("kbd-active");
            changeControls = true;
            targetChangeIcon = keyIcon;
            settingsInstrucEl.textContent = "Press any key...";
        }
    });
});
playAgainEl.addEventListener("click", () => {
    endScreenEl.classList.add("display-none");
    resetGameVariables();
    return startGame();
});
window.addEventListener("resize", () => {
    calculateCellSize("cell");
    calculateCellSize("small-cell");
});

onLoadUI();
