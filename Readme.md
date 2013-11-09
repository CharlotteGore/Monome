# monome

Filed under "crazy experiments using as many of my repositories as possible", this is the source for a very quickly hacked together Monome for Chrome. 

It uses the Web Audio API to generate all the sounds from raw oscillators. Which sound awful, by the way - if you just turn a sound on and off you get cracks and bangs from harmonics. So I used my animation library (Tween) to provide envelope filters for the sounds. I also used a BiQuadFilter as a low pass filter to get rid of the last of the clicks. 

I also discovered that the Web Audio stuff does not attempt to balance inputs, so if you have two oscillators going into something, both at full blast, it clips and distorts in a very unpleasant way. Adjusting the gain for the number of notes playing at once is the thing that made this actually work, I think.

I also used my Tick library to form the basis of the sequencer's timings. To be honest I found it better to start playing a note immediately and ramping up the gain when the note was due to start, then fading it out after the note was due to finish. The timing is pretty stable, I think, but it's possible it could be improved.

Added a few fancy CSS3 animations just to make it look a bit shiny and that's about it really. 

## Demo

[Link to live demo](http://charlottegore.com/monome)

## Running locally

Assuming you have Node and npm already installed...

```sh
$ npm install http-server
$ http-server . -p 3000
```

...Then open (http://localhost:3000)[http://localhost:3000]

## Building

If you absolutely need to build this locally you need a few command line tools. I'm not adding a Grunt file for this because it's not going to get worked on again.

```sh
$ npm install -g component flatinator
$ make
```


## History

- 9th November 2013 - Now uses Flatinator as part of the build step to reduce the size of the build.
- 13th July 2013 - Rejiggerated to use only 16 permanently running oscillators, with notes sounding via envelope filters rather than generating an oscillator every time a note sounds.
- 12th July 2013 - Initial version

## License

  MIT
