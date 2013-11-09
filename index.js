var ctx = new webkitAudioContext(),
    bpm = 0.2,

    ref = ctx.createOscillator(),
    waveform = require("voice").SINE,
    mixerA = ctx.createChannelMerger(16),
    mixerB = ctx.createChannelMerger(16),
    pageVis = require("page-visibility"),
    tick = require('tick');

var gainA = ctx.createGain();
var gainB = ctx.createGain();

var hashchange = require('hashchange');

gainA.gain.value = 1//Math.cos(0.5 * 0.5* Math.PI);
gainB.gain.value = 1//Math.cos((1.0 - 0.5) * 0.5* Math.PI);

ref.connect(ctx.destination);
mixerA.connect(gainA);
mixerB.connect(gainB);

gainA.connect(ctx.destination);
gainB.connect(ctx.destination);

var codeA = "Aw18ZXTt/DFOS1b0dEA=";
var codeB = "Aw18ZXTt/DFOS1b0dEA=";

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
    "ul.monome.a li.note" : "-webkit-transition: -webkit-transform 0ms, background <%=sweep%>ms!important",
    "ul.monome.a li.note.queued" : "-webkit-transition: -webkit-transform <%=lifespan%>ms, box-shadow <%=lifespan%>ms",


    "ul.monome.a li.note.sweep.on" : "-webkit-transition: -webkit-transform <%=lifespan%>ms!important",
    "ul.monome.b li.note.sweep.on" : "-webkit-transition: -webkit-transform <%=lifespanB%>ms!important",
    //"ul.monome.b li.note" : "-webkit-transition: -webkit-transform 0ms;!important",
    "ul.monome.b li.note.queued" : "-webkit-transition: -webkit-transform <%=lifespanB%>ms, box-shadow <%=lifespan%>ms",

    "ul.monome.a li.note.on" : "-webkit-transition: background <%=lifespan%>ms, box-shadow <%=lifespan%>ms!important",
    "ul.monome.b li.note.on" : "-webkit-transition: background <%=lifespanB%>ms, box-shadow <%=lifespanB%>ms!important",

    "ul.monome.b li.note" : "-webkit-transition: -webkit-transform 0ms, background <%=sweep%>ms!important" 
}

var data = {
    lifespan : (bpm * 1000) * 0.7,
    sweep : (bpm * 1000) * 2,
    glow : (bpm * 1000) / 2,
    lifespanB : (bpm * 8 * 1000) * 0.7,
    sweepB : (bpm * 8 * 1000) * 2,
    glowB : (bpm * 8 * 1000) / 2,               
}

var sheet = document.styleSheets[document.styleSheets.length -1];

for(var rule in css){

    if(css.hasOwnProperty(rule)){
        sheet.insertRule( rule + "{" + template(css[rule], data)+ "}", sheet.cssRules.length);
    }

}

var monomeA = require('monome-synth').Monome(ctx, mixerA, bpm, tick).glide().updateCode(function(code){

    codeA = code;
    hashchange.updateHash('#!song=' + codeA + ":" + codeB);

});
var monomeB = require('monome-synth').Monome(ctx, mixerB, bpm * 4, tick).waveform(ref.SAWTOOTH).updateCode(function(code){

    codeB = code;
    hashchange.updateHash('!song=' + codeA + ":" + codeB);

});

monomeA.container.addClass('a');
monomeB.container.addClass('b')


var resize = function(){

    var ss = measure().screenSize();

    var width = Math.min(ss.x * 0.8 / 2, ss.y * 0.8);

    monomeA
        .resize({ x : width, y : width })
        .move({ x : ss.x * 0.05 , y : ss.y * 0.1 });

    monomeB
        .resize({ x : width, y : width })
        .move({ x : (ss.x / 2) + (ss.x * 0.05) , y : ss.y * 0.1 });

}

events.bind(window, "resize", resize);

resize();

hashchange.update(function(frag){

  if(frag!=="" && frag.match(/!song\=/)){

    var str = frag.replace('!song=', '');
    var bits = str.split(':');

    if(bits.length === 1){

        codeA = bits[0];
        codeB = bits[0];

    }else{

        codeA = bits[0];
        codeB = bits[1];

    }

    monomeA.useCode(codeA);
    monomeB.useCode(codeB);

  }

}).update();

pageVis.onHidden(function(){

  tick.pause();

  monomeA.stop();
  monomeB.stop();

});

pageVis.onVisible(function(){

  tick.resume();
  monomeA.resume();
  monomeB.resume();

});

