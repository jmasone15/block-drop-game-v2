const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const populateGrid = async () => {

    await delay(1000);

    // Main grid
    for (let i = 0; i < 18; i++) {
        const section = document.createElement("section");

        section.id = `y${i}`;
        document.getElementById("game-box").appendChild(section);

        for (let j = 0; j < 10; j++) {
            const div = document.createElement("div");
            div.classList.add("cell");
            section.appendChild(div);
            await delay(10);
        }
    }

    // Sub-Grids
    for (let i = 0; i < 5; i++) {
        const sectionOne = document.createElement("section");
        const sectionTwo = document.createElement("section");

        sectionOne.id = `next-y${i}`;
        sectionTwo.id = `hold-y${i}`

        document.getElementById("next").appendChild(sectionOne);
        document.getElementById("hold").appendChild(sectionTwo);

        for (let j = 0; j < 5; j++) {
            const divOne = document.createElement("div");
            const divTwo = document.createElement("div");

            divOne.classList.add("small-cell");
            divTwo.classList.add("small-cell");

            sectionOne.appendChild(divOne);
            sectionTwo.appendChild(divTwo);
        }
    }

}

populateGrid();