function addEvent(element, evnt, funct){
  if (element.attachEvent)
   return element.attachEvent('on'+evnt, funct);
  else
   return element.addEventListener(evnt, funct, false);
}

function getTargetObject(target) {
	return target.correspondingUseElement || target;
};

(function (window, document) {
	window.onload = function() {
		var calibration_grid = document.getElementById('calibration_grid');
		
		var getTargetAnchorObject = function(target) {
			target = getTargetObject(target);
			if(target.id.indexOf("anchor")==0 &&
				( target.tagName === "circle" || target.tagName === "use" ) ) {
				return target;
			}
			return undefined;
				
		}
		
		var isGridDrawable = function (gridObject) {
			if(!gridObject.farthestViewportElement)
				return false;
			return gridObject.farthestViewportElement === calibration_grid;
		};
		
		var onAnchorMousedown = function(event) {
			var object = getTargetAnchorObject(event.target);
			if(!object || !isGridDrawable(object))
				return;

			calibration_grid.dg_mouseDownObject = object;
			console.log("Mouse down...", object);
		};
		
		var getAnchorPos = function(object) {
			var x = object.cx || object.x;
			var y = object.cy || object.y;
			return { x: x.baseVal.value, y: y.baseVal.value };
		}

		var onAnchorMouseup = function(event) {
			if(!calibration_grid.dg_mouseDownObject)
				return; // didn't click in grid
			var object = getTargetAnchorObject(event.target);
			if(!object || !isGridDrawable(object)) { // Mouse up not on drawable anchor. Destroy everything
				if(calibration_grid.dg_mouseDownObject)
					calibration_grid.dg_mouseDownObject = undefined;
				return;
			}
			var object = getTargetObject(event.target);
			console.log("Mouse up...", object);
			var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
			line.style.stroke = "#00f"; //Set stroke colour
			line.style.strokeWidth = "1px"; //Set stroke width			
			line.id = calibration_grid.dg_mouseDownObject.id + "_" + object.id;
			line.setAttribute("x1",getAnchorPos(calibration_grid.dg_mouseDownObject).x);
			line.setAttribute("y1",getAnchorPos(calibration_grid.dg_mouseDownObject).y);
			line.setAttribute("x2",getAnchorPos(object).x);
			line.setAttribute("y2",getAnchorPos(object).y);
			object.parentElement.appendChild(line);
			calibration_grid.dg_mouseDownObject = undefined;
		};
		
		var onAnchorMousemove = function(event) {
			if(!calibration_grid.dg_mouseDownObject)
				return; // didn't click in grid
			var object = getTargetAnchorObject(event.target);
			console.log("Mouse move...", object);
		}
	
		addEvent(document, 'mousedown', onAnchorMousedown);
		addEvent(document, 'mouseup', onAnchorMouseup);
		addEvent(document, 'mousemove', onAnchorMousemove);
	};
})(window,document);