jewelCrusade.board = (function() {
	var settings,
	    jewels,
	    cols,
	    rows,
	    baseScore,
	    numJewelTypes;

	function initialize(callback) {
		settings = jewelCrusade.settings;
		numJewelTypes = settings.numJewelTypes;
		baseScore = settings.baseScore;
		cols = settings.cols;
		rows = settings.rows;

		fillBoard();
		callback();
	} 

	function fillBoard() {
		var x, y,
		    type;
		jewels = [];

		for(x = 0; x < cols; x++) {
			jewels[x] = [];
			for(y = 0; y < rows; y++) {
				type = makeRandomJewel();
				while((type === getJewelPosition(x-1, y) &&
					type === getJewelPosition(x-2, y)) || 
					(type === getJewelPosition(x, y-1) &&
					type === getJewelPosition(x, y-2))) {
					type = makeRandomJewel();
				}

				jewels[x][y] = type;
			}
		}

		//recursively fill if new board has no moves
		if(!hasMoves()) {
			fillBoard();
		}
	}

	    // if possible, swaps (x1,y1) and (x2,y2) and
    // calls the callback function with list of board events
    function swap(x1, y1, x2, y2, callback) {
        var tmp, swap1, swap2,
            events = [];
        swap1 = {
            type : "move",
            data : [{
                type : getJewelPosition(x1, y1),
                fromX : x1, fromY : y1, toX : x2, toY : y2
            },{
                type : getJewelPosition(x2, y2),
                fromX : x2, fromY : y2, toX : x1, toY : y1
            }]
        };
        swap2 = {
            type : "move",
            data : [{
                type : getJewelPosition(x2, y2),
                fromX : x1, fromY : y1, toX : x2, toY : y2
            },{
                type : getJewelPosition(x1, y1),
                fromX : x2, fromY : y2, toX : x1, toY : y1
            }]
        };
        if (isAdjacentCell(x1, y1, x2, y2)) {
            events.push(swap1);
            if (canSwap(x1, y1, x2, y2)) {
                tmp = getJewelPosition(x1, y1);
                jewels[x1][y1] = getJewelPosition(x2, y2);
                jewels[x2][y2] = tmp;
                events = events.concat(check());
            } else {
                events.push(swap2, {type : "badswap"});
            }
            callback(events);
        }
    }
    
	function getJewelPosition(x, y) {
		if(x < 0 || x > cols-1 || y < 0 || y > rows-1) {
			return -1;
		} else {
			return jewels[x][y];
		}
	}
	
	function makeRandomJewel() {
		return Math.floor(Math.random() * numJewelTypes);
	}

	//returns the number of jewels in the longest chain 
	//that includes (x,y)
	function checkChain(x, y) {
		var type = getJewelPosition(x, y),
		    left = 0, right = 0,
		    down = 0, up = 0;

		 //look right
		 while(type === getJewelPosition(x + right + 1, y)) {
		 	right++;
		 }  

		 //look left
		 while(type === getJewelPosition(x - left - 1, y)) {
		 	left++;
		 }

		 //look up
		 while(type === getJewelPosition(x, y + up + 1)) {
		 	up++;
		 }

		 //look down
		 while(type === getJewelPosition(x, y - down -1)) {
		 	down++;
		 }

		 return Math.max(left + 1 + right, up + 1 + down);
	}

	//returns true if (x1, y1) can be swapped with (x2, y2)
	//to form a new match
	function canSwap(x1, y1, x2, y2) {
		var type1 = getJewelPosition(x1, y1),
		    type2 = getJewelPosition(x2, y2),
		    chain;

		 if(!isAdjacentCell(x1, y1, x2, y2)) {
		 	return false;
		 }  

		 //temporarily swap jewels
		 jewels[x1][y1] = type2;
		 jewels[x2][y2] = type1;

		 chain = (checkChain(x2, y2) > 2 || 
		          checkChain(x1,y1) > 2);
         
         //swap back
         jewels[x1][y1] = type1;
         jewels[x2][y2] = type2;

         return chain;
	}

	//returns true if (x1, y1) is adjacent to (x2, y2)
	function isAdjacentCell(x1, y1, x2, y2) {
		var dx = Math.abs(x1 - x2),
		    dy = Math.abs(y1 - y2);

		return (dx + dy === 1);
	}

	//returns a two-dimensional map of chain lengths
	function getChainLength() {
		var x, y,
		    chains = [];

		for (x = 0; x < cols; x++) {
			chains[x] = [];
			for(y = 0; y < rows; y++) {
				chains[x][y] = checkChain(x, y);
			}

		} 

		return chains;   
	}

	function check(events) {
		var chains = getChainLength(),
		    isChain = false,
		    score = 0,
		    removed = [],
		    moved = [],
		    gaps = [];

		 for(var x = 0; x < cols; x++) {
		 	gaps[x] = 0;
		 	for(var y = rows-1; y >= 0; y--) {
		 		if(chains[x][y] > 2) {
		 			isChain = true;
		 			gaps[x]++;
		 			removed.push({
		 				x: x,
		 				y: y,
		 				type: getJewelPosition(x, y)
		 			});
		 			//add points to score
		 			score += baseScore * Math.pow(2, (chains[x][y] - 3));
		 		} else if(gaps[x] > 0) {
		 			moved.push({
		 				toX: x,
		 				toY: y + gaps[x],
		 				fromX: x,
		 				fromY: y,
		 				type: getJewelPosition(x, y)
		 		    });
		 		    jewels[x][y + gaps[x]] = getJewelPosition(x, y);
		 		}
		 	}
		 	//fill from the top
		 	for(y = 0; y < gaps[x]; y++) {
		 		jewels[x][y] = makeRandomJewel();
		 		moved.push({
		 			toX: x,
		 			toY: y,
		 			fromX: x,
		 			fromY: y - gaps[x],
		 			type: jewels[x][y]
		 		});
		 	}
		 } 

		 events = events || [];
		 if(isChain) {
		 	events.push({
		 		type: "remove",
		 		data: removed
		 	},
		 	{
		 		type: "score",
		 		data: score
		 	},
		 	{
		 		type: "move",
		 		data: moved
		 	});			

		 	//refill if no more moves
		 	if(!hasMoves()) {
		 		fillBoard();
		 		events.push({
		 			type: "refill",
		 			data: getBoard()
		 		});
		 	}
		 	return check(events);
		 } else {
		 	return events;
		 } 
	}

	function hasMoves() {
		for(var x = 0; x < cols; x++) {
			for(var y = 0; y < rows; y++) {
				if(isValidSwap(x, y)) {
					return true;
				}
			}
		}
		return false;
	}

	//returns true if (x, y) is a valid position and if
	//the jewel at (x, y) can be swapped with a neighbour
	function isValidSwap(x, y) {
		return ((x > 0 && canSwap(x, y, x-1, y)) ||
			(x < cols - 1 && canSwap(x, y, x+1, y)) ||
			(y > 0 && canSwap(x, y, x, y-1)) ||
			(y < rows-1 && canSwap(x, y, x, y+1)));
	}

	//create a copy of the jewel board
    function getGameBoard() {
    	var copy = [],
    	    x;

    	 for(x = 0; x < cols; x++) {
    	 	copy[x] = jewels[x].slice(0);
    	 } 

    	 return copy;  
    }

	function printGameBoard() {
		var str = "";

		for(var y = 0; y < rows; y++) {
			for(var x = 0; x < cols; x++) {
				str += getJewelPosition(x, y) + " ";
			}
		str += "\r\n";	
		}
		console.log(str);	
	} 

	return {
		initialize: initialize,
		canSwap: canSwap,
		swap: swap,
		getBoard: getGameBoard,
		print: printGameBoard
	};
})();