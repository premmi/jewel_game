jewelCrusade.display = (function() {
    var dom = jewelCrusade.dom,
        $ = dom.$,
        canvas, ctx,
        cols, rows,
        jewelSize,
        jewels,
        firstRun = true,
        cursor,
        previousCycle,
        animations = [];
    
    function makeBackground() {
        var background = document.createElement("canvas"),
            bgctx = background.getContext("2d");

        dom.addClass(background, "background");
        background.width = cols * jewelSize;
        background.height = rows * jewelSize;

        bgctx.fillStyle = "rgba(225,235,255,0.15)";
        for (var x=0;x<cols;x++) {
            for (var y=0;y<cols;y++) {
                if ((x+y) % 2) {
                    bgctx.fillRect(
                        x * jewelSize, y * jewelSize,
                        jewelSize, jewelSize
                    );
                }
            }
        }
        return background;
    }

    function setup() {
        var boardElement = $("#game-screen .game-board")[0];

        cols = jewelCrusade.settings.cols;
        rows = jewelCrusade.settings.rows;
        jewelSize = jewelCrusade.settings.jewelSize;

        canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
        dom.addClass(canvas, "board");
        canvas.width = cols * jewelSize;
        canvas.height = rows * jewelSize;
        ctx.scale(jewelSize, jewelSize);
        
        boardElement.appendChild(canvas);
        boardElement.appendChild(makeBackground());
        
        previousCycle = Date.now();
        requestAnimationFrame(doCycle);
    }

    function addAnimationToBoard(runTime, fncs) {
        var anim = {
            runTime : runTime,
            startTime : Date.now(),
            pos : 0,
            fncs : fncs
        };
        animations.push(anim);
    }

    function doAnimations(time, lastTime) {
        var anims = animations.slice(0), // copy list
            n = anims.length,
            animTime,
            anim,
            i;

        // call before() function
        for (i=0;i<n;i++) {
            anim = anims[i];
            if (anim.fncs.before) {
                anim.fncs.before(anim.pos);
            }
            anim.lastPos = anim.pos;
            animTime = (lastTime - anim.startTime);
            anim.pos = animTime / anim.runTime;
            anim.pos = Math.max(0, Math.min(1, anim.pos));
        }

        animations = []; // reset animation list

        for (i=0;i<n;i++) {
            anim = anims[i];
            anim.fncs.render(anim.pos, anim.pos - anim.lastPos);
            if (anim.pos == 1) {
                if (anim.fncs.done) {
                    anim.fncs.done();
                }
            } else {
                animations.push(anim);
            }
        }
    }

    function drawJewel(type, x, y, scale, rot) {
        var image = jewelCrusade.images["images/jewels" +
                        jewelSize + ".png"];
        ctx.save();
        if (typeof scale !== "undefined" && scale > 0) {
            ctx.beginPath();
            ctx.rect(x,y,1,1);
            ctx.clip();
            ctx.translate(x + 0.5, y + 0.5);
            ctx.scale(scale, scale);
            if (rot) {
                ctx.rotate(rot);
            }
            ctx.translate(-x - 0.5, -y - 0.5);
        }
        ctx.drawImage(image,
            type * jewelSize, 0, jewelSize, jewelSize,
            x, y, 1, 1
        );
        ctx.restore();
    }

    function fillAgain(newJewels, callback) {
        var lastJewel = 0;
        addAnimationToBoard(1000, {
            render : function(pos) {
                var thisJewel = Math.floor(pos * cols * rows),
                    i, x, y;
                for (i = lastJewel; i < thisJewel; i++) {
                    x = i % cols;
                    y = Math.floor(i / cols);
                    removeJewel(x, y);
                    drawJewel(newJewels[x][y], x, y);
                }
                lastJewel = thisJewel;
                canvas.style.webkitTransform =
                    "rotateX(" + (360 * pos) + "deg)";
            },
            done : function() {
                canvas.style.webkitTransform = "";
                callback();
            }
        });
    }

    function drawAgain(newJewels, callback) {
        var x, y;
        jewels = newJewels;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for (x = 0; x < cols; x++) {
            for (y = 0; y < rows; y++) {
                drawJewel(jewels[x][y], x, y);
            }
        }
        callback();
        doCursor();
    }

    function removeJewel(x, y) {
        ctx.clearRect(x, y, 1, 1);
    }

    
    function removeCursor() {
        if (cursor) {
            var x = cursor.x,
                y = cursor.y;
            removeJewel(x, y);
            drawJewel(jewels[x][y], x, y);
        }
    }

    function doCursor() {
        if (!cursor) {
            return;
        }
        var x = cursor.x,
            y = cursor.y;

        removeCursor();

        if (cursor.selected) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 0.8;
            drawJewel(jewels[x][y], x, y);
            ctx.restore();
        }
        ctx.save();
        ctx.lineWidth = 0.05 * jewelSize;
        ctx.strokeStyle = "rgba(250,250,150,0.8)";
        ctx.strokeRect(
            (x + 0.05) * jewelSize, (y + 0.05) * jewelSize,
            0.9 * jewelSize, 0.9 * jewelSize
        );
        ctx.restore();
    }

    function setCursor(x, y, selected) {
        removeCursor();
        if (arguments.length > 0) {
            cursor = {
                x : x,
                y : y,
                selected : selected
            };
        } else {
            cursor = null;
        }
        doCursor();
    }
    
    function moveJewelsInBoard(movedJewels, callback) {
        var n = movedJewels.length,
            oldCursor = cursor;
        cursor = null;
        movedJewels.forEach(function(e) {
            var x = e.fromX, y = e.fromY,
                dx = e.toX - e.fromX,
                dy = e.toY - e.fromY,
                dist = Math.abs(dx) + Math.abs(dy);
            addAnimationToBoard(200 * dist, {
                before : function(pos) {
                    pos = Math.sin(pos * Math.PI / 2);
                    removeJewel(x + dx * pos, y + dy * pos);
                },
                render : function(pos) {
                    pos = Math.sin(pos * Math.PI / 2);
                    drawJewel(
                        e.type,
                        x + dx * pos, y + dy * pos
                    );
                },
                done : function() {
                    if (--n == 0) {
                        cursor = oldCursor;
                        callback();
                    }
                }
            });
        });
    }

    function removeJewelsFromBoard(removedJewels, callback) {
        var n = removedJewels.length;
        removedJewels.forEach(function(e) {
            addAnimationToBoard(400, {
                before : function() {
                    removeJewel(e.x, e.y);
                },
                render : function(pos) {
                    ctx.save();
                    ctx.globalAlpha = 1 - pos;
                    drawJewel(
                        e.type, e.x, e.y,
                        1 - pos, pos * Math.PI * 2
                    );
                    ctx.restore();
                },
                done : function() {
                    if (--n == 0) {
                        callback();
                    }
                }
            });
        });
    }

    function levelIncrement(callback) {
        addAnimationToBoard(1000, {
            before : function(pos) {
                var j = Math.floor(pos * rows * 2),
                    x, y;
                for (y=0,x=j;y<rows;y++,x--) {
                    if (x >= 0 && x < cols) { // boundary check
                        removeJewel(x, y);
                        drawJewel(jewels[x][y], x, y);
                    }
                }
            },
            render : function(pos) {
                var j = Math.floor(pos * rows * 2),
                    x, y;
                ctx.save(); // remember to save state
                ctx.globalCompositeOperation = "lighter";
                for (y=0,x=j;y<rows;y++,x--) {
                    if (x >= 0 && x < cols) { // boundary check
                        drawJewel(jewels[x][y], x, y, 1.1);
                    }
                }
                ctx.restore();
            },
            done : callback
        });
    }
    
    function scatterPieces(pieces, pos, delta) {
        var piece, i;
        for (i=0;i<pieces.length;i++) {
            piece = pieces[i];

            piece.vel.y += 50 * delta;
            piece.pos.y += piece.vel.y * delta;
            piece.pos.x += piece.vel.x * delta;

            if (piece.pos.x < 0 || piece.pos.x > cols) {
                piece.pos.x = Math.max(0, piece.pos.x);
                piece.pos.x = Math.min(cols, piece.pos.x);
                piece.vel.x *= -1;
            }

            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.translate(piece.pos.x, piece.pos.y);
            ctx.rotate(piece.rot * pos * Math.PI * 4);
            ctx.translate(-piece.pos.x, -piece.pos.y);
            drawJewel(piece.type,
                piece.pos.x - 0.5,
                piece.pos.y - 0.5
            );
            ctx.restore();
        }
    }     

    function scatter(callback) {
        var pieces = [],
            piece,
            x, y;
        for (x=0;x<cols;x++) {
            for (y=0;y<rows;y++) {
                piece = {
                    type : jewels[x][y],
                    pos : {
                        x : x + 0.5,
                        y : y + 0.5
                    },
                    vel : {
                        x : (Math.random() - 0.5) * 20,
                        y : -Math.random() * 10
                    },
                    rot : (Math.random() - 0.5) * 3
                }
                pieces.push(piece);
            }
        }

        addAnimationToBoard(2000, {
            before : function(pos) {
                ctx.clearRect(0,0,cols,rows);
            },
            render : function(pos, delta) {
                scatterPieces(pieces, pos, delta);
            },
            done : callback
        });
    }

    function gameEnded(callback) {
        addAnimationToBoard(1000, {
            render : function(pos) {
                canvas.style.left =
                    0.2 * pos * (Math.random() - 0.5) + "em";
                canvas.style.top =
                    0.2 * pos * (Math.random() - 0.5) + "em";
            },
            done : function() {
                canvas.style.left = "0";
                canvas.style.top = "0";
                scatter(callback);
            }
        });
    }    
    
    function doCursor(time) {
        if (!cursor) {
            return;
        }
        var x = cursor.x,
            y = cursor.y,
            t1 = (Math.sin(time / 200) + 1) / 2,
            t2 = (Math.sin(time / 400) + 1) / 2;

        removeCursor();

        if (cursor.selected) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 0.8 * t1;
            drawJewel(jewels[x][y], x, y);
            ctx.restore();
        }
        ctx.save();
        ctx.lineWidth = 0.05;
        ctx.strokeStyle =
            "rgba(250,250,150," + (0.5 + 0.5 * t2) + ")";
        ctx.strokeRect(x+0.05,y+0.05,0.9,0.9);
        ctx.restore();
    }

    function doCycle(time) {
        doCursor(time);
        doAnimations(time, previousCycle);
        previousCycle = time;
        requestAnimationFrame(doCycle);
    }

    function initialize(callback) {
        if (firstRun) {
            setup();
            firstRun = false;
        }
        callback();
    }

    return {
        initialize : initialize,
        redraw : drawAgain,
        setCursor : setCursor,
        moveJewels : moveJewelsInBoard,
        removeJewels : removeJewelsFromBoard,
        refill : fillAgain,
        levelUp : levelIncrement,
        gameOver : gameEnded
    }
})();