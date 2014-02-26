var Glyph = function(canvas) {
	if(typeof canvas == 'string') {
		if(canvas.charAt(0) == '#') {
			canvas = [document.getElementById(canvas.substr(1))];
		}
		else if(canvas.indexOf('.') == 0) {
			canvas = document.getElementsByClassName(canvas.replace(/\./g,' '));
		}
		else if(canvas.indexOf('.') != -1) {
			var tag_class = canvas.split('.');
			var tag = tag_class.reverse().pop();
			if
			canvas = Array.filter(document.getElementsByClassName(tag_class.reverse().join(' ')), function(elem) {
				return elem.nodeName.toUpperCase() == tag.toUpperCase
			});
		}
		else {
			canvas = document.getElementsByTagName(canvas);
		}
	}
	else if(toString.call(obj) !== '[object Array]') { 
		canvas = [canvas];
	}
	
	var glyphs = new Array();
	canvas.forEach(function(value, index, array) {
		if(value.tagName && value.tagName == 'CANVAS') {
			glyphs.push(value);
		}
	});
	return glyphs;
}