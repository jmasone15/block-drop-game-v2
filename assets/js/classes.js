// X goes from 0 to 9
// Y goes from 0 to 17
class Box {
    constructor(x, y, color, shapeId) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.shapeId = shapeId;
    }

    updateDom(show, target) {

        const row = !target ? document.getElementById(`y${this.y}`) : document.getElementById(`${target}-y${this.y}`);
        const div = row.children[this.x];

        if (show) {
            div.classList.add(this.color);
            div.setAttribute("shapeId", this.shapeId);
        } else {
            div.classList.remove(this.color);
            div.removeAttribute("shapeId");
        }
    }

    canBoxMove(targetX, targetY, direction) {
        let x = this.x;
        let y = this.y;

        if (!targetX || !targetY) {
            switch (direction) {
                case controlsData.leftMoveKey:
                    x--
                    break;
                case controlsData.rightMoveKey:
                    x++
                    break;
                case controlsData.softDropKey:
                    y++
                    break;
                default:
                    break;
            }
        } else {
            x = targetX;
            y = targetY;
        }

        // Blocked by borders
        if (x < 0 || x > 9 || y < 0 || y > 17) {
            return false
        }

        // Blocked by other shape
        const targetRow = document.getElementById(`y${y}`);
        const targetBox = targetRow.children[x];
        const shapeId = targetBox.getAttribute("shapeId");

        return shapeId === null || parseInt(shapeId) === this.shapeId
    }
}

// L piece (light-blue) | O piece (yellow) | T piece (magenta) | S piece (green)
// Z piece (red) | J piece (blue) | L piece (orange)
class Shape {
    constructor(x, y, shapeId) {
        this.x = x;
        this.y = y;
        this.position = 1;
        this.color = "";
        this.shapeId = shapeId;
    }

    populateShape(show, isSmall) {
        for (let i = 0; i < this.boxes.length; i++) {
            this.boxes[i].updateDom(show, isSmall);
        }
    }

    canShapeMove(direction, newPositions) {
        let boxesCanMove;

        if (!direction) {
            boxesCanMove = this.boxes.filter((x, i) => x.canBoxMove(newPositions[i].x, newPositions[i].y));
        } else {
            boxesCanMove = this.boxes.filter(x => x.canBoxMove(null, null, direction));
        }

        return boxesCanMove.length === this.boxes.length
    }

    moveShape(direction, user) {
        let count = 0;

        if (this.canShapeMove(direction)) {

            this.populateShape(false);

            for (let i = 0; i < this.boxes.length; i++) {
                switch (direction) {
                    case controlsData.leftMoveKey:
                        this.boxes[i].x--
                        break;
                    case controlsData.rightMoveKey:
                        this.boxes[i].x++
                        break;
                    case controlsData.softDropKey:
                        this.boxes[i].y++
                        break;
                    default:
                        count += this.hardDrop();
                        break;
                }
            }


            this.populateShape(true);

            if (direction === controlsData.hardDropKey) {
                count = count * 2;
            } else if (user && direction === controlsData.softDropKey) {
                count = 1;
            }

        }

        return count;
    }

    rotatePiece(num) {

        const newPositions = this.getRotatedPositions(num);
        const outOfBounds = newPositions.filter(value => value.x < 0 || value.x > 9 || value.y < 0);
        let positions;

        if (outOfBounds.length !== 0) {
            positions = this.wallKick(newPositions);
        } else {
            positions = newPositions;
        }

        if (this.canShapeMove("", positions)) {
            this.populateShape(false);

            if (num === 1) {
                if (this.position === 1) {
                    this.position = 4
                } else {
                    this.position--
                }
            } else {
                if (this.position === 4) {
                    this.position = 1
                } else {
                    this.position++
                }
            }

            for (let i = 0; i < this.boxes.length; i++) {
                this.boxes[i].x = positions[i].x
                this.boxes[i].y = positions[i].y
            }

            this.populateShape(true);
        }
    }

    updateShapeId(id) {
        this.shapeId = id

        for (let i = 0; i < this.boxes.length; i++) {
            this.boxes[i].shapeId = this.shapeId
        }
    }

    // Change this to be a property of the extended shape class
    getFocalIndex() {
        if (this.color === "light-blue" || this.color === "blue" || this.color === "magenta" || this.color === "red") {
            return 2
        } else {
            return 1
        }
    }

