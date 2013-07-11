# monome

Filed under "crazy experiments using as many of my repositories as possible", this is the source for a very quickly hacked together Monome for Chome. 

It uses the Web Audio API to generate all the sounds from raw oscillators. Which sound awful, by the way - if you just turn a sound on and off you get cracks and bangs from harmonics. So I used my animation library (Tween) to provide envelope filters for the sounds. I also used a BiQuadFilter as a low pass filter to get rid of the last of the clicks. 

I also discovered that the Web Audio stuff does not attempt to balance inputs, so if you have two oscillators going into something, both at full blast, it clips and distorts in a very unpleasant way. Adjusting the gain for the number of notes playing at once is the thing that made this actually work, I think.

I also used my Tick library to form the basis of the sequencer's timings. To be honest I found it better to start playing a note immediately and ramping up the gain when the note was due to start, then fading it out after the note was due to finish. The timing is pretty stable, I think, but it's possible it could be improved.

Added a few fancy CSS3 animations just to make it look a bit shiny and that's about it really. 

## Installation

    $ component install charlottegore/monome
    
## Build

    $ component build

## API

   

## License

  MIT
