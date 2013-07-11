window.$ = require('dollar');
window.measure = require('measure');
var tick = require('tick');

var freqs = [1244.51, 1108.73, 932.33, 830.61, 740.00, 622.25, 554.37, 466.16, 415.30, 370.00, 311.13, 277.18, 233.08, 207.65, 185.00, 155.56, 138.59]

var ctx = new webkitAudioContext();
var bpm = 0.4;

var osc = ctx.createOscillator();
osc.connect(ctx.destination);

var mixer = ctx.createChannelMerger(16);
mixer.connect(ctx.destination);

var Monome = function(){

	var self = this;

	this.rows = [];

	this.oscillators = [];

	var screenSize = measure().screenSize();

	var cubeSize = Math.floor((screenSize.y - 100) / 16) - 5;

	this.container = ($().create('ul')).addClass('monome');

	($().getBody()).append( this.container ) ;

	for(var i = 0; i < 16; i++){
		var arr = [];
		this.rows.push(arr);

		var ul = $().create('ul');

		ul.addClass('col');

		for(var j = 0; j < 16; j++){

			var button = new NoteButton(cubeSize, i, j, freqs[j]);

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

	var index = 0;
	var currentCol = 15;

	var nextTime = ctx.currentTime + 0.5;

	

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
					self.rows[index % 16][i].play(nextTime + 0.1, notesOn);					
				}				
			}

			nextTime = nextTime + 0.5;

		}
	})

	//self.oscillators[0].noteOn(0);
	//self.oscillators[1].noteOn(0);
	//self.oscillators[2].noteOn(0);
	//self.oscillators[3].noteOn(0);

	return this;

}

var ButtonRow = function(){



}

var NoteButton = function(cubeSize, i, j, freq){

	var self = this;
	this.on = false;
	this.freq = freq;

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



	})

	return this;

}

NoteButton.prototype = {
	getElement : function(){

		return this.element;

	},
	play : function( startTime, count){

		var osc = ctx.createOscillator();
		var gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(mixer);
		gain.gain.value = 0;
		osc.frequency.value = this.freq;
		osc.start(ctx.currentTime);
		osc.stop(startTime + (bpm + 0.5) );
		osc.type=osc.SINE;

		var start = Math.floor(startTime - ctx.currentTime) * 1000;

		

		var cb = function(o){

			gain.gain.value = o.value;

		}
		var tweenA = require('tween').Tweening({ value: 0 }).to({ value: 1/count }).using('ease-in-expo').duration(100).tick(cb);
		var tweenB = require('tween').Tweening({ value: 1/count }).to({ value: 0 }).using('ease-out-expo').duration(100).tick(cb);
		
		setTimeout(function(){

			tweenA.play();

		}, Math.floor(startTime - ctx.currentTime) * 1000 );
		
		setTimeout(function(){

			tweenB.play();

		}, start + 500)

		

	}
}


new Monome();