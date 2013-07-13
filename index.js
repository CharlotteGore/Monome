module.exports = function(){

		var ctx = new webkitAudioContext(),
			bpm = 0.2,

			ref = ctx.createOscillator(),
			waveform = require("voice").SINE,
			mixerA = ctx.createChannelMerger(16),
			mixerB = ctx.createChannelMerger(16);
 
		var gainA = ctx.createGain();
		var gainB = ctx.createGain();

		gainA.gain.value = 0.7//Math.cos(0.5 * 0.5* Math.PI);
  		gainB.gain.value = 1.3//Math.cos((1.0 - 0.5) * 0.5* Math.PI);

  		ref.connect(ctx.destination);
		mixerA.connect(gainA);
		mixerB.connect(gainB);

		gainA.connect(ctx.destination);
		gainB.connect(ctx.destination);


		var events = require('event');
		var measure = require('measure');


		var template = function(str, obj){

			var candidates = str.match(/<%=([A-Za-z0-9\-\_\.]+)%>/g);


			candidates.forEach(function( match ){

				var name = match.replace(/<%=/, ''); name = name.replace(/%>/, '');
				if(obj[name]){

					str = str.replace(match, obj[name]);

				}

			});

			return str;

		}

		var css = {
			"ul.monome.a li.note" : "-webkit-transition: background <%=sweep%>ms, box-shadow <%=glow%>ms, -webkit-transform 0ms;!important",
			"ul.monome.a li.note.queued" : "-webkit-transition: -webkit-transform <%=lifespan%>ms, margin-left <%=lifespan%>ms, background <%=lifespan%>ms;!important",
			"ul.monome.a li.note.sweep.on" : "-webkit-transition: -webkit-transform <%=lifespan%>ms, background 0ms;!important",
			"ul.monome.b li.note" : "-webkit-transition: background <%=sweep%>ms, box-shadow <%=glowB%>ms, -webkit-transform 0ms;!important",
			"ul.monome.b li.note.queued" : "-webkit-transition: -webkit-transform <%=lifespanB%>ms, margin-left <%=lifespanB%>ms, background <%=lifespanB%>ms;!important",
			"ul.monome.b li.note.sweep.on" : "-webkit-transition: -webkit-transform <%=lifespanB%>ms, background 0ms;!important" 
		}

		var data = {
			lifespan : (bpm * 1000),
			sweep : (bpm * 1000),
			glow : (bpm * 1000) / 2,
			lifespanB : (bpm * 8 * 1000),
			sweepB : (bpm * 8 * 1000) * 2,
			glowB : (bpm * 8 * 1000) / 2,				
		}

		var sheet = document.styleSheets[document.styleSheets.length -1];

		for(var rule in css){

			if(css.hasOwnProperty(rule)){
				sheet.insertRule( rule + "{" + template(css[rule], data)+ "}", sheet.cssRules.length);
			}

		}




		var monomeA = require('monome-synth').Monome(ctx, mixerA, bpm).glide();
		var monomeB = require('monome-synth').Monome(ctx, mixerB, bpm * 8).waveform(ref.SAWTOOTH).glide();

		monomeA.container.addClass('a');
		monomeB.container.addClass('b')


		var resize = function(){

			var ss = measure().screenSize();

			var width = Math.min(ss.x * 0.8 / 2, ss.y * 0.8);

			monomeA
				.resize({ x : width, y : width })
				.move({ x : ss.x * 0.1 , y : ss.y * 0.1 });

			monomeB
				.resize({ x : width, y : width })
				.move({ x : (ss.x / 2) , y : ss.y * 0.1 });

		}

		events.bind(window, "resize", resize);

		resize();

}

/*

	hashChange.update(function(frag){

		if(frag !== ""){

			var str = lzw.decompressFromBase64(frag.match(/song\=([A-Za-z0-9+\/\=]+)/)[1]);

			for(var i = 0; i < 16; i++){

				for(var j = 0; j < 16; j++){
					self.rows[i][j].on = (parseInt(str.substr(j + (i * 16), 1), 2) === 1 ? true : false);

					if(self.rows[i][j].on){

						self.rows[i][j].addClass('on');

					} else {

						self.rows[i][j].removeClass('on');
					}
				}

			}

		}

	}).update();


*/