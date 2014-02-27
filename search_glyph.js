(function (window, document) {
	function addEvent(element, evnt, funct){
	  if (element.attachEvent)
	   return element.attachEvent('on'+evnt, funct);
	  else
	   return element.addEventListener(evnt, funct, false);
	}

	function buildGlyphSequence(sequence) {
		var div_glyph_seq = document.getElementById('glyph_seq');
		div_glyph_seq.innerHTML = '';
		sequence.forEach(function(value, index){
			var glyph_div = document.createElement('div');
			glyph_div.innerHTML='<canvas width="150" height="150"></canvas><p>'+value.name+'</p>';
			div_glyph_seq.appendChild(glyph_div);
			Glyph(glyph_div.getElementsByTagName('canvas'),{canModify: false, glyphStrokes: value.glyph});
		});
	};
	
	function searchGlyph(query, mode) {
		if(mode === undefined) {
			mode = document.getElementById('search_type').value;
		}
		var filter = {
			'search': function(entry){
						for(var from in query) {
							for(var to in query[from]) {
								if(!query[from][to] || !entry.glyph[from] || !entry.glyph[from][to])
									return false;
							}
						}
						return true;
					},
			'match': function(entry){
						for(var from in entry.glyph) {
							for(var to in entry.glyph[from]) {
								if(!entry.glyph[from][to] || !query[from] || !query[from][to])
									return false;
							}
						}
						return true;
					}
		}
		var found = glyph_sequence.filter(filter[mode]);
		buildGlyphSequence(found);
	};
	
	window.onload = function() {
		var glyph = Glyph('#draw_glyph')[0];
		addEvent(glyph.canvas, 'changed', function(){
			searchGlyph(glyph.glyphStrokes);
		});
		addEvent(document.getElementById('clear_glyph'), 'click', function(){
			glyph.glyphStrokes = {};
			glyph.draw();
			searchGlyph(glyph.glyphStrokes);
		})
		addEvent(document.getElementById('search_type'), 'change', function(){
			searchGlyph(glyph.glyphStrokes);
		});
		searchGlyph();
	};
})(window,document);