    wallKick(newPositions) {
        let xPositions = newPositions.map(value => value.x);
        let yPositions = newPositions.map(value => value.y);
        let kickedPositions;

        // Right Kick
        if (xPositions.some(num => num < 0)) {
            kickedPositions = newPositions.map((value) => { return { x: value.x + 1, y: value.y } })
        }

        // Left Kick
        if (xPositions.some(num => num > 9)) {
            kickedPositions = newPositions.map((value) => { return { x: value.x - 1, y: value.y } })
        }

        // Down Kick
        if (yPositions.some(num => num < 0)) {
            kickedPositions = newPositions.map((value) => { return { x: value.x, y: value.y + 1 } })
        }

        return kickedPositions
    }

    hardDrop() {
        let iteration = 0;
        while (this.canShapeMove(controlsData.softDropKey)) {
            this.moveShape(controlsData.softDropKey);
            iteration++
        }

        return iteration
    }
}

class I extends Shape {
    constructor(x, y, position, color, shapeId) {
        super(x, y, position, color, shapeId);
        this.color = "light-blue";
        this.focalBox = new Box(x, y, this.color, this.shapeId, 3);
        this.boxes = [
            new Box(x - 2, y, this.color, this.shapeId, 1),
            new Box(x - 1, y, this.color, this.shapeId, 2),
            this.focalBox,
            new Box(x + 1, y, this.color, this.shapeId, 4)
        ]
    }

    getRotatedPositions(num) {
        let box0 = { x: this.boxes[0].x, y: this.boxes[0].y };
        let box1 = { x: this.boxes[1].x, y: this.boxes[1].y };
        let box2 = { x: this.boxes[2].x, y: this.boxes[2].y };
        let box3 = { x: this.boxes[3].x, y: this.boxes[3].y };

        if (num === 1) {
            switch (this.position) {
                case 1:
                    box0.x++
                    box0.y += 2

                    box1.y++

                    box2.x--

                    box3.x += -2
                    box3.y--

                    break;

                case 2:
                    box0.x += -2
                    box0.y++

                    box1.x--

                    box2.y--

                    box3.x++
                    box3.y += -2

                    break;

                case 3:
                    box0.x--
                    box0.y += -2

                    box1.y--

                    box2.x++

                    box3.x += 2
                    box3.y++

                    break;

                default:
                    box0.x += 2
                    box0.y--

                    box1.x++

                    box2.y++

                    box3.x--
                    box3.y += 2

                    break;
            }
        } else {
            switch (this.position) {
                case 1:
                    box0.x += 2
                    box0.y--

                    box1.x++

                    box2.y++

                    box3.x--
                    box3.y += 2

                    break;

                case 2:
                    box0.x++
                    box0.y += 2

                    box1.y++

                    box2.x--

                    box3.x += -2
                    box3.y--

                    break;

                case 3:
                    box0.x += -2
                    box0.y++

                    box1.x--

                    box2.y--

                    box3.x++
                    box3.y += -2

                    break;

                default:
                    box0.x--
                    box0.y -= 2

                    box1.y--

                    box2.x++

                    box3.x += 2
                    box3.y++

                    break;
            }
        }

        return [box0, box1, box2, box3]
    }

    resetShape(x, y) {
        this.x = x;
        this.y = y;

        this.focalBox.x = x;
        this.focalBox.y = y;

        this.boxes = [
            new Box(x - 2, y, this.color, this.shapeId, 1),
            new Box(x - 1, y, this.color, this.shapeId, 2),
            this.focalBox,
            new Box(x + 1, y, this.color, this.shapeId, 4)
        ]

        this.position = 1;
    }
}

class J extends Shape {
    constructor(x, y, position, color, shapeId) {
        super(x, y, position, color, shapeId);
        this.color = "blue";
        this.focalBox = new Box(x, y + 1, this.color, this.shapeId, 3);
        this.boxes = [
            new Box(x - 1, y, this.color, this.shapeId, 1),
            new Box(x - 1, y + 1, this.color, this.shapeId, 2),
            this.focalBox,
            new Box(x + 1, y + 1, this.color, this.shapeId, 3)
        ]
    }

