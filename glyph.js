var Glyph = (function(window, document){
	function extend(object, extension) {
		for(var ext in extension) {
			object[ext] = extension[ext];
		}
		return object;
	}
	function addEvent(element, evnt, funct){
	  if (element.attachEvent)
	   return element.attachEvent('on'+evnt, funct);
	  else
	   return element.addEventListener(evnt, funct, false);
	}
	
	function fixEventPosition(e) {
		e = e || window.event

		if (e.pageX == null && e.clientX != null ) { 
			var html = document.documentElement
			var body = document.body
		
			e.pageX = e.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0)
			e.pageY = e.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0)
		}
		return e;
	}
	
	var tracked_MouseDownObject = undefined;
	var onDocumentMouseUp = function(event) {
		if(!tracked_MouseDownObject)
			return;
		return tracked_MouseDownObject.onCanvasMouseUp.call(tracked_MouseDownObject, event);
	};

	var onDocumentMouseMove = function(event) {
		if(!tracked_MouseDownObject)
			return;
		return tracked_MouseDownObject.onCanvasMouseMove.call(tracked_MouseDownObject, event);
	};

	var InitListeners = (function(){
		var initialized = false;
		return function () {
			if(initialized) 
				return true;
			addEvent(document, 'mouseup', onDocumentMouseUp);
			addEvent(document, 'mousemove', onDocumentMouseMove);
		}
	})();
	
	function GlyphObject(canvas, options) {
		options = options || {};
		this.canvas = canvas;
		this.glyphStrokes = {};
		this.activeAnchors = [];
		extend(this, options);
		if(this.canModify) {
			addEvent(this.canvas, 'mousedown', this.onCanvasMouseDown.bind(this));		
			InitListeners();
		}
	}
	
	extend(GlyphObject.prototype, {
		canModify: true,
		anchorPoints: (function(){
			function polar(rho, phi) {
				return {rho: rho, phi: phi*Math.PI/180};
			}
			return [
				polar(1, 180),
				polar(1, -120),
				polar(1, 120),
				polar(0.5, -120),
				polar(0.5, 120),
				polar(0,0),
				polar(0.5, -60),
				polar(0.5, 60),
				polar(1, -60),
				polar(1, 60),
				polar(1, 0),
			]
		})(),
		radius: 0.1,
		snapLen: 5,
		
		addGlyphStroke: function(from, to) {
			if(from == to)
				return;
			var splits = [
				{ from: 0, to: 8, splits: [0, 3, 8] },
				{ from: 0, to: 9, splits: [0, 4, 9] },
				{ from: 0, to:10, splits: [0, 5,10] },
				{ from: 1, to: 9, splits: [1, 3, 5, 7, 9] },
				{ from: 1, to: 7, splits: [1, 3, 5, 7] },
				{ from: 1, to: 5, splits: [1, 3, 5] },
				{ from: 1, to:10, splits: [1, 6, 10] },
				{ from: 2, to: 8, splits: [2, 4, 5, 6, 8] },
				{ from: 2, to: 6, splits: [2, 4, 5, 6] },
				{ from: 2, to: 5, splits: [2, 4, 5] },
				{ from: 2, to:10, splits: [2, 7, 10] },
				{ from: 3, to: 9, splits: [3, 5, 7, 9] },
				{ from: 3, to: 7, splits: [3, 5, 7] },
				{ from: 4, to: 8, splits: [4, 5, 6, 8] },
				{ from: 4, to: 6, splits: [4, 5, 6] },
				{ from: 5, to: 8, splits: [5, 6, 8] },
				{ from: 5, to: 9, splits: [5, 7, 9] }
			]
			var anchors = [from,to].sort(function(a,b){return a-b});
			from = anchors[0];
			to = anchors[1];
			// possible splits:
			if(splits.some(function(value){
				if(value.from == from && value.to == to) {
					for(var i=1; i<value.splits.length; i++) {
						this.addGlyphStroke(value.splits[i-1], value.splits[i]);
					}
					return true;
				}
			}, this)) {
				return;
			}
			if(!this.glyphStrokes[from])
				this.glyphStrokes[from] = {};
			this.glyphStrokes[from][to] = true;
			return;
		},


		fixLocalEventPosition: function(event) {
			event = fixEventPosition(event);
			// We will forget about already set offsetX and offsetY and will recalculate it manually for this object
			event.offsetX = event.pageX - this.canvas.offsetLeft;
			event.offsetY = event.pageY - this.canvas.offsetTop;
			return event;
		},
		
		onCanvasMouseDown: function(event) {
			if(!this.canModify)
				return;
			tracked_MouseDownObject = this;
			event = this.fixLocalEventPosition(event);
			var mousePos = {x: event.offsetX, y: event.offsetY};
			var clickAnchor = this.getAnchorFromPoint(mousePos, this.snapLen);
			if(clickAnchor === undefined)
				this.activeAnchors = []; // Missed the anchor
			else
				this.activeAnchors = [clickAnchor];
			this.draw();
		},
		
		onCanvasMouseUp: function(event) {
			if(!this.canModify)
				return;
			if(this.moveTimeout) {
				clearTimeout(this.moveTimeout);
				this.moveTimeout = undefined;
			}
			event = this.fixLocalEventPosition(event);
			var mousePos = {x: event.offsetX, y: event.offsetY};
			var anchorTo = this.getAnchorFromPoint(mousePos, this.snapLen);
			if(anchorTo != undefined && anchorTo != this.activeAnchors[this.activeAnchors-1]) {
				this.activeAnchors.push(anchorTo);
			}
			
			for(var i=1; i<this.activeAnchors.length; i++) {
				this.addGlyphStroke(this.activeAnchors[i-1], this.activeAnchors[i]);
			}
			if(this.activeAnchors.length > 0) {
				this.canvas.dispatchEvent(new Event('changed'));
			}
			
			this.activeAnchors = [];
			tracked_MouseDownObject = undefined;
			this.draw();
		},
		
		onCanvasMouseMove: function(event) {
			if(!this.canModify || this.activeAnchors.length < 1)
				return;
			var ctx = this.context();
			this.draw(ctx);
			
			event = this.fixLocalEventPosition(event);
			var mousePos = {x: event.offsetX, y: event.offsetY};
			var anchorTo = this.getAnchorFromPoint(mousePos, this.snapLen);
			if(anchorTo != undefined && anchorTo != this.activeAnchors[this.activeAnchors-1]) {
				if(!this.moveTimeout) {
					var _self = this;
					this.moveTimeout = setTimeout(function(){
						_self.activeAnchors.push(anchorTo);
						_self.onCanvasMouseMove.call(_self,event);
					}, 200);
				}
			} else if(this.moveTimeout) {
				clearTimeout(this.moveTimeout);
				this.moveTimeout = undefined;
			}

			ctx.beginPath();
			var points = [];
			this.activeAnchors.forEach(function(anchor){
				points.push(this.getAnchorPoint(anchor));
			},this);
			if(anchorTo === undefined) {
				points.push(mousePos);
			} else if(this.moveTimeout) {
				points.push(this.getAnchorPoint(anchorTo));
			}
			ctx.moveTo(points[0].x, points[0].y);
			for(var i=1; i<points.length; i++) {
				ctx.lineTo(points[i].x, points[i].y);
			}
			ctx.strokeStyle = '#F5BB1B';
			ctx.lineWidth = this.denormalizeLen(this.radius/2);
			ctx.lineCap="round";
			ctx.lineJoin="round";
			ctx.stroke();
		},

		getAnchorPoint: function(anchor) {
			if(typeof anchor === "number")
				anchor = this.anchorPoints[anchor];
			if(anchor === undefined)
				return undefined;
			return {
				x: this.denormalizeX(this.denormalizeLen(anchor.rho*Math.sin(anchor.phi))),
				y: this.denormalizeY(this.denormalizeLen(anchor.rho*Math.cos(anchor.phi)))
			}
		},
		
		isAnchorHit: function(anchor, point, radius) {
			return Math.pow(point.x - anchor.x, 2)+Math.pow(point.y - anchor.y, 2) <= Math.pow(radius,2)
		},

		getAnchorFromPoint: function(point, radiusExtra) {
			var anchor = undefined;
			this.anchorPoints.some(function(value, index) {
				var center = this.getAnchorPoint(value);
				var radius = this.denormalizeLen(this.radius)+(radiusExtra||0);
				if(this.isAnchorHit(center, point, radius)) {
					anchor = index;
					return true;
				}
			} ,this);
			return anchor;
		},

		context: function(ctx) {
			return ctx || this.canvas.getContext('2d');
		},
		
		denormalizeLen: function(len) {
			var magnification = 1.2;
			var scale = Math.min(this.canvas.width/2/magnification,this.canvas.height/2/magnification);
			return len*scale;
		},
		
		denormalizeX: function(x) {
			if(!x)
				x = 0;
			return x + this.canvas.width/2;
		},
		
		denormalizeY: function(y) {
			if(!y)
				y = 0;
			return y + this.canvas.height/2;
		},
		
		drawAnchorPoint: function(ctx, anchor, active) {
			ctx = this.context(ctx);
			var radius = this.denormalizeLen(this.radius);
			center = this.getAnchorPoint(anchor);
			ctx.beginPath();
			ctx.arc(center.x, center.y, radius, 0, Math.PI*2, true);
			ctx.fillStyle = active?'red':'lightgray';
			ctx.fill();
		},
		
		drawCalibrationGrid: function(ctx) {
			ctx = this.context(ctx);
			this.anchorPoints.forEach(function(value, index){
				this.drawAnchorPoint(ctx, value, this.activeAnchors.indexOf(index) != -1);
			}, this);
		},
		
		drawGlyph: function(ctx) {
			ctx = this.context(ctx);
			ctx.beginPath();
			for(var from in this.glyphStrokes) {
				for(var to in this.glyphStrokes[from]) {
					if(this.glyphStrokes[from][to]) {
						var ptFrom = this.getAnchorPoint(parseInt(from));
						var ptTo = this.getAnchorPoint(parseInt(to));
						ctx.moveTo(ptFrom.x, ptFrom.y);
						ctx.lineTo(ptTo.x, ptTo.y);
					}
				}
			}
			ctx.strokeStyle = '#3F49D4';
			ctx.lineWidth = this.denormalizeLen(this.radius/2);
			ctx.lineCap="round";
			ctx.lineJoin="round";
			ctx.stroke();
			
		},
		
		draw: function(ctx) {
			ctx = this.context(ctx);
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.drawCalibrationGrid(ctx);
			this.drawGlyph(ctx);
		},
		
		clear: function() {
			this.glyphStrokes = {};
			this.draw();
		}
	});
	
	return function(canvas, options) {
		if(typeof canvas == 'string') {
			if(canvas.charAt(0) == '#') {
				canvas = document.getElementById(canvas.substr(1));
				if(canvas)
					canvas = [canvas];
			}
			/* make usage of classes
			else if(canvas.indexOf('.') == 0) {
				canvas = document.getElementsByClassName(canvas.replace(/\./g,' '));
			}
			else if(canvas.indexOf('.') != -1) {
				var tag_class = canvas.split('.');
				var tag = tag_class.reverse().pop();
				canvas = Array.filter(document.getElementsByClassName(tag_class.reverse().join(' ')), function(elem) {
					return elem.nodeName.toUpperCase() == tag.toUpperCase
				});
			}
			*/
			else {
				canvas = document.getElementsByTagName(canvas);
			}
		}
		else if(canvas instanceof Node) {
			canvas = [canvas];
		}
		
		var glyphs = new Array();
		for(var i = 0; i<canvas.length; i++) {
			var value = canvas[i];
			if(value.tagName && value.tagName == 'CANVAS') {
				value.glyph = new GlyphObject(value, options);
				value.glyph.draw();
				glyphs.push(value.glyph);
			}
		};
		return glyphs;
	};
})(window, document);
	