jewelCrusade.screens["screen-splash"] = (function() {
	var game = jewelCrusade.game,
	    dom = jewelCrusade.dom,
	    $ = dom.$,
	    firstRun = true;

	function setup(getProgress) {
        var scr = $("#screen-splash")[0];
        function checkProgress() {
        	var p = getProgress() * 100;
        	$(".indicator", scr)[0].style.width = p + "%";
        	if(p === 100) {
        		$(".continue", scr)[0].style.display = "block";
        		dom.bind("#screen-splash", "click", 
					function() {
						game.showScreen("game-menu");
		     		}
		     	);
        	} else {
        		setTimeout(checkProgress, 30);
        	}
        }
		checkProgress();
	}

	function run(getProgress) {
		if(firstRun) {
			setup(getProgress);
			firstRun = false;
		}
	}

	return {
		run : run
	};    
})();