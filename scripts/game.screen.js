jewelCrusade.screens["game-screen"] = (function() {
	var settings = jewelCrusade.settings,
	    board = jewelCrusade.board,
	    display = jewelCrusade.display,
	    input = jewelCrusade.input,
        dom = jewelCrusade.dom,
        $ = dom.$,
	    cursor,
        gameState,
	    firstRun = true

    function beginGame() {
        gameState = {
            level : 0,
            score : 0,
            timer : 0, // setTimeout reference
            startTime : 0, // time at start of level
            endTime : 0 // time to game over
        };
        cursor = {
            x : 0,
            y : 0,
            selected : false
        };
        
        updateGameInfo();
        setLevelTimer(true);
        
        board.initialize(function() {
            display.initialize(function() {
                display.redraw(board.getBoard(), function() {
                    advanceLevel();
                });
            });
        });
    } 

    function announceLevel(str) {
        var element = $("#game-screen .announcement")[0];
        element.innerHTML = str;
        if (Modernizr.cssanimations) {
            dom.removeClass(element, "zoomfade");
            setTimeout(function() {
                dom.addClass(element, "zoomfade");
            }, 1);
        } else {
            dom.addClass(element, "active");
            setTimeout(function() {
                dom.removeClass(element, "active");
            }, 1000);
        }
    }

    function advanceLevel() {
        gameState.level++;
        announceLevel("Level " + gameState.level);
        updateGameInfo();
        gameState.startTime = Date.now();
        gameState.endTime = settings.baseLevelTimer *
            Math.pow(gameState.level, -0.05 * gameState.level);
        setLevelTimer(true);
        display.levelUp();
    }

    function updateGameInfo() {
        $("#game-screen .score span")[0].innerHTML
            = gameState.score;
        $("#game-screen .level span")[0].innerHTML
            = gameState.level;
    }

    function setLevelTimer(reset) {
        if (gameState.timer) {
            clearTimeout(gameState.timer);
            gameState.timer = 0;
        }
        if (reset) {
            gameState.startTime = Date.now();
            gameState.endTime =
                settings.baseLevelTimer *
                Math.pow(gameState.level, 
                         -0.05 * gameState.level);
        }
        var delta = gameState.startTime +
                    gameState.endTime - Date.now(),
            percent = (delta / gameState.endTime) * 100,
            progress = $("#game-screen .time .indicator")[0];
        if (delta < 0) {
            gameOver();
        } else {
            progress.style.width = percent + "%";
            gameState.timer = setTimeout(function() {
                setLevelTimer(false);
            }, 30);
        }
    } 

    function gameOver() {
        display.gameOver(function() {
            announceLevel("Game over");
        });
    }

	function run() {
		if(firstRun) {
			setup();
			firstRun = false;
		}
		beginGame();
	}

	function positionCursor(x, y, select) {
		cursor.x = x;
		cursor.y = y;
		cursor.selected = select;
		display.setCursor(x, y, select);
	} 

	function chooseJewel(x, y) {
        if (arguments.length == 0) {
            chooseJewel(cursor.x, cursor.y);
            return;
        }
        if (cursor.selected) {
            var dx = Math.abs(x - cursor.x),
                dy = Math.abs(y - cursor.y),
                dist = dx + dy;

            if (dist == 0) {
                // deselected the selected jewel
                positionCursor(x, y, false);
            } else if (dist == 1) {
                // selected an adjacent jewel
                board.swap(cursor.x, cursor.y, 
                    x, y,gameBoardEvents);
                positionCursor(x, y, false);
            } else {
                // selected a different jewel
                positionCursor(x, y, true);
            }
        } else {
            positionCursor(x, y, true);
        }
    }

    function gameBoardEvents(events) {
        if (events.length > 0) {
            var boardEvent = events.shift(),
                next = function() {
                    gameBoardEvents(events);
                };
            switch (boardEvent.type) {
                case "move" :
                    display.moveJewels(boardEvent.data, next);
                    break;
                case "remove" :
                    display.removeJewels(boardEvent.data, next);
                    break;
                case "refill" :
                    announceLevel("No moves!");
                    display.refill(boardEvent.data, next);
                    break;
                case "score": 
                    addScore(boardEvent.data);
                    next();
                    break;    
                default :
                    next();
                    break;
            }
        } else {
            display.redraw(board.getBoard(), function() {
                // good to go again
            });
        }
    }

    function addScore(points) {
        var nextLevel = Math.pow(
            settings.baseLevelScore, 
                Math.pow(settings.baseLevelExp,
                    gameState.level-1)
            );        
        gameState.score += points;
        if(gameState.score >= nextLevel) {
            advanceLevel();
        }
        updateGameInfo();
    }

    function moveCursor(x, y) {
        if (cursor.selected) {
            x += cursor.x;
            y += cursor.y;
            if (x >= 0 && x < settings.cols 
                && y >= 0 && y < settings.rows) {
                chooseJewel(x, y);
            }
        } else {
            x = (cursor.x + x + settings.cols) % settings.cols;
            y = (cursor.y + y + settings.rows) % settings.rows;
            positionCursor(x, y, false);
        }
    }

    function moveUp() {
        moveCursor(0, -1);
    }

    function moveDown() {
        moveCursor(0, 1);
    }

    function moveLeft() {
        moveCursor(-1, 0);
    }

    function moveRight() {
        moveCursor(1, 0);
    }

    function setup() {
        input.initialize();
        input.bind("selectJewel", chooseJewel);
        input.bind("moveUp", moveUp);
        input.bind("moveDown", moveDown);
        input.bind("moveLeft", moveLeft);
        input.bind("moveRight", moveRight);
    }

	return {
		run: run
	};  
})();