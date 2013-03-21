jewelCrusade.screens["game-menu"] = (function() {
	var dom = jewelCrusade.dom,
	    game = jewelCrusade.game,
	    firstRun = true;

	function setup() {
		dom.bind("#game-menu ul.menu", "click",
			function(e) {
				if(e.target.nodeName.toLowerCase() === "button") {
					var action = 
					    e.target.getAttribute("name");
					game.showScreen(action);    
				}
			});
	} 

	function run() {
		if(firstRun) {
			setup();
			firstRun = false;
		}
	} 

	return {
		run : run
	}; 
})();