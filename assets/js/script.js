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

    // Sub-Grids
    for (let i = 0; i < 5; i++) {
        const sectionOne = document.createElement("article");
        sectionOne.setAttribute("id", `next-y${i}`);
        sectionOne.setAttribute("class", "section");
        document.getElementById("next").appendChild(sectionOne);

        const sectionTwo = document.createElement("article");
        sectionTwo.setAttribute("id", `hold-y${i}`);
        sectionTwo.setAttribute("class", "section");
        document.getElementById("hold").appendChild(sectionTwo);

        for (let j = 0; j < 5; j++) {
            const divOne = document.createElement("div");
            divOne.setAttribute("class", "small-cell");
            sectionOne.appendChild(divOne);

            const divTwo = document.createElement("div");
            divTwo.setAttribute("class", "small-cell");
            sectionTwo.appendChild(divTwo);
        }
    }

}

populateGrid();