var ctx;


var Voice = function( webAudioContext , mixer ){

	var self = this;

	ctx = webAudioContext;

	//this.frequency = frequency;

	this.bpm = 0.5;

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

	this.filter.type = 0;
	//this.filter.frequency.value = frequency * 2;
	this.filter.Q.value =0.5 ;


	this.rampUpTimeout = -1;
	this.rampDownTimeout = -1;
	this.doGlide = false;

	// start the oscillator
	this.osc.start(ctx.currentTime);

	return this;


}

Voice.prototype = {

	play : function(startTime){

		var bpm = this.bpm;

		debugger;

		clearTimeout(this.rampDownTimeout);
		clearTimeout(this.rampUpTimeout);

		if(this.rampUp && this.rampDown){
			this.rampDown.stop();
			this.rampUp.stop();
		}

		var updateEnvelope = function(o){

			self.envelope.gain.value = o.value;

		}


		var self = this,
			start = Math.floor(startTime - ctx.currentTime) * 1000;

		var updateEnvelope = function(o){

			self.envelope.gain.value = o.value;

		}
		
		this.rampUp = require('tween').Tweening({ value: this.envelope.gain.value }).to({ value: 1 }).using('ease-in').duration(  Math.round( (bpm * 1000) / 2) ).tick(updateEnvelope); //.begin(function(){self.osc.type = self.osc.SINE}).finish(function(){ self.osc.type = self.osc.SINE});
		this.rampDown = require('tween').Tweening({ value: 1 }).to({ value: 0 }).using('ease-out').duration( Math.round( (bpm * 1000 * 2))).tick(updateEnvelope); // .begin(function(){self.osc.type = self.osc.SINE});
		
		if(this.doGlide){
			this.glide = require('tween').Tweening({ value: -600 }).to({ value: 0}).using('linear').duration( Math.round( (bpm * 1000) / 20) ).tick(function(o){self.osc.detune.value = o.value;});
		}

		this.rampUpTimeout = setTimeout(function(){

			self.rampUp.play();
			self.glide.play();

		}, start );

		debugger;
		
		this.rampDownTimeout = setTimeout(function(){

			self.rampDown.play();

		}, start + Math.round((bpm * 1000 * 0.8)));

		return this;

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

		this.rampUpTimeout = -1;
		this.rampDownTimeout = -1;

	},
	square : function(){

		this.osc.type = this.osc.SQUARE;
		return this;

	},
	triangle : function(){
		this.osc.type = this.osc.TRIANGLE;
		return this;
	},
	ramp : function(){
		this.osc.type = this.osc.SAWTOOTH;		
		return this;
	},
	sine : function(){
		this.osc.type = this.osc.SINE;
		return this;
	},
	waveform : function(waveform){
		this.osc.type = waveform;
		return this;
	},
	frequency : function( frequency ){
		this.osc.frequency.value = frequency;
		this.filter.frequency.value = frequency * 2;
		return this;
	},
	setBPM : function( beatsPerMinute ){
		this.bpm = beatsPerMinute;
		return this;
	},
	toggleGlide : function(){
		this.doGlide = true;
		return this;

	}


}

module.exports.Voice = function( frequency, waveform ){

	return new Voice( frequency, waveform );

}

module.exports.SINE = 0;
module.exports.SQUARE = 1;
module.exports.SAWTOOTH = 2;
module.exports.TRIANGLE = 3;