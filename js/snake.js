$(document).ready(function() {

    // size of snake (px) must be a factor of 400
    // 10, 20, 25 work well
    var blocksize = 20;
    // movements per second
    var fps = 12;

    // canvas
    var width = 400;
    var height = 400;

    // snake
    var head;
    var tail;
    var size;
    var direction = "";

    // apple
    var apple;

    var score;
    var finished;

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

    function component(colour, x, y, type, tail = 0) {
        this.colour = colour;
        this.x = x;
        this.y = y;
        this.type = type;
        if (this.type == "tail") {
            if (size > 1) this.next = tail;
            else this.next = head;
            this.wait = size - 1;
        }
        this.xSpeed = 1;
        this.ySpeed = 0;

        this.move = function() {
            // Head of snake moves
            if (this.type == "head") {
                this.x += this.xSpeed * blocksize;
                this.y += this.ySpeed * blocksize;


                if (this.x >= width) {
                    this.x = 0;
                } else if (this.x < 0) {
                    this.x = width - blocksize;
                }

                if (this.y >= height) {
                    this.y = 0;
                } else if (this.y < 0) {
                    this.y = height - blocksize;
                }
            }

            // Apple moves
            else if (this.type == "apple") {
                this.x = Math.floor(Math.random() * width / blocksize) * blocksize;
                this.y = Math.floor(Math.random() * width / blocksize) * blocksize;
            }

            // Tail moves
            else if (this.type == "tail") {
                this.x = this.next.x;
                this.y = this.next.y;
            }
        };

        this.update = function() {
            var cx = myGameArea.context;
            cx.fillStyle = colour;
            if (this.type == "apple") {
                cx.beginPath();
                cx.arc(this.x + blocksize / 2, this.y + blocksize / 2, blocksize / 2, 0, Math.PI * 2, true);
                cx.closePath();
                cx.fill();
            } else cx.fillRect(this.x, this.y, blocksize, blocksize);
        };
    }

    function updateGameArea() {
        if (size > 3 && checkCollision()) {
            var context = myGameArea.canvas.getContext("2d");

            context.font = "30px Courier New";
            context.fillStyle = "blue";
            context.fillText("Game Over!", width / 2 - 90, height / 2 - 50);
            context.fillText("Score: " + score, width / 2 - 75, height / 2);
            context.font = "20px Courier New";
            context.fillText("Enter to play again", width / 2 - 115, height / 2 + 40);

            if (finished) return;
            finished = true;
            return;
        }
        myGameArea.clear();


        // Move tail
        if (size > 1) {
            var current = tail;
            while (current.type != "head") {
                if (current.wait == 0) current.move();
                else current.wait--;
                current.update();
                current = current.next;
            }
        }

        // if head at apple move apple
        if (head.x == apple.x && head.y == apple.y) {
            apple.move();
            score++;
            updateScore();
            increaseSize();
        }
        apple.update();
        // Move head
        head.move();
        head.update();
    }

    function increaseSize() {
        if (size > 1) tail = new component("white", head.x, head.y, "tail", tail);
        else tail = new component("white", head.x, head.y, "tail");
        size++;
    }

    function checkCollision() {
        var current = tail;
        while (current.type != "head") {
            if (current.x == head.x && current.y == head.y)
                return true;
            current = current.next;
        }
        return false;
    }


    function updateScore() {
        $("#score").html("Score: " + score);
    }

    function initialise() {
        startGame();
        myGameArea.start();
    }

    // Start new game
    function startGame() {
        head = new component("white", width / 2, height / 2, "head");
        direction = "r";
        size = 1;
        score = 0;
        updateScore();
        finished = false;
        for (var i = 0; i < 2; i++) increaseSize();
        apple = new component("red", Math.floor(Math.random() * width / blocksize) * blocksize, Math.floor(Math.random() * width / blocksize) * blocksize, "apple");
        // myGameArea.start();
    }

    // Move about
    $(document).keydown(function(key) {
        // Left
        if (key.which == 37 && direction != "r") {
            head.xSpeed = -1;
            head.ySpeed = 0;
            direction = "l";
        }
        // Up
        if (key.which == 38 && direction != "d") {
            head.xSpeed = 0;
            head.ySpeed = -1;
            direction = "u";
        }
        // Right
        if (key.which == 39 && direction != "l") {
            head.xSpeed = 1;
            head.ySpeed = 0;
            direction = "r";
        }
        // Down
        if (key.which == 40 && direction != "u") {
            head.xSpeed = 0;
            head.ySpeed = 1;
            direction = "d";
        }

        if (finished && key.which == 13) {
            startGame();
        }
    });

    // Start game when page loads
    initialise();
});
