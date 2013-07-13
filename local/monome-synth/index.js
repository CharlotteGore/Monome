window.$ = require('dollar');

var measure = require('measure'),
	lzw = require('lzw'),
	events = require('event'),
	noteButton = require("notebutton").NoteButton,
	voice = require("voice").Voice,

	freqs = [1244.51, 1108.73, 932.33, 830.61, 740.00, 622.25, 554.37, 466.16, 415.30, 370.00, 311.13, 277.18, 233.08, 207.65, 185.00, 155.56, 138.59, 116.54, 103.83, 92.50],

	ctx,
	bpm,
	waveform = require("voice").SINE,
	mixer;

var Monome = function( webkitAudioContext, mixer, bpm, tick ){

	var self = this;

	ctx = webkitAudioContext;
	mixer = mixer;
	bpm = bpm;

	this.bpm = bpm;

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
		v.frequency(freqs[i + 4])
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



	this.nextTime = ctx.currentTime + bpm;


	tick.add(function(elapsed, stop){

		var currentTime = ctx.currentTime;		
		if(currentTime > self.nextTime){

			var trigger = self.nextTime - currentTime + 0.1;

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
					self.voices[i].gain( Math.cos((1 - (1 / (notesOn ))) * (1 / (notesOn )) * Math.PI) * 0.15 ).play(self.nextTime + 0.1);	
					self.rows[index % 16][i].removeClass('queued');				
				}	

				if(self.rows[(index + 1) % 16][i].on === true){
					self.rows[(index + 1) % 16][i].addClass('queued');		
				}


			}

			self.nextTime = self.nextTime + bpm;

		}


	});
	return this;

}

Monome.prototype = {
	updateCode : function( callback ){

		if(callback){

			this.sendNewCode = callback;
			return this;

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

			if(this.sendNewCode){

				this.sendNewCode( lzw.compressToBase64(str) );

			}

		}

	},
	useCode : function(code){

		var str = lzw.decompressFromBase64(code);
		var self = this;

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

		return this;

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
	glide : function(  ){
		for(var i = 0; i < 16; i++){
			this.voices[i].toggleGlide();
		}
		return this;

	},
	stop : function(){

		this.voices.forEach(function(voice){

			voice.stop();

		});

		return this;
	},
	resume : function(){

		this.nextTime = ctx.currentTime + this.bpm;
		return this;

	}
}

module.exports.Monome = function( webkitAudioContext, mixer, bpm, tick ){

	return new Monome( webkitAudioContext, mixer, bpm, tick);

}


/*
	pageVis.onHidden(function(){

		tick.pause();

		monomeA.stop();



	});

	pageVis.onVisible(function(){

		nextTime = ctx.currentTime + bpm;
		tick.resume();

	});
*/