    getRotatedPositions(num) {
        let box0 = { x: this.boxes[0].x, y: this.boxes[0].y };
        let box1 = { x: this.boxes[1].x, y: this.boxes[1].y };
        let box2 = { x: this.boxes[2].x, y: this.boxes[2].y };
        let box3 = { x: this.boxes[3].x, y: this.boxes[3].y };

        if (num === 1) {
            switch (this.position) {
                case 1:
                    box0.y += 2

                    box1.x++
                    box1.y++

                    box3.x--
                    box3.y--

                    break;

                case 2:
                    box0.x -= 2

                    box1.x--
                    box1.y++

                    box3.x++
                    box3.y--

                    break;

                case 3:
                    box0.y -= 2

                    box1.x--
                    box1.y--

                    box3.x++
                    box3.y++

                    break;

                default:
                    box0.x += 2

                    box1.x++
                    box1.y--

                    box3.x--
                    box3.y++

                    break;
            }
        } else {
            switch (this.position) {
                case 1:
                    box0.x += 2

                    box1.x++
                    box1.y--

                    box3.x--
                    box3.y++
                    break;

                case 2:
                    box0.y += 2;

                    box1.x++
                    box1.y++

                    box3.x--
                    box3.y--

                    break;

                case 3:
                    box0.x -= 2

                    box1.x--
                    box1.y++

                    box3.x++
                    box3.y--

                    break;

                default:
                    box0.y -= 2

                    box1.y--
                    box1.x--

                    box3.x++
                    box3.y++

                    break;
            }
        }

        return [box0, box1, box2, box3]
    }

    resetShape(x, y) {
        this.x = x;
        this.y = y;

        this.focalBox.x = x;
        this.focalBox.y = y + 1;

        this.boxes = [
            new Box(x - 1, y, this.color, this.shapeId, 1),
            new Box(x - 1, y + 1, this.color, this.shapeId, 2),
            this.focalBox,
            new Box(x + 1, y + 1, this.color, this.shapeId, 3)
        ]

        this.position = 1;
    }
}

class L extends Shape {
    constructor(x, y, position, color, shapeId) {
        super(x, y, position, color, shapeId);
        this.color = "orange";
        this.focalBox = new Box(x, y + 1, this.color, this.shapeId, 2);
        this.boxes = [
            new Box(x - 1, y + 1, this.color, this.shapeId, 1),
            this.focalBox,
            new Box(x + 1, y + 1, this.color, this.shapeId, 3),
            new Box(x + 1, y, this.color, this.shapeId, 4)
        ]
    }

    getRotatedPositions(num) {
        let box0 = { x: this.boxes[0].x, y: this.boxes[0].y };
        let box1 = { x: this.boxes[1].x, y: this.boxes[1].y };
        let box2 = { x: this.boxes[2].x, y: this.boxes[2].y };
        let box3 = { x: this.boxes[3].x, y: this.boxes[3].y };

        if (num === 1) {
            switch (this.position) {
                case 1:
                    box0.x++
                    box0.y++

                    box2.x--
                    box2.y--

                    box3.x -= 2

                    break;

                case 2:
                    box0.x--
                    box0.y++

                    box2.x++
                    box2.y--

                    box3.y -= 2

                    break;

                case 3:
                    box0.x--
                    box0.y--

                    box2.x++
                    box2.y++

                    box3.x += 2

                    break;

                default:
                    box0.x++
                    box0.y--

                    box2.x--
                    box2.y++

                    box3.y += 2

                    break;
            }
        } else {
            switch (this.position) {
                case 1:
                    box0.x++
                    box0.y--

                    box2.x--
                    box2.y++

                    box3.y += 2

                    break;

                case 2:
                    box0.x++
                    box0.y++

                    box2.x--
                    box2.y--

                    box3.x -= 2

                    break;

                case 3:
                    box0.x--
                    box0.y++

                    box2.x++
                    box2.y--

                    box3.y -= 2

                    break;

                default:
                    box0.x--
                    box0.y--

                    box2.x++
                    box2.y++

                    box3.x += 2

                    break;
            }
        }

        return [box0, box1, box2, box3]
    }

    resetShape(x, y) {
        this.x = x;
        this.y = y;

        this.focalBox.x = x;
        this.focalBox.y = y + 1;

        this.boxes = [
            new Box(x - 1, y + 1, this.color, this.shapeId, 1),
            this.focalBox,
            new Box(x + 1, y + 1, this.color, this.shapeId, 3),
            new Box(x + 1, y, this.color, this.shapeId, 4)
        ]

        this.position = 1;
    }
}

