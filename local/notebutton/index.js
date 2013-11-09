var $ = require('dollar');

var NoteButton = function( onUpdate, lifespan ){

  var self = this;
  this.on = false;

  this.element = ($().create('li')).addClass('note');

  this.element.bind('click', function(){

    self.element.toggleClass('on');
    self.on = !self.on;
    self.element.removeClass('unqueued').removeClass('queued');
    onUpdate();

  });

  return this;

}

NoteButton.prototype = {
  resize : function( size ){
    this.size = size;
    this.element.css({
      width : size - 2,
      height : size -2 
    });
    return this;
  },
  move : function( x, y ){
    this.element.css({
      left : x,
      top : y
    });
    return this;
  },
  addClass : function( className ){
    this.element.addClass( className );
    return this;

  },
  removeClass : function( className ){
    this.element.removeClass( className );
    return this;
  },
  toggleClass : function( className ){
    this.element.toggleClass( className );
    return this;
  },
  appendTo : function( el ){
    this.element.appendTo( el );
    return this;    
  }
}

module.exports.NoteButton = function( onUpdate, lifespan ){

  return new NoteButton( onUpdate, lifespan )

}

