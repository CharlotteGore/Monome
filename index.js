window.$ = require('dollar');
window.measure = require('measure');
var tick = require('tick');
var pageVis = require('page-visibility');
var lzw = require('lzw');
var hashChange = require('hashchange');

var freqs = [1244.51, 1108.73, 932.33, 830.61, 740.00, 622.25, 554.37, 466.16, 415.30, 370.00, 311.13, 277.18, 233.08, 207.65, 185.00, 155.56, 138.59, 116.54, 103.83, 92.50]

var ctx = new webkitAudioContext();
var bpm = 0.5;

var osc = ctx.createOscillator();
osc.connect(ctx.destination);

var mixer = ctx.createChannelMerger(16);
mixer.connect(ctx.destination);

var Monome = function(){

	var self = this;

	this.rows = [];
	this.voices = [];

	window.rows = this.rows;

	this.oscillators = [];

	var screenSize = measure().screenSize();

	var cubeSize = Math.floor((screenSize.y - 100) / 16) - 5;

	this.container = ($().create('ul')).addClass('monome');

	($().getBody()).append( this.container ) ;

	for(var i = 0; i < 16; i++){

		// create an array of rows to hold our columns
		var arr = [];
		this.rows.push(arr);

		// create a new voice, while we're in a 0-15 loop. 
		this.voices.push(new Voice(freqs[i + 2]))

		var ul = $().create('ul');

		ul.addClass('col');

		for(var j = 0; j < 16; j++){

			var button = new NoteButton(cubeSize, i, j, function(){

				self.updateCode();

			});

			ul.append(button.getElement());

			arr.push(button);

		}

		this.container.append(ul);
	}


	this.container.css({
		position: 'absolute',
		top : 50,
		left: screenSize.x / 2 - ((cubeSize + 5) * 8)			
	})

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

				self.rows[index % 16][i].element.removeClass('sweep');	
			}

			index++;

			var notesOn=0;

			for(var i = 0; i < 16; i++){
				self.rows[index % 16][i].element.addClass('sweep');

				if(self.rows[index % 16][i].on === true){
					notesOn ++;
					//self.rows[index % 16][i].play(nextTime + 0.1);					
				}				
			}

			for(var i = 0; i < 16; i++){

				if(self.rows[index % 16][i].on === true){
					self.voices[i].gain( 1/ notesOn).play(nextTime + 0.1)				
				}				
			}

			nextTime = nextTime + bpm;

		}


	});

	hashChange.update(function(frag){

		var str = lzw.decompressFromBase64(frag.match(/song\=([A-Za-z0-9+\/\=]+)/)[1]);

		for(var i = 0; i < 16; i++){

			for(var j = 0; j < 16; j++){
				self.rows[i][j].on = (parseInt(str.substr(j + (i * 16), 1), 2) === 1 ? true : false);

				if(self.rows[i][j].on){

					self.rows[i][j].element.addClass('on');

				} else {

					self.rows[i][j].element.removeClass('on');
				}
			}

		}

	}).update();



	//self.oscillators[0].noteOn(0);
	//self.oscillators[1].noteOn(0);
	//self.oscillators[2].noteOn(0);
	//self.oscillators[3].noteOn(0);

	return this;

}

Monome.prototype = {
	updateCode : function(){
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

		hashChange.updateHash('!song=' + lzw.compressToBase64(str));

	}
}

var Voice = function( frequency ){

	var self = this;

	// create our notes
	this.filter = ctx.createBiquadFilter(); // low pass filter for getting rid of errant harmonics.
	this.masterVolume = ctx.createGain(); // master volume is set based on the number of sounds to be played this step
	this.envelope = ctx.createGain(); // envelope filter for playing notes
	this.osc = ctx.createOscillator(); // our oscillator. Probably shouldn't be making lots of these.

	// route the web audio notes
	this.masterVolume.connect(mixer);
	this.filter.connect(this.masterVolume);
	this.envelope.connect(this.filter);
	this.osc.connect(this.envelope);

	// configure the notes
	this.masterVolume.gain.value = 0;
	this.envelope.gain.value = 0;

	this.filter.type = 3;
	this.filter.frequency.value = 3000;
	this.filter.Q.value = 1;

	
	this.osc.type=osc.SINE;
	this.osc.frequency.value = frequency;

	var updateEnvelope = function(o){

		self.envelope.gain.value = o.value;

	}

	this.rampUp = require('tween').Tweening({ value: 0 }).to({ value: 1 }).using('ease-in').duration(250).tick(updateEnvelope);
	this.rampDown = require('tween').Tweening({ value: 1 }).to({ value: 0 }).using('ease-out').duration(250).tick(updateEnvelope);

	this.rampUpTimeout = -1;
	this.rampDownTimeout = -1;

	// start the oscillator
	this.osc.start(ctx.currentTime);

	return this;


}

Voice.prototype = {

	play : function(startTime){
		
		clearTimeout(this.rampDownTimeout);
		this.rampDown.stop();

		this.osc.start(ctx.currentTime);

		var self = this,
			start = Math.floor(startTime - ctx.currentTime) * 1000;
		
		this.rampUpTimeout = setTimeout(function(){

			self.rampUp.play();

		}, start );
		
		this.rampDownTimeout = setTimeout(function(){

			self.rampDown.play();

		}, start + 500);

	},
	gain : function( gain ){

		this.masterVolume.gain.value = gain;

		this.osc.start(ctx.currentTime);
		return this;

	},
	stop : function(){

		this.rampUp.stop();
		this.rampDown.stop();
		clearTimeout(this.rampDownTimeout);
		clearTimeout(this.rampUpTimeout);
		this.envelope.gain.value = 0;

	}


}

var NoteButton = function(cubeSize, i, j, onUpdate){

	var self = this;
	this.on = false;

	this.element = ($().create('li')).addClass('note');

	this.element.css({
		width : cubeSize -2 + "px",
		height : cubeSize -2 + "px",
		left : (cubeSize + 5) * i + "px",
		top : (cubeSize + 5) * j + "px",
	});

	this.element.bind('click', function(){

		self.element.toggleClass('on');
		self.on = !self.on;
		onUpdate();

	});

	return this;

}

NoteButton.prototype = {
	getElement : function(){

		return this.element;

	}
}


new Monome();