window.$ = require('dollar');

var measure = require('measure'),
	tick = require('tick'),
	pageVis = require('page-visibility'),
	lzw = require('lzw'),
	events = require('event'),
	noteButton = require("notebutton").NoteButton,
	voice = require("voice").Voice,

	freqs = [1244.51, 1108.73, 932.33, 830.61, 740.00, 622.25, 554.37, 466.16, 415.30, 370.00, 311.13, 277.18, 233.08, 207.65, 185.00, 155.56, 138.59, 116.54, 103.83, 92.50],

	ctx,
	bpm,
	waveform = require("voice").SINE,
	mixer;

var Monome = function( webkitAudioContext, mixer, bpm ){

	var self = this;

	ctx = webkitAudioContext;
	mixer = mixer;
	bpm = bpm;

	this.rows = [];
	this.voices = [];

	window.rows = this.rows;

	this.oscillators = [];

	this.container = ($().create('ul')).addClass('monome');

	($().getBody()).append( this.container ) ;

	for(var i = 0; i < 16; i++){

		// create an array of rows to hold our columns
		var arr = [];
		this.rows.push(arr);

		// create a new voice, while we're in a 0-15 loop. 

		var v = voice(ctx, mixer)
		v.setBPM( bpm )
		v.frequency(freqs[i + 2])
		v.waveform(waveform);

		this.voices.push( v );

		var ul = $().create('ul');

		ul.addClass('col');

		for(var j = 0; j < 16; j++){

			var button = noteButton( function(){

				self.updateCode();

			});

			button
				.appendTo( ul )

			arr.push(button);

		}

		this.container.append(ul);
	}

	var index = 15;
	var currentCol = 15;



	var nextTime = ctx.currentTime + bpm;

	pageVis.onHidden(function(){

		tick.pause();

		self.voices.forEach(function(voice){

			voice.stop();

		})

	});

	pageVis.onVisible(function(){

		nextTime = ctx.currentTime + bpm;
		tick.resume();

	});

	tick.add(function(elapsed, stop){
		var currentTime = ctx.currentTime;		
		if(currentTime > nextTime){

			var trigger = nextTime - currentTime + 0.1;

			for(var i = 0; i < 16; i++){

				self.rows[index % 16][i].removeClass('sweep');	
			}

			index++;

			var notesOn=0;

			for(var i = 0; i < 16; i++){
				self.rows[index % 16][i].addClass('sweep');

				if(self.rows[index % 16][i].on === true){
					notesOn ++;
					//self.rows[index % 16][i].play(nextTime + 0.1);					
				}				
			}

			for(var i = 0; i < 16; i++){

				if(self.rows[index % 16][i].on === true){
					self.voices[i].gain( Math.cos((1 - (1 / (notesOn ))) * (1 / (notesOn )) * Math.PI) * 0.15 ).play(nextTime + 0.1);	
					self.rows[index % 16][i].removeClass('queued');				
				}	

				if(self.rows[(index + 1) % 16][i].on === true){
					self.rows[(index + 1) % 16][i].addClass('queued');		
				}


			}

			nextTime = nextTime + bpm;

		}


	});

	//self.oscillators[0].noteOn(0);
	//self.oscillators[1].noteOn(0);
	//self.oscillators[2].noteOn(0);
	//self.oscillators[3].noteOn(0);

	return this;

}

Monome.prototype = {
	updateCode : function( callback ){

		if(callback){

		}else{
			var str = "";
			for(var i = 0; i < 16; i++){

				for(var j= 0; j < 16; j++){

					if(this.rows[i][j].on){

						str += "1";
					}else{
						str += "0";

					}

				}

			}

			//hashChange.updateHash('!song=' + lzw.compressToBase64(str));

		}

	},
	resize : function( ss ){

		var cubeSize = Math.floor(ss.y / 16);

		for(var i = 0; i < 16; i++){
			for(var j = 0; j < 16; j++){
				this.rows[i][j]
					.resize( Math.floor(cubeSize * 0.90) )
					.move( i * cubeSize , j * cubeSize )
			}

		}

		return this;

	}, 
	move : function( pos ){

		this.container.css({
			position: 'absolute',
			top : pos.y,
			left : pos.x

		});

		return this;


	},
	waveform : function( waveform ){
		for(var i = 0; i < 16; i++){
			this.voices[i].waveform(waveform);
		}
		return this;

	},
	useCode : function( code ){


	},
	glide : function(  ){
		for(var i = 0; i < 16; i++){
			this.voices[i].toggleGlide();
		}
		return this;

	}
}

module.exports.Monome = function( webkitAudioContext, mixer, bpm ){

	return new Monome( webkitAudioContext, mixer, bpm );

}