class O extends Shape {
    constructor(x, y, position, color, shapeId) {
        super(x, y, position, color, shapeId);
        this.color = "yellow";
        this.focalBox = new Box(x, y, this.color, this.shapeId, 2);
        this.boxes = [
            new Box(x - 1, y, this.color, this.shapeId, 1),
            this.focalBox,
            new Box(x - 1, y + 1, this.color, this.shapeId, 3),
            new Box(x, y + 1, this.color, this.shapeId, 4)
        ]
    }

    getRotatedPositions() {
        let box0 = { x: this.boxes[0].x, y: this.boxes[0].y };
        let box1 = { x: this.boxes[1].x, y: this.boxes[1].y };
        let box2 = { x: this.boxes[2].x, y: this.boxes[2].y };
        let box3 = { x: this.boxes[3].x, y: this.boxes[3].y };

        return [box0, box1, box2, box3]
    }

    resetShape(x, y) {
        this.x = x;
        this.y = y;

        this.focalBox.x = x;
        this.focalBox.y = y;

        this.boxes = [
            new Box(x - 1, y, this.color, this.shapeId, 1),
            this.focalBox,
            new Box(x - 1, y + 1, this.color, this.shapeId, 3),
            new Box(x, y + 1, this.color, this.shapeId, 4)
        ]

        this.position = 1;
    }
}

class S extends Shape {
    constructor(x, y, position, color, shapeId) {
        super(x, y, position, color, shapeId);
        this.color = "green";
        this.focalBox = new Box(x, y + 1, this.color, this.shapeId, 2);
        this.boxes = [
            new Box(x - 1, y + 1, this.color, this.shapeId, 1),
            this.focalBox,
            new Box(x, y, this.color, this.shapeId, 3),
            new Box(x + 1, y, this.color, this.shapeId, 4)
        ]
    }

    getRotatedPositions(num) {
        let box0 = { x: this.boxes[0].x, y: this.boxes[0].y };
        let box1 = { x: this.boxes[1].x, y: this.boxes[1].y };
        let box2 = { x: this.boxes[2].x, y: this.boxes[2].y };
        let box3 = { x: this.boxes[3].x, y: this.boxes[3].y };

        if (num === 1) {
            switch (this.position) {
                case 1:
                    box0.x++
                    box0.y++

                    box2.x--
                    box2.y++

                    box3.x -= 2

                    break;

                case 2:
                    box0.x--
                    box0.y++

                    box2.x--
                    box2.y--

                    box3.y -= 2

                    break;

                case 3:
                    box0.x--
                    box0.y--

                    box2.x++
                    box2.y--

                    box3.x += 2

                    break;

                default:
                    box0.x++
                    box0.y--

                    box2.x++
                    box2.y++

                    box3.y += 2

                    break;
            }
        } else {
            switch (this.position) {
                case 1:
                    box0.x++
                    box0.y--

                    box2.x++
                    box2.y++

                    box3.y += 2

                    break;

                case 2:
                    box0.x++
                    box0.y++

                    box2.x--
                    box2.y++

                    box3.x -= 2

                    break;

                case 3:
                    box0.x--
                    box0.y++

                    box2.x--
                    box2.y--

                    box3.y -= 2

                    break;

                default:
                    box0.x--
                    box0.y--

                    box2.x++
                    box2.y--

                    box3.x += 2

                    break;
            }
        }

        return [box0, box1, box2, box3]
    }

    resetShape(x, y) {
        this.x = x;
        this.y = y;

        this.focalBox.x = x;
        this.focalBox.y = y + 1;

        this.boxes = [
            new Box(x - 1, y + 1, this.color, this.shapeId, 1),
            this.focalBox,
            new Box(x, y, this.color, this.shapeId, 3),
            new Box(x + 1, y, this.color, this.shapeId, 4)
        ]

        this.position = 1;
    }
}

class T extends Shape {
    constructor(x, y, position, color, shapeId) {
        super(x, y, position, color, shapeId);
        this.color = "magenta";
        this.focalBox = new Box(x, y + 1, this.color, this.shapeId, 3);
        this.boxes = [
            new Box(x - 1, y + 1, this.color, this.shapeId, 1),
            new Box(x, y, this.color, this.shapeId, 2),
            this.focalBox,
            new Box(x + 1, y + 1, this.color, this.shapeId, 4)
        ]
    }

