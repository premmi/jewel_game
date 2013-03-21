jewelCrusade.dom = (function() {
    var $ = Sizzle;

    function hasClassInElement(el, clsName) {
        var regex = new RegExp("(^|\\s)" + clsName + "(\\s|$)");
        return regex.test(el.className);
    }

    function addClassToElement(el, clsName) {
        if(!hasClassInElement(el, clsName)) {
        	el.className += " " + clsName;
        }
    }

    function removeClassFromElement(el, clsName) {
		var regex = new RegExp("(^|\\s)" + clsName + "(\\s|$)");
		el.className = el.className.replace(regex, " ");
	}

	function bindEventHandlerToElement(element, event, handler) {
		if(typeof element === "string") {
			element = $(element)[0];
		}
		element.addEventListener(event, handler, false);
	}

	return {
		$ : $,
		hasClass: hasClassInElement,
		addClass: addClassToElement,
		removeClass: removeClassFromElement,
		bind: bindEventHandlerToElement
	};
})();
