const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const populateGrid = async () => {

    await delay(1000);

    // Main grid
    for (let i = 0; i < 18; i++) {
        const section = document.createElement("section");
        section.setAttribute("id", `y${i}`);
        section.classList.add("section");

        document.getElementById("game-box").appendChild(section);

        for (let j = 0; j < 10; j++) {
            const div = document.createElement("div");
            div.classList.add("cell");
            section.appendChild(div);
            await delay(10);
        }
    }
}

populateGrid();