    getRotatedPositions(num) {
        let box0 = { x: this.boxes[0].x, y: this.boxes[0].y };
        let box1 = { x: this.boxes[1].x, y: this.boxes[1].y };
        let box2 = { x: this.boxes[2].x, y: this.boxes[2].y };
        let box3 = { x: this.boxes[3].x, y: this.boxes[3].y };

        if (num === 1) {
            switch (this.position) {
                case 1:
                    box0.x++
                    box0.y++

                    box1.x--
                    box1.y++

                    box3.x--
                    box3.y--
                    break;

                case 2:
                    box0.x--
                    box0.y++

                    box1.x--
                    box1.y--

                    box3.x++
                    box3.y--
                    break;

                case 3:
                    box0.x--
                    box0.y--

                    box1.x++
                    box1.y--

                    box3.x++
                    box3.y++
                    break;

                default:
                    box0.x++
                    box0.y--

                    box1.x++
                    box1.y++

                    box3.x--
                    box3.y++
                    break;
            }
        } else {
            switch (this.position) {
                case 1:
                    box0.x++
                    box0.y--

                    box1.x++
                    box1.y++

                    box3.x--
                    box3.y++
                    break;

                case 2:
                    box0.x++
                    box0.y++

                    box1.x--
                    box1.y++

                    box3.x--
                    box3.y--
                    break;

                case 3:
                    box0.x--
                    box0.y++

                    box1.x--
                    box1.y--

                    box3.x++
                    box3.y--
                    break;

                default:
                    box0.x--
                    box0.y--

                    box1.x++
                    box1.y--

                    box3.x++
                    box3.y++
                    break;
            }
        }

        return [box0, box1, box2, box3]
    }

    resetShape(x, y) {
        this.x = x;
        this.y = y;

        this.focalBox.x = x;
        this.focalBox.y = y + 1;

        this.boxes = [
            new Box(x - 1, y + 1, this.color, this.shapeId, 1),
            new Box(x, y, this.color, this.shapeId, 2),
            this.focalBox,
            new Box(x + 1, y + 1, this.color, this.shapeId, 4)
        ]

        this.position = 1;
    }
}

class Z extends Shape {
    constructor(x, y, position, color, shapeId) {
        super(x, y, position, color, shapeId);
        this.color = "red";
        this.focalBox = new Box(x, y + 1, this.color, this.shapeId, 3);
        this.boxes = [
            new Box(x - 1, y, this.color, this.shapeId, 1),
            new Box(x, y, this.color, this.shapeId, 2),
            this.focalBox,
            new Box(x + 1, y + 1, this.color, this.shapeId, 4)
        ]
    }

    getRotatedPositions(num) {
        let box0 = { x: this.boxes[0].x, y: this.boxes[0].y };
        let box1 = { x: this.boxes[1].x, y: this.boxes[1].y };
        let box2 = { x: this.boxes[2].x, y: this.boxes[2].y };
        let box3 = { x: this.boxes[3].x, y: this.boxes[3].y };

        if (num === 1) {
            switch (this.position) {
                case 1:
                    box0.y += 2

                    box1.x--
                    box1.y++

                    box3.x--
                    box3.y--
                    break;

                case 2:
                    box0.x -= 2

                    box1.x--
                    box1.y--

                    box3.x++
                    box3.y--
                    break;

                case 3:
                    box0.y -= 2

                    box1.x++
                    box1.y--

                    box3.x++
                    box3.y++
                    break;

                default:
                    box0.x += 2

                    box1.x++
                    box1.y++

                    box3.x--
                    box3.y++
                    break;
            }
        } else {
            switch (this.position) {
                case 1:
                    box0.x += 2

                    box1.x++
                    box1.y++

                    box3.x--
                    box3.y++
                    break;

                case 2:
                    box0.y += 2

                    box1.x--
                    box1.y++

                    box3.x--
                    box3.y--
                    break;

                case 3:
                    box0.x -= 2

                    box1.x--
                    box1.y--

                    box3.x++
                    box3.y--
                    break;

                default:
                    box0.y -= 2

                    box1.x++
                    box1.y--

                    box3.x++
                    box3.y++
                    break;
            }
        }

        return [box0, box1, box2, box3]
    }

    resetShape(x, y) {
        this.x = x;
        this.y = y;

        this.focalBox.x = x;
        this.focalBox.y = y + 1;

        this.boxes = [
            new Box(x - 1, y, this.color, this.shapeId, 1),
            new Box(x, y, this.color, this.shapeId, 2),
            this.focalBox,
            new Box(x + 1, y + 1, this.color, this.shapeId, 4)
        ]

        this.position = 1;
    }
}