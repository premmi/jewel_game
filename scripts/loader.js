var jewelCrusade = {
   screens: {},
   settings: {
      rows: 8,
      cols: 8,
      baseScore: 100,
      baseLevelTimer: 60000,
      baseLevelScore: 1500,
      baseLevelExp: 1.05,
      numJewelTypes: 7,
      jewelSize: 40,
      controls: {
         KEY_UP: "moveUp",
         KEY_LEFT: "moveLeft",
         KEY_DOWN: "moveDown",
         KEY_RIGHT: "moveRight",
         KEY_ENTER: "selectJewel",
         KEY_SPACE: "selectJewel",
         CLICK: "selectJewel"            
        }
    },
    images : {}
};

window.addEventListener("load", function() {

   Modernizr.addTest("desktop", function() {
      return (window.navigator.standalone != false);
   });

   // extend yepnope with preloading
   yepnope.addPrefix("preloader", function(gameResouce) {
      gameResouce.noexec = true;
      return gameResouce;
   });

   var preloaded = 0,
       loaded = 0;

   yepnope.addPrefix("loadScript", function(gameResouce) {
      // console.log("Loading: " + gameResouce.url)
    
      var isImage = /.+\.(jpg|png|gif)$/i.test(gameResouce.url);
      gameResouce.noexec = isImage;

      preloaded++;
      gameResouce.autoCallback = function(e) {
         // console.log("Finished loading: " + gameResouce.url)
         loaded++;
         if (isImage) {
            var image = new Image();
            image.src = gameResouce.url;
            jewelCrusade.images[gameResouce.url] = image;
        }
    };
    return gameResouce;
});

function getProgress() {
    if (preloaded > 0) {
        return loaded / preloaded;
    } else {
        return 0;
    }
}

// loading stage 1
Modernizr.load([
{ 
    load : [
        "scripts/sizzle.js",
        "scripts/dom-utility.js",
        "scripts/animationFrame.js",
        "scripts/crusade.js"
    ]
},{
    test : Modernizr.desktop,
    yep : "scripts/splash.screen.js",    
    complete : function() {
        jewelCrusade.game.setup();
        if (Modernizr.desktop) {
            jewelCrusade.game.showScreen("screen-splash",
                getProgress);
        } 
    }
}
]);

// loading stage 2
if (Modernizr.desktop) {
    Modernizr.load([
    {
        test : Modernizr.canvas,
        yep : "loadScript!scripts/display.js"
    },{
        test : Modernizr.webworkers,
        yep : [
            "loadScript!scripts/gameboard.worker-interface.js",
            "preloader!scripts/gameboard.worker.js"
        ],
        nope : "loadScript!scripts/gameboard.js"
    },{
        load : [
            "loadScript!scripts/input-control.js",
            "loadScript!scripts/game-menu.screen.js",
            "loadScript!scripts/game.screen.js",
            "loadScript!images/jewels"
                + jewelCrusade.settings.jewelSize + ".png"
        ]
    }
    ]);
}
}, false);
