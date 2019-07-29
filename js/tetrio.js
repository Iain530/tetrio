$(document).ready(function() {

    var width = 300;
    var height = 420;

    // keep at 60
    var fps = 60;
    var frame = 0;

    var gravity = 0.9;
    var jumpPower = 9.2;

    var levelspeed = 30;
    var winHeight = 150;

    var jumpingman;
    var jumpingmanImage = new Image();
    mario_src = "https://elekk.xyz/system/custom_emojis/images/000/000/009/static/mario_original_sprite_sm.png";
    jumpingmanImage.src = mario_src;

    var no_coins = 1;
    var max_no_coins = 4;
    var coins = [];
    var coinImage = new Image();
    coinImage.src = "img/coin.png";

    var allBlocksImage = new Image();
    allBlocksImage.src = "img/all.png";

    var types = ["square", "line", "T", "S", "Z", "L", "J"];
    var colours = ["red", "yellow", "pink", "orange", "blue", "green", "cyan"];

    var shapes = [];
    var controlShape;
    var fastFall = false;

    var finished = false;
    var paused = false;
    var score = 0;
    var level = 1;
    var scoreThresh = 100;
    var lastScore = 0;

    var myGameArea = {
        canvas: document.querySelector("canvas"),
        start: function() {
            this.canvas.width = width;
            this.canvas.height = height;
            this.context = this.canvas.getContext("2d");
            // Make background
            this.context.fillStyle = "black";
            this.context.fillRect(0, 0, width, height);
            this.interval = setInterval(updateGameArea, 1000 / fps);
        },
        clear: function() {
            this.context.fillStyle = "black";
            this.context.fillRect(0, 0, width, height);
        }
    };

    function Coin() {
        tryy = Math.floor(Math.random() * height / 20) * 20;
        while (tryy < winHeight || tryy > height - 40) tryy = Math.floor(Math.random() * height / 20) * 20;
        this.x = Math.floor(Math.random() * width / 20) * 20;
        this.y = tryy;
        this.rot = 0;

        this.move = function() {
            do {
                tryx = Math.floor(Math.random() * width / 20) * 20;
                tryy = Math.floor(Math.random() * (height - winHeight - 20) / 20) * 20 + winHeight;
                // while (tryy < winHeight || tryy > height - 40) tryy = Math.floor(Math.random() * height / 20) * 20;
                space = [new Space(tryx, tryy)];
            } while (!isFree(space) || !noCoinAt(tryx, tryy) || nearJumper(tryx, tryy, 25));

            // tryx = Math.floor(Math.random() * width / 20) * 20;
            // tryy = Math.floor(Math.random() * height / 20) * 20;
            // while (tryy < winHeight || tryy > height - 40) tryy = Math.floor(Math.random() * height / 20) * 20;
            // space = [new Space(tryx, tryy)];

            this.x = tryx;
            this.y = tryy;
        }
        this.update = function() {
            if (frame % 4 == 0) {
                this.rot++;
                this.rot = this.rot % 18;
            }
            var cx = myGameArea.context;
            cx.drawImage(coinImage, 0 + this.rot * 20, 0, 20, 20, this.x, this.y, 20, 20);
        }
    }

    function noCoinAt(x, y) {
        return coins.every(function(currentValue) {
            return x != currentValue.x && y != currentValue.y;
        });
    }

    function nearJumper(x, y, lim) {
        return x + lim > jumpingman.x && x - lim < jumpingman.x && y + lim > jumpingman.y && y - lim < jumpingman.y;
    }

    function checkCoinCollect(coin) {
        if (jumpingman.x + 20 > coin.x && jumpingman.x < coin.x + 20 && jumpingman.y + 19 > coin.y && jumpingman.y < coin.y + 20) {
            score += 50;
            coin.move();
        }
    }

    function jumper(colour, x, y) {
        this.colour = colour;
        this.x = x;
        this.y = y;
        this.xSpeed = 0;
        this.ySpeed = 0;
        this.grounded = true;
        this.image = jumpingmanImage;

        this.direction = "r";
        this.jumping = false;
        this.walking = false;

        this.move = function() {
            this.x += this.xSpeed;
            if (this.x < 0) {
                this.x = 0;
            }
            if (this.x > width - 20) {
                this.x = width - 20;
            }

            this.ySpeed += gravity;
            this.y += this.ySpeed;
            if (this.y > height - 20) {
                this.y = height - 20;
                this.ySpeed = 0;
                this.grounded = true;
                this.jumping = false;
            } else {
                this.grounded = false;
            }
        };

        this.update = function() {
            checkJumperCollision(this);
            var cx = myGameArea.context;
            cx.fillStyle = this.colour;
            //cx.fillRect(this.x, this.y, 20, 20);
            // if (this.walking) {
            //     if (frame % 10 >= 5)
            //         xdraw = 3;
            //     else
            //         xdraw = 2;
            // } else {
            //     if (frame % 30 > 15)
            //         xdraw = 1;
            //     else
            //         xdraw = 0;
            // }
            // if (this.jumping) xdraw = 4;
            // if (this.direction == "r") ydraw = 1;
            // else ydraw = 0;
            // cx.drawImage(jumpingmanImage, xdraw * 20, ydraw * 20, 20, 20, this.x, this.y, 19, 19);
            cx.drawImage(jumpingmanImage, 0, 0, 19, 19, this.x, this.y, 19, 19);
        };
    }

    function block(colour, x, y) {
        this.colour = colour;
        this.x = x;
        this.y = y;

        this.imagex = colours.indexOf(this.colour) * 32;

        this.move = function(x, y) {
            this.x += x;
            this.y += y;
        }

        this.update = function() {
            var cx = myGameArea.context;
            cx.fillStyle = this.colour;
            // cx.fillRect(this.x, this.y, 19, 19);
            cx.drawImage(allBlocksImage, this.imagex, 0, 20, 20, this.x, this.y, 20, 20);
        }
    }

    function shape(colour, x, y, type) {
        this.colour = colour;
        this.x = x;
        this.y = y;
        this.type = type;
        this.landed = false;
        this.rot = 0;


        if (this.type == "square") {
            this.blocks = [
                new block(colour, x, y),
                new block(colour, x + 20, y),
                new block(colour, x, y + 20),
                new block(colour, x + 20, y + 20)
            ];
        } else if (this.type == "line") {
            this.blocks = [
                new block(colour, x - 20, y),
                new block(colour, x, y),
                new block(colour, x + 20, y),
                new block(colour, x + 40, y)
            ];
        } else if (this.type == "T") {
            this.blocks = [
                new block(colour, x, y - 20),
                new block(colour, x - 20, y),
                new block(colour, x, y),
                new block(colour, x + 20, y)
            ];
        } else if (this.type == "S") {
            this.blocks = [
                new block(colour, x, y - 20),
                new block(colour, x + 20, y - 20),
                new block(colour, x - 20, y),
                new block(colour, x, y),
            ];
        } else if (this.type == "Z") {
            this.blocks = [
                new block(colour, x - 20, y - 20),
                new block(colour, x, y - 20),
                new block(colour, x, y),
                new block(colour, x + 20, y)
            ];
        } else if (this.type == "L") {
            this.blocks = [
                new block(colour, x + 20, y - 20),
                new block(colour, x - 20, y),
                new block(colour, x, y),
                new block(colour, x + 20, y),
            ];
        } else if (this.type == "J") {
            this.blocks = [
                new block(colour, x - 20, y - 20),
                new block(colour, x - 20, y),
                new block(colour, x, y),
                new block(colour, x + 20, y)
            ];
        }

        this.rotate = function() {
            if (this.type == "line") {
                switch (this.rot) {
                    case 0:
                        this.blocks = [
                            new block(this.colour, this.x + 20, this.y - 20),
                            new block(this.colour, this.x + 20, this.y),
                            new block(this.colour, this.x + 20, this.y + 20),
                            new block(this.colour, this.x + 20, this.y + 40)
                        ];
                        break;
                    case 1:
                        this.blocks = [
                            new block(this.colour, this.x - 20, this.y + 20),
                            new block(this.colour, this.x, this.y + 20),
                            new block(this.colour, this.x + 20, this.y + 20),
                            new block(this.colour, this.x + 40, this.y + 20)
                        ];
                        break;
                    case 2:
                        this.blocks = [
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x, this.y + 20),
                            new block(this.colour, this.x, this.y + 40)
                        ];
                        break;
                    case 3:
                        this.blocks = [
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y),
                            new block(this.colour, this.x + 40, this.y)
                        ];
                    default:
                        break;
                }
                this.rot++;
                this.rot = this.rot % 4;
            } else if (this.type == "T") {
                switch (this.rot) {
                    case 0:
                        this.blocks = [
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y),
                            new block(this.colour, this.x, this.y + 20),
                        ];
                        break;
                    case 1:
                        this.blocks = [
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y),
                            new block(this.colour, this.x, this.y + 20),
                        ];
                        break;
                    case 2:
                        this.blocks = [
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y + 20),
                        ];
                        break;
                    case 3:
                        this.blocks = [
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y)
                        ];
                        break;
                    default:
                        break;
                }
                this.rot++;
                this.rot = this.rot % 4;
            } else if (this.type == "S") {
                switch (this.rot) {
                    case 0:
                        this.blocks = [
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y),
                            new block(this.colour, this.x + 20, this.y + 20)
                        ];
                        break;
                    case 1:
                        this.blocks = [
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y),
                            new block(this.colour, this.x, this.y + 20),
                            new block(this.colour, this.x - 20, this.y + 20),
                        ];
                        break;
                    case 2:
                        this.blocks = [
                            new block(this.colour, this.x - 20, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y + 20)
                        ];
                        break;
                    case 3:
                        this.blocks = [
                            new block(this.colour, this.x + 20, this.y - 20),
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y),
                        ];
                        break;
                    default:
                        break;
                }
                this.rot++;
                this.rot = this.rot % 4;
            } else if (this.type == "Z") {
                switch (this.rot) {
                    case 0:
                        this.blocks = [
                            new block(this.colour, this.x + 20, this.y - 20),
                            new block(this.colour, this.x + 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x, this.y + 20)
                        ];
                        break;
                    case 1:
                        this.blocks = [
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x, this.y + 20),
                            new block(this.colour, this.x + 20, this.y + 20)
                        ];
                        break;
                    case 2:
                        this.blocks = [
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x - 20, this.y + 20),
                        ];
                        break;
                    case 3:
                        this.blocks = [
                            new block(this.colour, this.x - 20, this.y - 20),
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y)
                        ];
                        break;
                    default:
                        break;
                }
                this.rot++;
                this.rot = this.rot % 4;
            } else if (this.type == "L") {
                switch (this.rot) {
                    case 0:
                        this.blocks = [
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x, this.y + 20),
                            new block(this.colour, this.x + 20, this.y + 20),
                        ];
                        break;
                    case 1:
                        this.blocks = [
                            new block(this.colour, this.x + 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x - 20, this.y + 20),
                        ];
                        break;
                    case 2:
                        this.blocks = [
                            new block(this.colour, this.x - 20, this.y - 20),
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x, this.y + 20),
                        ];
                        break;
                    case 3:
                        this.blocks = [
                            new block(this.colour, this.x + 20, this.y - 20),
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y),
                        ];
                        break;
                    default:
                        break;
                }
                this.rot++;
                this.rot = this.rot % 4;
            } else if (this.type == "J") {
                switch (this.rot) {
                    case 0:
                        this.blocks = [
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x + 20, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x, this.y + 20),
                        ];
                        break;
                    case 1:
                        this.blocks = [
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y),
                            new block(this.colour, this.x + 20, this.y + 20)
                        ];
                        break;
                    case 2:
                        this.blocks = [
                            new block(this.colour, this.x, this.y - 20),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x, this.y + 20),
                            new block(this.colour, this.x - 20, this.y + 20)
                        ];
                        break;
                    case 3:
                        this.blocks = [
                            new block(this.colour, this.x - 20, this.y - 20),
                            new block(this.colour, this.x - 20, this.y),
                            new block(this.colour, this.x, this.y),
                            new block(this.colour, this.x + 20, this.y)
                        ];
                        break;
                    default:
                        break;
                }
                this.rot++;
                this.rot = this.rot % 4;
            }
        }

        this.move = function() {
            this.y += 20;
            var xdis;
            var ydis;

            var result = true;
            $.each(this.blocks, function(index, block) {
                if (block.y >= height - 20)
                    result = false;
            });
            if (!result) {
                this.y -= 20;
                xdis = 0;
                ydis = 0;
                this.landed = true;
            } else {
                xdis = 0;
                ydis = 20;
            }
            $.each(this.blocks, function(index, block) {
                block.move(xdis, ydis);
            });

            checkShapeCollision(this);

        }
        this.shift = function(direction) {
            if (direction == "right") {
                xdis = 20;
                this.x += 20;
            } else if (direction == "left") {
                xdis = -20;
                this.x -= 20;
            }
            $.each(this.blocks, function(index, block) {
                block.move(xdis, 0);
            });
        }
        this.update = function() {
            $.each(this.blocks, function(index, block) {
                block.update();
            });
        }
    }

    function createNewShape() {
        var i = Math.floor(Math.random() * types.length);
        var type = types[i];
        var colour = colours[i];
        var newShape = new shape(colour, 140, 0, type);
        shapes.push(newShape);
        return newShape;
    }

    function checkShapeCollision(movingShape) {
        // for
        $.each(shapes, function(index, shape) {
            if (shape != movingShape) {
                $.each(shape.blocks, function(index, block1) {
                    // loops
                    $.each(movingShape.blocks, function(index, block2) {
                        // are
                        if (block1.x == block2.x && block1.y == block2.y) {
                            // efficient
                            $.each(movingShape.blocks, function(index, moveblock) {
                                moveblock.move(0, -20);
                            });
                            movingShape.landed = true;
                            return;
                        }
                    });
                });
            }
        });

    }

    function canMove(shape, dir) {
        var result = true;
        if (dir == "left") {
            $.each(shape.blocks, function(index, block1) {
                if (block1.x <= 0)
                    result = false;

                $.each(shapes, function(index, staticShape) {
                    if (shape != staticShape) {
                        $.each(staticShape.blocks, function(index, block2) {
                            if (block1.x - 20 == block2.x && block1.y == block2.y) {
                                result = false;
                            }
                        });
                    }
                });
            });
            return result;
        } else {
            $.each(shape.blocks, function(index, block1) {
                if (block1.x >= width - 20)
                    result = false;

                $.each(shapes, function(index, staticShape) {
                    if (shape != staticShape) {
                        $.each(staticShape.blocks, function(index, block2) {
                            if (block1.x + 20 == block2.x && block1.y == block2.y) {
                                result = false;
                            }
                        });
                    }
                });
            });
            return result;
        }
    }


    function checkJumperCollision(jumper) {
        $.each(shapes, function(index, shape) {
            $.each(shape.blocks, function(index, block) {
                // stand on top
                if (block.x + 19 > jumper.x && jumper.x + 19 > block.x + 1 && block.y + 15 > jumper.y + 20 && jumper.y + 20 >= block.y && jumper.ySpeed >= 0) {
                    if (jumper.x + 17 == block.x && jumper.xSpeed == 3) {

                    } else if (jumper.x == block.x + 17 && jumper.xSpeed == -3) {

                    } else {
                        jumper.y = block.y - 20;
                        jumper.ySpeed = 0;
                        jumper.grounded = true;
                    }
                    // hit bottom
                } else if (block.x + 16 > jumper.x && jumper.x + 16 >= block.x && block.y + 20 > jumper.y + 5 && jumper.y + 20 >= block.y) {
                    // get squished
                    if (jumper.grounded)
                        lose();
                    // hit head on bottom while jumping
                    else {
                        jumper.y = block.y + 20;
                        jumper.ySpeed = 0;
                    }
                }
                // run into left side
                else if (block.x < jumper.x + 20 && block.x + 4 > jumper.x && block.y + 15 > jumper.y && block.y <= jumper.y + 20) {
                    jumper.x = block.x - 20;
                }
                // run into right side
                else if (block.x + 20 > jumper.x && block.x + 16 < jumper.x && block.y + 15 > jumper.y && block.y <= jumper.y + 20) {
                    jumper.x = block.x + 20;
                }

            });
        });
    }

    function lose() {
        finished = true;
        var context = myGameArea.canvas.getContext("2d");
        context.font = "30px Courier New";
        context.fillStyle = "white";
        context.fillText("Game Over!", width / 2 - 90, height / 2 - 25);
        context.fillText("Score: " + score, width / 2 - 90, height / 2 + 10);
        context.font = "20px Courier New";
        context.fillText("Enter to play again", width / 2 - 115, height / 2 + 40);
    }

    function restart() {
        finished = false;
        shapes = [];
        coins = []
        no_coins = 1;
        for (var i = 0; i < no_coins; i++) {
            coins.push(new Coin());
        }
        jumpingman = new jumper("white", 10, 500);
        controlShape = createNewShape();
        scoreThresh = 100;
        score = 0;
        level = 1;
        lastScore = 0;
        levelspeed = 30;
        winHeight = 150;
    }

    function updateScore() {
        var context = myGameArea.canvas.getContext("2d");
        context.font = "20px Courier New";
        context.fillStyle = "white";
        context.fillText("Score: " + score, 5, 20);
        context.fillText("Aim: " + (lastScore + scoreThresh), 5, 42);
        context.fillText("Level: " + level, 200, 20);
    }

    function drawWinHeight() {
        var context = myGameArea.canvas.getContext("2d");
        context.fillStyle = "red";
        if (score >= lastScore + scoreThresh) {
            context.fillStyle = "green";
        }
        context.fillRect(0, winHeight, width, 1);
    }

    function checkTetrisLose() {
        var result = false;
        $.each(shapes, function(index, shape) {
            if (shape.landed && shape.y < 40) {
                $.each(shape.blocks, function(index, block) {
                    if (block.y <= 0) {
                        lose();
                        result = true;
                    }
                });
            }
        });
    }

    function checkRows() {
        var i = height - 20;
        var tallest = i;
        var num = 0;
        while (i >= tallest) {
            var tot = 0;
            $.each(shapes, function(index, shape) {
                $.each(shape.blocks, function(index, block) {
                    tallest = Math.min(tallest, block.y);
                    if (block.y == i) {
                        tot++;
                    }
                });
            });
            if (tot == 15) {
                removeRow(i);
                num++;
            } else {
                i -= 20;
            }
        }
        score += (100 * num);
    }

    function removeRow(row) {
        $.each(shapes, function(index, shape) {
            var i;
            for (i = shape.blocks.length - 1; i >= 0; i--) {
                if (shape.blocks[i].y == row) {
                    shape.blocks.splice(i, 1);
                }
            }
        });
        $.each(shapes, function(index, shape) {
            var i;
            for (i = shape.blocks.length - 1; i >= 0; i--) {
                if (shape.blocks[i].y < row) {
                    shape.blocks[i].move(0, 20);
                }
            }
        });
    }

    function updateGameArea() {
        if (finished || paused) return;
        frame++;
        myGameArea.clear();
        checkMarioWin();
        drawWinHeight();
        if (frame % levelspeed == 0 || (fastFall && frame % 5 == 0)) {
            controlShape.move();
        }
        $.each(shapes, function(index, shape) {
            shape.update();
        });
        if (controlShape.landed) {
            if (checkTetrisLose()) return;
            checkRows();
            controlShape = createNewShape();
        }
        jumpingman.move()
        jumpingman.update();

        $.each(coins, function(index, coin) {
            checkCoinCollect(coin);
            coin.update();
        });

        updateScore();
    }

    function start() {
        jumpingman = new jumper("white", 10, 500);
        controlShape = createNewShape();
        coins = [];
        for (var i = 0; i < no_coins; i++) {
            coins.push(new Coin());
        }
        myGameArea.start();
    }

    function pause() {
        paused = !paused;
        if (paused) {
            var context = myGameArea.canvas.getContext("2d");
            context.font = "30px Courier New";
            context.fillStyle = "white";
            context.fillText("Paused", width / 2 - 55, height / 2 - 25);
            context.font = "20px Courier New";
            context.fillText("Press P to resume", width / 2 - 100, height / 2 + 10);
        }
    }

    function Space(x, y) {
        this.x = x;
        this.y = y;
    }

    function canRotate(shape) {
        if (shape.type == "square")
            return false;
        var result = true;
        var spaces = [];
        if (shape.type == "line") {
            switch (shape.rot) {
                case 0:
                    if (shape.y >= height - 40) return false;
                    spaces.push(
                        new Space(shape.x + 20, shape.y - 20),
                        new Space(shape.x + 20, shape.y + 20),
                        new Space(shape.x + 20, shape.y + 40)
                    );
                    result = isFree(spaces);
                    break;
                case 1:
                    if (shape.x < 20 || shape.x >= width - 40) return false;
                    spaces.push(
                        new Space(shape.x - 20, shape.y + 20),
                        new Space(shape.x, shape.y + 20),
                        new Space(shape.x + 40, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 2:
                    if (shape.y >= height - 40) return false;
                    spaces.push(
                        new Space(shape.x, shape.y - 20),
                        new Space(shape.x, shape.y),
                        new Space(shape.x, shape.y + 40)
                    );
                    result = isFree(spaces);
                    break;
                case 3:
                    if (shape.x < 20 || shape.x >= width - 40) return false;
                    spaces.push(
                        new Space(shape.x - 20, shape.y),
                        new Space(shape.x + 20, shape.y),
                        new Space(shape.x + 40, shape.y)
                    );
                    result = isFree(spaces);
                    break;
                default:
                    break;
            }
        } else if (shape.type == "T") {
            switch (shape.rot) {
                case 0:
                    if (shape.y > height - 40) return false;
                    spaces.push(
                        new Space(shape.x, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 1:
                    if (shape.x < 20) return false;
                    spaces.push(
                        new Space(shape.x - 20, shape.y)
                    );
                    result = isFree(spaces);
                    break;
                case 2:
                    spaces.push(
                        new Space(shape.x, shape.y - 20)
                    );
                    result = isFree(spaces);
                    break;
                case 3:
                    if (shape.x > width - 40) return false;
                    spaces.push(
                        new Space(shape.x + 20, shape.y)
                    );
                    result = isFree(spaces);
                    break;
                default:
                    break;
            }
        } else if (shape.type == "S") {
            switch (shape.rot) {
                case 0:
                    if (shape.y > height - 40) return false;
                    spaces.push(
                        new Space(shape.x + 20, shape.y),
                        new Space(shape.x + 20, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 1:
                    if (shape.x < 20) return false;
                    spaces.push(
                        new Space(shape.x, shape.y + 20),
                        new Space(shape.x - 20, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 2:
                    spaces.push(
                        new Space(shape.x - 20, shape.y),
                        new Space(shape.x - 20, shape.y - 20)
                    );
                    result = isFree(spaces);
                    break;
                case 3:
                    if (shape.x > width - 40) return false;
                    spaces.push(
                        new Space(shape.x, shape.y - 20),
                        new Space(shape.x + 20, shape.y - 20)
                    );
                    result = isFree(spaces);
                    break;
                default:
                    break;
            }
        } else if (shape.type == "Z") {
            switch (shape.rot) {
                case 0:
                    if (shape.y > height - 40) return false;
                    spaces.push(
                        new Space(shape.x + 20, shape.y - 20),
                        new Space(shape.x, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 1:
                    if (shape.x < 20) return false;
                    spaces.push(
                        new Space(shape.x - 20, shape.y),
                        new Space(shape.x + 20, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 2:
                    spaces.push(
                        new Space(shape.x - 20, shape.y + 20),
                        new Space(shape.x, shape.y - 20)
                    );
                    result = isFree(spaces);
                    break;
                case 3:
                    if (shape.x > width - 40) return false;
                    spaces.push(
                        new Space(shape.x - 20, shape.y - 20),
                        new Space(shape.x + 20, shape.y)
                    );
                    result = isFree(spaces);
                    break;
                default:
                    break;
            }
        } else if (shape.type == "L") {
            switch (shape.rot) {
                case 0:
                    if (shape.y > height - 40) return false;
                    spaces.push(
                        new Space(shape.x, shape.y - 20),
                        new Space(shape.x, shape.y + 20),
                        new Space(shape.x + 20, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 1:
                    if (shape.x < 20) return false;
                    spaces.push(
                        new Space(shape.x - 20, shape.y + 20),
                        new Space(shape.x - 20, shape.y),
                        new Space(shape.x + 20, shape.y)
                    );
                    result = isFree(spaces);
                    break;
                case 2:
                    spaces.push(
                        new Space(shape.x - 20, shape.y - 20),
                        new Space(shape.x, shape.y - 20),
                        new Space(shape.x, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 3:
                    if (shape.x > width - 40) return false;
                    spaces.push(
                        new Space(shape.x + 20, shape.y - 20),
                        new Space(shape.x + 20, shape.y),
                        new Space(shape.x - 20, shape.y)
                    );
                    result = isFree(spaces);
                    break;
                default:
                    break;
            }
        } else if (shape.type == "J") {
            switch (shape.rot) {
                case 0:
                    if (shape.y > height - 40) return false;
                    spaces.push(
                        new Space(shape.x + 20, shape.y - 20),
                        new Space(shape.x, shape.y - 20),
                        new Space(shape.x, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 1:
                    if (shape.x < 20) return false;
                    spaces.push(
                        new Space(shape.x - 20, shape.y),
                        new Space(shape.x + 20, shape.y),
                        new Space(shape.x + 20, shape.y + 20)
                    );
                    result = isFree(spaces);
                    break;
                case 2:
                    spaces.push(
                        new Space(shape.x - 20, shape.y + 20),
                        new Space(shape.x, shape.y + 20),
                        new Space(shape.x, shape.y - 20)
                    );
                    result = isFree(spaces);
                    break;
                case 3:
                    if (shape.x > width - 40) return false;
                    spaces.push(
                        new Space(shape.x - 20, shape.y - 20),
                        new Space(shape.x - 20, shape.y),
                        new Space(shape.x + 20, shape.y)
                    );
                    result = isFree(spaces);
                    break;
                default:
                    break;
            }
        }
        return result;
    }

    function isFree(spaces) {
        var result = true;
        $.each(shapes, function(index, shape) {
            $.each(shape.blocks, function(index, block) {
                $.each(spaces, function(index, space) {
                    if (block.x == space.x && block.y == space.y) {
                        result = false;
                    }
                })
            });
        });
        return result;
    }

    function checkMarioWin() {
        if (score < lastScore + scoreThresh) return false;
        if (jumpingman.y <= winHeight)
            increaseLevel();
    }

    function increaseLevel() {
        shapes = [];
        level++;
        lastScore = score;
        jumpingman = new jumper("white", 10, 500);
        controlShape = createNewShape();
        if (no_coins <= max_no_coins && level % 2 == 0) no_coins++;
        coins = []
        for (var i = 0; i < no_coins; i++) {
            coins.push(new Coin());
        }
        scoreThresh += 100 * (level - 1);
        if (levelspeed > 10) {
            levelspeed -= 3;
            if (levelspeed < 10) levelspeed = 10;
        }
        if (winHeight > 40) {
            winHeight -= 10;
        }

    }

    $(document).keydown(function(key) {
        if (!paused && !finished) {
            // jumpingman controls
            // Up
            if (key.which == 38 && jumpingman.grounded) {
                jumpingman.ySpeed -= jumpPower;
                jumpingman.grounded = false;
                jumpingman.jumping = true;
            }
            // Left
            if (key.which == 37) {
                jumpingman.xSpeed = -3;
                jumpingman.direction = "l";
                jumpingman.walking = true;
            }
            // Right
            if (key.which == 39) {
                jumpingman.xSpeed = 3;
                jumpingman.direction = "r";
                jumpingman.walking = true;
            }

            // Tetris controls
            // A
            if (key.which == 65) {
                if (canMove(controlShape, "left")) {
                    controlShape.shift("left");
                }
            }
            // D
            if (key.which == 68) {
                if (canMove(controlShape, "right")) {
                    controlShape.shift("right");
                }
            }
            // S
            if (key.which == 83) {
                fastFall = true;
            }
            // W
            if (key.which == 87) {
                if (canRotate(controlShape)) {
                    controlShape.rotate();
                }
            }
        }
        // enter to restart if if finished
        if (finished && key.which == 13) {
            restart();
        }
        if (!finished && key.which == 80) {
            pause();
        }
    }).keyup(function(key) {
        // Left
        if (key.which == 37) {
            jumpingman.xSpeed = 0;
            jumpingman.walking = false;

        }
        // Right
        if (key.which == 39) {
            jumpingman.xSpeed = 0;
            jumpingman.walking = false;


        }
        if (key.which == 83) {
            fastFall = false;
        }
    });
    // Let's play
    start();
});
