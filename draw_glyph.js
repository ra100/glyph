(function (window, document) {
	function addEvent(element, evnt, funct){
	  if (element.attachEvent)
	   return element.attachEvent('on'+evnt, funct);
	  else
	   return element.addEventListener(evnt, funct, false);
	}

	function buildGlyphSequence() {
		var div_glyph_seq = document.getElementById('glyph_seq');
		div_glyph_seq.innerHTML = '';
		glyph_sequence.forEach(function(value, index){
			var glyph_div = document.createElement('div');
			glyph_div.innerHTML='<canvas width="150" height="150"></canvas><p>'+value.name+'</p>';
			div_glyph_seq.appendChild(glyph_div);
			Glyph(glyph_div.getElementsByTagName('canvas'),{canModify: false, glyphStrokes: value.glyph});
		});
		document.getElementById('glyph_seq_js.content').innerHTML = '';
		glyph_sequence.forEach(function(elem){
			var glyph = document.createElement("span");
			glyph.textContent = JSON.stringify(elem) + ",";
			document.getElementById('glyph_seq_js.content').appendChild(glyph);
			document.getElementById('glyph_seq_js.content').appendChild(document.createElement("br"));
		})
		//document.getElementById('glyph_seq_js.content').textContent=JSON.stringify(glyph_sequence);
	};
	window.onload = function() {
		var glyph = Glyph('#draw_glyph')[0];
		addEvent(glyph.canvas, 'changed', function(){
			document.getElementById('json').value = JSON.stringify(glyph.glyphStrokes);
		});
		addEvent(document.getElementById('glyph_form'), 'reset', function(event){
			event.preventDefault();
			glyph.glyphStrokes = {};
			glyph.draw();
			this.name.value = '';
			document.getElementById('json').value = '';
		});
		addEvent(document.getElementById('glyph_form'), 'submit', function(event){
			event.preventDefault();
			glyph_sequence.push({
				name: this.name.value,
				glyph: glyph.glyphStrokes
			})
			glyph_sequence.sort(function(a,b){return a.name.localeCompare(b.name)});
			buildGlyphSequence();
			glyph.glyphStrokes = {};
			glyph.draw();
			this.name.value = '';
			document.getElementById('json').value = '';
			
			return false;
		});
		
		addEvent(document.getElementById('glyph_seq_js'), 'click', function(){
			var selection = window.getSelection();            
			var range = document.createRange();
			range.selectNodeContents(this);
			selection.removeAllRanges();
			selection.addRange(range);
		});
		buildGlyphSequence();
	};
})(window,document);