(function() {
  /**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */
    function require(path, parent, orig) {
    var resolved = require.resolve(path);
    // lookup failed
    if (null == resolved) {
      orig = orig || path;
      parent = parent || "root";
      var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
      err.path = orig;
      err.parent = parent;
      err.require = true;
      throw err;
    }
    var module = require.modules[resolved];
    // perform real require()
    // by invoking the module's
    // registered function
    if (!module._resolving && !module.exports) {
      var mod = {};
      mod.exports = {};
      mod.client = mod.component = true;
      module._resolving = true;
      module.call(this, mod.exports, require, mod);
      delete module._resolving;
      module.exports = mod.exports;
    }
    return module.exports;
  }

  /**
 * Registered modules.
 */
  require.modules = {};

  /**
 * Registered aliases.
 */
  require.aliases = {};

  /**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */
  require.resolve = function(path) {
    if (path.charAt(0) === "/") path = path.slice(1);
    var paths = [ path, path + ".js", path + ".json", path + "/index.js", path + "/index.json" ];
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      if (require.modules.hasOwnProperty(path)) return path;
      if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
    }
  };

  /**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */
  require.normalize = function(curr, path) {
    var segs = [];
    if ("." != path.charAt(0)) return path;
    curr = curr.split("/");
    path = path.split("/");
    for (var i = 0; i < path.length; ++i) {
      if (".." == path[i]) {
        curr.pop();
      } else if ("." != path[i] && "" != path[i]) {
        segs.push(path[i]);
      }
    }
    return curr.concat(segs).join("/");
  };

  /**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */
  require.register = function(path, definition) {
    require.modules[path] = definition;
  };
  require.register("event", function(exports, require, module) {
    /**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */
    exports.bind = function(el, type, fn, capture) {
      if (el.addEventListener) {
        el.addEventListener(type, fn, capture || false);
      } else {
        el.attachEvent("on" + type, fn);
      }
      return fn;
    };
    /**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */
    exports.unbind = function(el, type, fn, capture) {
      if (el.removeEventListener) {
        el.removeEventListener(type, fn, capture || false);
      } else {
        el.detachEvent("on" + type, fn);
      }
      return fn;
    };
  })
  require.register("measure", function(exports, require, module) {
    var Measure = function(el) {
      this.el = el;
      return this;
    };
    var IEStyles = {
      "padding-top": "paddingTop",
      "padding-bottom": "paddingBottom",
      "padding-left": "paddingLeft",
      "padding-right": "paddingRight",
      "border-top-width": "borderTopWidth",
      "border-left-width": "borderLeftWidth",
      "border-right-width": "borderRightWidth",
      "border-bottom-width": "borderBottomWidth",
      "margin-top": "marginTop",
      "margin-left": "marginLeft",
      "margin-right": "marginRight",
      "margin-bottom": "marginBottom"
    };
    var getStyle = function(property, e) {
      var val;
      if (e.currentStyle) {
        val = parseInt(e.currentStyle[IEStyles[property]].replace("px", ""), 10);
      } else if (window.getComputedStyle) {
        val = parseInt(document.defaultView.getComputedStyle(e, null).getPropertyValue(property).replace("px", ""), 10);
      }
      return val;
    };
    var getBoxDetail = function(e) {
      var padding = {}, border = {}, margin = {};
      padding.top = getStyle("padding-top", e);
      padding.right = getStyle("padding-right", e);
      padding.bottom = getStyle("padding-bottom", e);
      padding.left = getStyle("padding-left", e);
      margin.top = getStyle("margin-top", e);
      margin.right = getStyle("margin-right", e);
      margin.bottom = getStyle("margin-bottom", e);
      margin.left = getStyle("margin-left", e);
      border.top = getStyle("border-top-width", e);
      border.right = getStyle("border-right-width", e);
      border.bottom = getStyle("border-bottom-width", e);
      border.left = getStyle("border-left-width", e);
      return {
        padding: padding,
        border: border,
        margin: margin
      };
    };
    Measure.prototype = {
      pagePosition: function() {
        var curleft = 0, curtop = 0, e = this.el;
        var m = this.boxDetails().margin;
        if (e.offsetParent) {
          do {
            curleft += e.offsetLeft;
            curtop += e.offsetTop;
          } while (e = e.offsetParent);
          curleft -= m.left;
          curtop -= m.top;
          return {
            x: curleft,
            y: curtop
          };
        }
      },
      innerPosition: function() {
        var m = this.boxDetails().margin;
        var xOffset = m.left;
        var yOffset = m.top;
        var curleft = 0, curtop = 0;
        curleft += el.offsetLeft - xOffset;
        curtop += el.offsetTop - yOffset;
        return {
          x: curleft,
          y: curtop
        };
      },
      boxDetails: function() {
        return getBoxDetail(this.el);
      },
      innerSize: function() {
        var e = this.el;
        var boxDetails = getBoxDetail(e);
        var p = boxDetails.padding;
        var b = boxDetails.border;
        var xOffset = p.left + p.right + b.left + b.right;
        var yOffset = p.top + p.bottom + b.top + b.bottom;
        var x = 0, y = 0;
        x = Math.max(el.clientWidth, el.offsetWidth) - xOffset;
        y = Math.max(el.clientHeight, el.offsetHeight) - yOffset;
        return {
          x: x,
          y: y
        };
      },
      outerSize: function() {
        var x = 0, y = 0, e = this.el;
        x = Math.max(e.clientWidth, e.offsetWidth);
        y = Math.max(e.clientHeight, e.offsetHeight);
        return {
          x: x,
          y: y
        };
      },
      screenSize: function() {
        var w = window, d = document, e = d.documentElement, g = d.getElementsByTagName("body")[0], x = w.innerWidth || e.clientWidth || g.clientWidth, y = w.innerHeight || e.clientHeight || g.clientHeight;
        return {
          x: x,
          y: y
        };
      }
    };
    module.exports = function(el) {
      return new Measure(el);
    };
  })
  require.register("each", function(exports, require, module) {
    "use strict";
    var nativeForEach = [].forEach;
    // Underscore's each function
    module.exports = function(obj, iterator, context) {
      if (obj == null) return;
      if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (iterator.call(context, obj[i], i, obj) === {}) return;
        }
      } else {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (iterator.call(context, obj[key], key, obj) === {}) return;
          }
        }
      }
    };
  })
  require.register("indexof", function(exports, require, module) {
    module.exports = function(arr, obj) {
      if (arr.indexOf) return arr.indexOf(obj);
      for (var i = 0; i < arr.length; ++i) {
        if (arr[i] === obj) return i;
      }
      return -1;
    };
  })
  require.register("hashchange", function(exports, require, module) {
    var each = require("each"), indexOf = require("indexof");
    var getFragment = function(url) {
      var url = url || window.location.href;
      return url.replace(/^[^#]*#?(.*)$/, "$1");
    };
    var detectIE6to8 = function() {
      var rv = -1;
      // Return value assumes failure.
      if (navigator.appName == "Microsoft Internet Explorer") {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");
        if (re.exec(ua) != null) rv = parseFloat(RegExp.$1);
      }
      if (rv === 6 || rv === 7) {
        return true;
      } else {
        return false;
      }
    };
    var HashChange = function() {
      var self = this;
      this.onChangeCallbacks = [];
      if (detectIE6to8()) {
        this.setupFallback();
      } else {
        window.onhashchange = function() {
          self.hashChanged();
        };
      }
      return this;
    };
    HashChange.prototype = {
      update: function(callback) {
        if (callback) {
          this.onChangeCallbacks.push(callback);
          return this;
        } else {
          this.hashChanged();
        }
      },
      unbind: function(callback) {
        var i = indexOf(this.onChangeCallbacks, callback);
        if (i !== -1) {
          this.onChangeCallbacks.splice(i - 1, 1);
        }
        return this;
      },
      updateHash: function(hash) {
        this.currentHash = hash;
        window.location.href = window.location.href.replace(/#.*/, "") + "#" + hash;
      },
      hashChanged: function() {
        if (this.onChangeCallbacks.length) {
          each(this.onChangeCallbacks, function(callback) {
            callback(getFragment());
            return true;
          });
        }
        return this;
      },
      setupFallback: function() {
        var self = this;
        window.onload = function() {
          var tickerId = -1;
          var delay = 100;
          var iframe = document.createElement("iframe");
          iframe.setAttribute("src", "javascript:0");
          iframe.style.display = "none";
          document.getElementsByTagName("body")[0].appendChild(iframe);
          iframe = iframe.contentWindow;
          var setHistory = function(hash, historyHash) {
            if (hash !== historyHash) {
              var doc = iframe.document;
              doc.open();
              doc.close();
              doc.location.hash = "#" + hash;
            }
          };
          var getHistory = function() {
            return getFragment(iframe.document.location.href);
          };
          var old = getFragment();
          setHistory(old);
          var ticker = function() {
            var curr = getFragment(), historyHash = getHistory(old);
            if (curr !== old) {
              setHistory(old = curr, historyHash);
              self.hashChanged();
            } else if (historyHash !== old) {
              window.location.href = window.location.href.replace(/#.*/, "") + "#" + historyHash;
            }
            tickerId = setTimeout(ticker, delay);
          };
          setTimeout(ticker, delay);
          return this;
        };
      }
    };
    hashChange = new HashChange();
    module.exports = hashChange;
  })
  require.register("raf", function(exports, require, module) {
    /**
 * Expose `requestAnimationFrame()`.
 */
    exports = module.exports = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || fallback;
    /**
 * Fallback implementation.
 */
    var prev = new Date().getTime();
    function fallback(fn) {
      var curr = new Date().getTime();
      var ms = Math.max(0, 16 - (curr - prev));
      var req = setTimeout(fn, ms);
      prev = curr;
      return req;
    }
    /**
 * Cancel.
 */
    var cancel = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame || window.clearTimeout;
    exports.cancel = function(id) {
      cancel.call(window, id);
    };
  })
  require.register("tick", function(exports, require, module) {
    var raf = require("raf"), time = Date.now || function() {
      return new Date().getTime();
    }, start = time(), now;
    // normalise the time functionality
    if (window.performance && window.performance.now) {
      now = function() {
        return performance.now();
      };
      start = performance.timing.navigationStart;
    } else {
      now = function() {
        return time() - start;
      };
    }
    var callbacks = {};
    var uuid = 0;
    var runCallbacks = function(timestamp) {
      var self = this;
      for (i in callbacks) {
        if (callbacks.hasOwnProperty(i)) {
          callbacks[i].update(timestamp);
        }
      }
      return true;
    };
    var Tick = function() {
      var self = this;
      var tick;
      raf(function(elapsed) {
        if (window.performance && window.performance.now) {
          if (elapsed && /\./.test(elapsed.toString())) {
            // requestAnimationFrame returns sexy sub-millisecond elapsed time
            tick = function tick(timestamp) {
              runCallbacks.call(self, timestamp);
              raf(tick);
            };
          } else {
            // requestAnimationFrame returns a lame unix timestamp. At least we've got performance.now() though.
            tick = function tick() {
              runCallbacks.call(self, performance.now());
              raf(tick);
            };
          }
        } else {
          tick = function tick() {
            runCallbacks.call(self, now());
            raf(tick);
          };
        }
        // go go go!
        raf(tick);
      });
      return this;
    };
    Tick.prototype = {
      add: function(task) {
        var create = function(callback, start, stop) {
          var paused = false;
          var pausedAt;
          return {
            update: function(now) {
              if (!paused) {
                callback(now - start, stop);
              }
            },
            pause: function() {
              paused = true;
              pausedAt = now();
            },
            resume: function() {
              start = start + now() - pausedAt;
              paused = false;
            },
            stop: stop
          };
        };
        return function(callback) {
          var id = ++uuid;
          var stop = function() {
            delete callbacks[id];
          };
          callbacks[id] = create(callback, now(), stop);
          return {
            id: id,
            stop: stop,
            pause: callbacks[id].pause,
            resume: callbacks[id].resume
          };
        };
      }(),
      now: function() {
        return now();
      },
      pause: function() {
        for (i in callbacks) {
          if (callbacks.hasOwnProperty(i)) {
            callbacks[i].pause();
          }
        }
      },
      resume: function() {
        for (i in callbacks) {
          if (callbacks.hasOwnProperty(i)) {
            callbacks[i].resume();
          }
        }
      },
      stop: function() {
        for (i in callbacks) {
          if (callbacks.hasOwnProperty(i)) {
            callbacks[i].stop();
          }
        }
      }
    };
    var tick = new Tick();
    module.exports = tick;
  })
  require.register("page-visibility", function(exports, require, module) {
    var PageVisibility = function() {
      var body = document.body, self = this, hidden = "hidden";
      this.callbacks = {
        visible: [],
        hidden: []
      };
      var onChange = function() {
        document[hidden] ? self.isHidden() : self.isVisible();
      };
      var listen = function(prefix) {
        document.addEventListener(prefix + "visibilitychange", onChange);
      };
      var test = function(prop) {
        if (prop in document) {
          hidden = prop;
          return true;
        } else {
          return false;
        }
      };
      if (test("hidden")) {
        listen("");
      } else if (test("mozHidden")) {
        listen("moz");
      } else if (test("webkitHidden")) {
        listen("webkit");
      } else if (test("msHidden")) {
        listen("ms");
      } else if ("onfocusin" in document) {
        document.onfocusin = function() {
          self.isVisible();
        };
        document.onfocusout = function() {
          self.isHidden();
        };
      } else {
        window.onfocus = function() {
          self.isVisible();
        };
        window.onblur = function() {
          self.isHidden();
        };
      }
    };
    PageVisibility.prototype = {
      isVisible: function() {
        var i = 0, length = this.callbacks.visible.length;
        while (i < length && this.callbacks.visible[i++]() !== false) ;
        return this;
      },
      isHidden: function() {
        var i = 0, length = this.callbacks.hidden.length;
        while (i < length && this.callbacks.hidden[i++]() !== false) ;
        return this;
      },
      onVisible: function(callback) {
        this.callbacks.visible.push(callback);
        return this;
      },
      onHidden: function(callback) {
        this.callbacks.hidden.push(callback);
        return this;
      }
    };
    pageVis = new PageVisibility();
    module.exports = pageVis;
  })
  require.register("classes", function(exports, require, module) {
    /**
 * Module dependencies.
 */
    var index = require("indexof");
    /**
 * Whitespace regexp.
 */
    var re = /\s+/;
    /**
 * toString reference.
 */
    var toString = Object.prototype.toString;
    /**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */
    module.exports = function(el) {
      return new ClassList(el);
    };
    /**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */
    function ClassList(el) {
      if (!el) throw new Error("A DOM element reference is required");
      this.el = el;
      this.list = el.classList;
    }
    /**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */
    ClassList.prototype.add = function(name) {
      // classList
      if (this.list) {
        this.list.add(name);
        return this;
      }
      // fallback
      var arr = this.array();
      var i = index(arr, name);
      if (!~i) arr.push(name);
      this.el.className = arr.join(" ");
      return this;
    };
    /**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */
    ClassList.prototype.remove = function(name) {
      if ("[object RegExp]" == toString.call(name)) {
        return this.removeMatching(name);
      }
      // classList
      if (this.list) {
        this.list.remove(name);
        return this;
      }
      // fallback
      var arr = this.array();
      var i = index(arr, name);
      if (~i) arr.splice(i, 1);
      this.el.className = arr.join(" ");
      return this;
    };
    /**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */
    ClassList.prototype.removeMatching = function(re) {
      var arr = this.array();
      for (var i = 0; i < arr.length; i++) {
        if (re.test(arr[i])) {
          this.remove(arr[i]);
        }
      }
      return this;
    };
    /**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */
    ClassList.prototype.toggle = function(name) {
      // classList
      if (this.list) {
        this.list.toggle(name);
        return this;
      }
      // fallback
      if (this.has(name)) {
        this.remove(name);
      } else {
        this.add(name);
      }
      return this;
    };
    /**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */
    ClassList.prototype.array = function() {
      var str = this.el.className.replace(/^\s+|\s+$/g, "");
      var arr = str.split(re);
      if ("" === arr[0]) arr.shift();
      return arr;
    };
    /**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */
    ClassList.prototype.has = ClassList.prototype.contains = function(name) {
      return this.list ? this.list.contains(name) : !!~index(this.array(), name);
    };
  })
  require.register("dollar", function(exports, require, module) {
    var each = require("each");
    var classes = require("classes");
    var events = require("event");
    var defaultDisplay = "";
    var Dollar = function(element) {
      if (element) {
        this[0] = element;
        this.length = 1;
      }
      return this;
    };
    Dollar.prototype = {
      length: 0,
      selector: "",
      create: function(tagName) {
        this[0] = document.createElement(tagName);
        return this;
      },
      getById: function(id) {
        this[0] = document.getElementById(id);
        if (this[0]) {
          this.length = 1;
        }
        return this;
      },
      getHead: function() {
        this[0] = document.getElementsByTagName("head")[0];
        if (this[0]) {
          this.length = 1;
        }
        return this;
      },
      getBody: function() {
        this[0] = document.getElementsByTagName("body")[0];
        if (this[0]) {
          this.length = 1;
        }
        return this;
      },
      attr: function(attr, val) {
        this[0].setAttribute(attr, val);
        return this;
      },
      appendTo: function(dollarObj) {
        dollarObj[0].appendChild(this[0]);
        return this;
      },
      append: function(dollarObj) {
        this[0].appendChild(dollarObj[0]);
        return this;
      },
      text: function(text) {
        var self = this, el;
        if (this[0].childNodes.length > 0) {
          each(this[0].childNodes, function(node) {
            if (node.nodeType === 3) {
              // text node
              self[0].removeChild(node);
            }
          });
        }
        el = document.createTextNode(text);
        this[0].appendChild(el);
        return this;
      },
      addClass: function(name) {
        classes(this[0]).add(name);
        return this;
      },
      removeClass: function(name) {
        classes(this[0]).remove(name);
        return this;
      },
      hasClass: function(name) {
        return classes(this[0]).has(name);
      },
      toggleClass: function(name) {
        classes(this[0]).toggle(name);
        return this;
      },
      css: function(obj) {
        var self = this;
        each(obj, function(value, key) {
          if ("number" === typeof value) {
            value += "px";
          }
          self[0].style[key] = value;
        });
        return this;
      },
      hide: function() {
        defaultDisplay = this[0].style.display;
        this[0].style.display = "none";
        this[0].style.visibility = "hidden";
        return this;
      },
      show: function() {
        this[0].style.display = defaultDisplay;
        this[0].style.visibility = "visible";
        return this;
      },
      toggle: function() {
        if (this[0].style.display === "none" || this[0].style.visibility === "hidden") {
          this.show();
        } else {
          this.hide();
        }
        return this;
      },
      onClick: function(callback) {
        events.bind(this[0], "click", function(e) {
          var preventDefault = false;
          if (!e.preventDefault) {
            e.preventDefault = function() {
              preventDefault = true;
            };
          }
          callback(e);
          if (preventDefault) {
            return false;
          }
        });
        return this;
      },
      bind: function(event, callback) {
        events.bind(this[0], event, function(e) {
          var preventDefault = false;
          if (!e.preventDefault) {
            e.preventDefault = function() {
              preventDefault = true;
            };
          }
          callback(e);
          if (preventDefault) {
            return false;
          }
        });
        return this;
      },
      unbind: function(event, callback) {
        events.unbind(this[0], event, callback);
        return this;
      }
    };
    module.exports = function(element) {
      return new Dollar(element);
    };
  })
  require.register("lzw", function(exports, require, module) {
    // Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
    // This work is free. You can redistribute it and/or modify it
    // under the terms of the WTFPL, Version 2
    // For more information see LICENSE.txt or http://www.wtfpl.net/
    //
    // For more information, the home page:
    // http://pieroxy.net/blog/pages/lz-string/testing.html
    //
    // LZ-based compression algorithm, version 1.3.0-rc1
    var LZString = {
      // private property
      _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      compressToBase64: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = this.compress(input);
        while (i < input.length * 2) {
          if (i % 2 == 0) {
            chr1 = input.charCodeAt(i / 2) >> 8;
            chr2 = input.charCodeAt(i / 2) & 255;
            if (i / 2 + 1 < input.length) chr3 = input.charCodeAt(i / 2 + 1) >> 8; else chr3 = NaN;
          } else {
            chr1 = input.charCodeAt((i - 1) / 2) & 255;
            if ((i + 1) / 2 < input.length) {
              chr2 = input.charCodeAt((i + 1) / 2) >> 8;
              chr3 = input.charCodeAt((i + 1) / 2) & 255;
            } else chr2 = chr3 = NaN;
          }
          i += 3;
          enc1 = chr1 >> 2;
          enc2 = (chr1 & 3) << 4 | chr2 >> 4;
          enc3 = (chr2 & 15) << 2 | chr3 >> 6;
          enc4 = chr3 & 63;
          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }
          output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
      },
      decompressFromBase64: function(input) {
        var output = "", ol = 0, output_, chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
          enc1 = this._keyStr.indexOf(input.charAt(i++));
          enc2 = this._keyStr.indexOf(input.charAt(i++));
          enc3 = this._keyStr.indexOf(input.charAt(i++));
          enc4 = this._keyStr.indexOf(input.charAt(i++));
          chr1 = enc1 << 2 | enc2 >> 4;
          chr2 = (enc2 & 15) << 4 | enc3 >> 2;
          chr3 = (enc3 & 3) << 6 | enc4;
          if (ol % 2 == 0) {
            output_ = chr1 << 8;
            flush = true;
            if (enc3 != 64) {
              output += String.fromCharCode(output_ | chr2);
              flush = false;
            }
            if (enc4 != 64) {
              output_ = chr3 << 8;
              flush = true;
            }
          } else {
            output = output + String.fromCharCode(output_ | chr1);
            flush = false;
            if (enc3 != 64) {
              output_ = chr2 << 8;
              flush = true;
            }
            if (enc4 != 64) {
              output += String.fromCharCode(output_ | chr3);
              flush = false;
            }
          }
          ol += 3;
        }
        return this.decompress(output);
      },
      compressToUTF16: function(input) {
        var output = "", i, c, current, status = 0;
        input = this.compress(input);
        for (i = 0; i < input.length; i++) {
          c = input.charCodeAt(i);
          switch (status++) {
           case 0:
            output += String.fromCharCode((c >> 1) + 32);
            current = (c & 1) << 14;
            break;

           case 1:
            output += String.fromCharCode(current + (c >> 2) + 32);
            current = (c & 3) << 13;
            break;

           case 2:
            output += String.fromCharCode(current + (c >> 3) + 32);
            current = (c & 7) << 12;
            break;

           case 3:
            output += String.fromCharCode(current + (c >> 4) + 32);
            current = (c & 15) << 11;
            break;

           case 4:
            output += String.fromCharCode(current + (c >> 5) + 32);
            current = (c & 31) << 10;
            break;

           case 5:
            output += String.fromCharCode(current + (c >> 6) + 32);
            current = (c & 63) << 9;
            break;

           case 6:
            output += String.fromCharCode(current + (c >> 7) + 32);
            current = (c & 127) << 8;
            break;

           case 7:
            output += String.fromCharCode(current + (c >> 8) + 32);
            current = (c & 255) << 7;
            break;

           case 8:
            output += String.fromCharCode(current + (c >> 9) + 32);
            current = (c & 511) << 6;
            break;

           case 9:
            output += String.fromCharCode(current + (c >> 10) + 32);
            current = (c & 1023) << 5;
            break;

           case 10:
            output += String.fromCharCode(current + (c >> 11) + 32);
            current = (c & 2047) << 4;
            break;

           case 11:
            output += String.fromCharCode(current + (c >> 12) + 32);
            current = (c & 4095) << 3;
            break;

           case 12:
            output += String.fromCharCode(current + (c >> 13) + 32);
            current = (c & 8191) << 2;
            break;

           case 13:
            output += String.fromCharCode(current + (c >> 14) + 32);
            current = (c & 16383) << 1;
            break;

           case 14:
            output += String.fromCharCode(current + (c >> 15) + 32, (c & 32767) + 32);
            status = 0;
            break;
          }
        }
        return output + String.fromCharCode(current + 32);
      },
      decompressFromUTF16: function(input) {
        var output = "", current, c, status = 0, i = 0;
        while (i < input.length) {
          c = input.charCodeAt(i) - 32;
          switch (status++) {
           case 0:
            current = c << 1;
            break;

           case 1:
            output += String.fromCharCode(current | c >> 14);
            current = (c & 16383) << 2;
            break;

           case 2:
            output += String.fromCharCode(current | c >> 13);
            current = (c & 8191) << 3;
            break;

           case 3:
            output += String.fromCharCode(current | c >> 12);
            current = (c & 4095) << 4;
            break;

           case 4:
            output += String.fromCharCode(current | c >> 11);
            current = (c & 2047) << 5;
            break;

           case 5:
            output += String.fromCharCode(current | c >> 10);
            current = (c & 1023) << 6;
            break;

           case 6:
            output += String.fromCharCode(current | c >> 9);
            current = (c & 511) << 7;
            break;

           case 7:
            output += String.fromCharCode(current | c >> 8);
            current = (c & 255) << 8;
            break;

           case 8:
            output += String.fromCharCode(current | c >> 7);
            current = (c & 127) << 9;
            break;

           case 9:
            output += String.fromCharCode(current | c >> 6);
            current = (c & 63) << 10;
            break;

           case 10:
            output += String.fromCharCode(current | c >> 5);
            current = (c & 31) << 11;
            break;

           case 11:
            output += String.fromCharCode(current | c >> 4);
            current = (c & 15) << 12;
            break;

           case 12:
            output += String.fromCharCode(current | c >> 3);
            current = (c & 7) << 13;
            break;

           case 13:
            output += String.fromCharCode(current | c >> 2);
            current = (c & 3) << 14;
            break;

           case 14:
            output += String.fromCharCode(current | c >> 1);
            current = (c & 1) << 15;
            break;

           case 15:
            output += String.fromCharCode(current | c);
            status = 0;
            break;
          }
          i++;
        }
        return this.decompress(output);
      },
      compress: function(uncompressed) {
        var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, // Compensate for the first entry which should not count
        context_dictSize = 3, context_numBits = 2, context_result = "", context_data_string = "", context_data_val = 0, context_data_position = 0, ii;
        for (ii = 0; ii < uncompressed.length; ii += 1) {
          context_c = uncompressed.charAt(ii);
          if (!context_dictionary.hasOwnProperty(context_c)) {
            context_dictionary[context_c] = context_dictSize++;
            context_dictionaryToCreate[context_c] = true;
          }
          context_wc = context_w + context_c;
          if (context_dictionary.hasOwnProperty(context_wc)) {
            context_w = context_wc;
          } else {
            if (context_dictionaryToCreate.hasOwnProperty(context_w)) {
              if (context_w.charCodeAt(0) < 256) {
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1;
                  if (context_data_position == 15) {
                    context_data_position = 0;
                    context_data_string += String.fromCharCode(context_data_val);
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 8; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == 15) {
                    context_data_position = 0;
                    context_data_string += String.fromCharCode(context_data_val);
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              } else {
                value = 1;
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1 | value;
                  if (context_data_position == 15) {
                    context_data_position = 0;
                    context_data_string += String.fromCharCode(context_data_val);
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = 0;
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 16; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == 15) {
                    context_data_position = 0;
                    context_data_string += String.fromCharCode(context_data_val);
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
            } else {
              value = context_dictionary[context_w];
              for (i = 0; i < context_numBits; i++) {
                context_data_val = context_data_val << 1 | value & 1;
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data_string += String.fromCharCode(context_data_val);
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            // Add wc to the dictionary.
            context_dictionary[context_wc] = context_dictSize++;
            context_w = String(context_c);
          }
        }
        // Output the code for w.
        if (context_w !== "") {
          if (context_dictionaryToCreate.hasOwnProperty(context_w)) {
            if (context_w.charCodeAt(0) < 256) {
              for (i = 0; i < context_numBits; i++) {
                context_data_val = context_data_val << 1;
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data_string += String.fromCharCode(context_data_val);
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 8; i++) {
                context_data_val = context_data_val << 1 | value & 1;
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data_string += String.fromCharCode(context_data_val);
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            } else {
              value = 1;
              for (i = 0; i < context_numBits; i++) {
                context_data_val = context_data_val << 1 | value;
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data_string += String.fromCharCode(context_data_val);
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 16; i++) {
                context_data_val = context_data_val << 1 | value & 1;
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data_string += String.fromCharCode(context_data_val);
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (i = 0; i < context_numBits; i++) {
              context_data_val = context_data_val << 1 | value & 1;
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data_string += String.fromCharCode(context_data_val);
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
        }
        // Mark the end of the stream
        value = 2;
        for (i = 0; i < context_numBits; i++) {
          context_data_val = context_data_val << 1 | value & 1;
          if (context_data_position == 15) {
            context_data_position = 0;
            context_data_string += String.fromCharCode(context_data_val);
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
        // Flush the last char
        while (true) {
          context_data_val = context_data_val << 1;
          if (context_data_position == 15) {
            context_data_string += String.fromCharCode(context_data_val);
            break;
          } else context_data_position++;
        }
        return context_data_string;
      },
      decompress: function(compressed) {
        var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = "", i, w, bits, resb, maxpower, power, c, errorCount = 0, literal, data = {
          string: compressed,
          val: compressed.charCodeAt(0),
          position: 32768,
          index: 1
        };
        for (i = 0; i < 3; i += 1) {
          dictionary[i] = i;
        }
        bits = 0;
        maxpower = Math.pow(2, 2);
        power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = 32768;
            data.val = data.string.charCodeAt(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        switch (next = bits) {
         case 0:
          bits = 0;
          maxpower = Math.pow(2, 8);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          c = String.fromCharCode(bits);
          break;

         case 1:
          bits = 0;
          maxpower = Math.pow(2, 16);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          c = String.fromCharCode(bits);
          break;

         case 2:
          return "";
        }
        dictionary[3] = c;
        w = result = c;
        while (true) {
          bits = 0;
          maxpower = Math.pow(2, numBits);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          switch (c = bits) {
           case 0:
            if (errorCount++ > 1e4) return "Error";
            bits = 0;
            maxpower = Math.pow(2, 8);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = 32768;
                data.val = data.string.charCodeAt(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = String.fromCharCode(bits);
            c = dictSize - 1;
            enlargeIn--;
            break;

           case 1:
            bits = 0;
            maxpower = Math.pow(2, 16);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = 32768;
                data.val = data.string.charCodeAt(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = String.fromCharCode(bits);
            c = dictSize - 1;
            enlargeIn--;
            break;

           case 2:
            return result;
          }
          if (enlargeIn == 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }
          if (dictionary[c]) {
            entry = dictionary[c];
          } else {
            if (c === dictSize) {
              entry = w + w.charAt(0);
            } else {
              return null;
            }
          }
          result += entry;
          // Add w+entry[0] to the dictionary.
          dictionary[dictSize++] = w + entry.charAt(0);
          enlargeIn--;
          w = entry;
          if (enlargeIn == 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }
        }
        return result;
      }
    };
    module.exports = LZString;
  })
  require.register("notebutton", function(exports, require, module) {
    var $ = require("dollar");
    var NoteButton = function(onUpdate, lifespan) {
      var self = this;
      this.on = false;
      this.element = $().create("li").addClass("note");
      this.element.bind("click", function() {
        self.element.toggleClass("on");
        self.on = !self.on;
        self.element.removeClass("unqueued").removeClass("queued");
        onUpdate();
      });
      return this;
    };
    NoteButton.prototype = {
      resize: function(size) {
        this.size = size;
        this.element.css({
          width: size - 2,
          height: size - 2
        });
        return this;
      },
      move: function(x, y) {
        this.element.css({
          left: x,
          top: y
        });
        return this;
      },
      addClass: function(className) {
        this.element.addClass(className);
        return this;
      },
      removeClass: function(className) {
        this.element.removeClass(className);
        return this;
      },
      toggleClass: function(className) {
        this.element.toggleClass(className);
        return this;
      },
      appendTo: function(el) {
        this.element.appendTo(el);
        return this;
      }
    };
    module.exports.NoteButton = function(onUpdate, lifespan) {
      return new NoteButton(onUpdate, lifespan);
    };
  })
  require.register("monome-synth", function(exports, require, module) {
    var $ = require("dollar");
    var measure = require("measure"), lzw = require("lzw"), events = require("event"), noteButton = require("notebutton").NoteButton, voice = require("voice").Voice, freqs = [ 1244.51, 1108.73, 932.33, 830.61, 740, 622.25, 554.37, 466.16, 415.3, 370, 311.13, 277.18, 233.08, 207.65, 185, 155.56, 138.59, 116.54, 103.83, 92.5 ], ctx, bpm, waveform = require("voice").SINE, mixer;
    var Monome = function(webkitAudioContext, mixer, bpm, tick) {
      var self = this;
      ctx = webkitAudioContext;
      mixer = mixer;
      bpm = bpm;
      this.bpm = bpm;
      this.rows = [];
      this.voices = [];
      window.rows = this.rows;
      this.oscillators = [];
      this.container = $().create("ul").addClass("monome");
      $().getBody().append(this.container);
      for (var i = 0; i < 16; i++) {
        // create an array of rows to hold our columns
        var arr = [];
        this.rows.push(arr);
        // create a new voice, while we're in a 0-15 loop. 
        var v = voice(ctx, mixer);
        v.setBPM(bpm);
        v.frequency(freqs[i + 4]);
        v.waveform(waveform);
        this.voices.push(v);
        var ul = $().create("ul");
        ul.addClass("col");
        for (var j = 0; j < 16; j++) {
          var button = noteButton(function() {
            self.updateCode();
          });
          button.appendTo(ul);
          arr.push(button);
        }
        this.container.append(ul);
      }
      var index = 15;
      var currentCol = 15;
      this.nextTime = ctx.currentTime + bpm;
      tick.add(function(elapsed, stop) {
        var currentTime = ctx.currentTime;
        if (currentTime > self.nextTime) {
          var trigger = self.nextTime - currentTime + .1;
          for (var i = 0; i < 16; i++) {
            self.rows[index % 16][i].removeClass("sweep");
          }
          index++;
          var notesOn = 0;
          for (var i = 0; i < 16; i++) {
            self.rows[index % 16][i].addClass("sweep");
            if (self.rows[index % 16][i].on === true) {
              notesOn++;
            }
          }
          for (var i = 0; i < 16; i++) {
            if (self.rows[index % 16][i].on === true) {
              self.voices[i].gain(Math.cos((1 - 1 / notesOn) * (1 / notesOn) * Math.PI) * .15).play(self.nextTime + .1);
              self.rows[index % 16][i].removeClass("queued");
            }
            if (self.rows[(index + 1) % 16][i].on === true) {
              self.rows[(index + 1) % 16][i].addClass("queued");
            }
          }
          self.nextTime = self.nextTime + bpm;
        }
      });
      return this;
    };
    Monome.prototype = {
      updateCode: function(callback) {
        if (callback) {
          this.sendNewCode = callback;
          return this;
        } else {
          var str = "";
          for (var i = 0; i < 16; i++) {
            for (var j = 0; j < 16; j++) {
              if (this.rows[i][j].on) {
                str += "1";
              } else {
                str += "0";
              }
            }
          }
          if (this.sendNewCode) {
            this.sendNewCode(lzw.compressToBase64(str));
          }
        }
      },
      useCode: function(code) {
        var str = lzw.decompressFromBase64(code);
        var self = this;
        for (var i = 0; i < 16; i++) {
          for (var j = 0; j < 16; j++) {
            self.rows[i][j].on = parseInt(str.substr(j + i * 16, 1), 2) === 1 ? true : false;
            if (self.rows[i][j].on) {
              self.rows[i][j].addClass("on");
            } else {
              self.rows[i][j].removeClass("on");
            }
          }
        }
        return this;
      },
      resize: function(ss) {
        var cubeSize = Math.floor(ss.y / 16);
        for (var i = 0; i < 16; i++) {
          for (var j = 0; j < 16; j++) {
            this.rows[i][j].resize(Math.floor(cubeSize * .9)).move(i * cubeSize, j * cubeSize);
          }
        }
        return this;
      },
      move: function(pos) {
        this.container.css({
          position: "absolute",
          top: pos.y,
          left: pos.x
        });
        return this;
      },
      waveform: function(waveform) {
        for (var i = 0; i < 16; i++) {
          this.voices[i].waveform(waveform);
        }
        return this;
      },
      glide: function() {
        for (var i = 0; i < 16; i++) {
          this.voices[i].toggleGlide();
        }
        return this;
      },
      stop: function() {
        this.voices.forEach(function(voice) {
          voice.stop();
        });
        return this;
      },
      resume: function() {
        this.nextTime = ctx.currentTime + this.bpm;
        return this;
      }
    };
    module.exports.Monome = function(webkitAudioContext, mixer, bpm, tick) {
      return new Monome(webkitAudioContext, mixer, bpm, tick);
    };
  })
  require.register("easing", function(exports, require, module) {
    var Bezier = require("bezier");
    var presets = {
      ease: [ .25, .1, .25, 1 ],
      "ease-in": [ .42, 0, 1, 1 ],
      "ease-out": [ 0, 0, .58, 1 ],
      "ease-in-out": [ .42, 0, .58, 1 ],
      linear: [ 0, 0, 1, 1 ],
      "ease-in-out-back": [ .45, -.42, .595, 1.34 ],
      "ease-out-back": [ .62, 1.255, .665, 1.095 ],
      "ease-in-back": [ .33, -.305, .715, -.155 ],
      "ease-out-expo": [ .015, .745, .225, .985 ],
      "ease-in-expo": [ .775, 0, .975, .075 ],
      "ease-in-cubic": [ .6, .02, .95, .295 ],
      "ease-out-cubic": [ .075, .61, .36, .93 ]
    };
    var Ease = function() {
      return this;
    };
    Ease.prototype = {
      using: function(preset) {
        var self = this, p;
        if (p = presets[preset]) {
          self.curve = Bezier({
            c1: [ 0, 0 ],
            c4: [ 1, 1 ],
            c2: [ p[0], p[1] ],
            c3: [ p[2], p[3] ]
          }).buildLookup();
          return function(time) {
            return self.curve.findYAtX(time);
          };
        } else {
          throw new Error("No such preset!");
        }
      },
      usingCustomCurve: function(curve) {
        var self = this;
        self.curve = Bezier(curve);
        return function(time) {
          return self.curve.yAtTime(time);
        };
      },
      usingCSS3Curve: function(c2x, c2y, c3x, c3y) {
        var self = this;
        self.curve = Bezier({
          c1: [ 0, 0 ],
          c2: [ c2x, c2y ],
          c3: [ c3x, c3y ],
          c4: [ 1, 1 ]
        }).buildLookup();
        return function(time) {
          return self.curve.findYAtX(time);
        };
      }
    };
    module.exports.Ease = function() {
      return new Ease();
    };
    module.exports.isPreset = function(val) {
      return !!typeof presets[val] !== "undefined";
    };
    module.exports.presets = function() {
      var result = [];
      for (var i in presets) {
        if (presets.hasOwnProperty(i)) {
          result.push(i);
        }
      }
      return result;
    }();
  })
  require.register("is", function(exports, require, module) {
    "use strict";
    var each = require("each"), toString = Object.prototype.toString, types = [ "Arguments", "Function", "String", "Number", "Date", "RegExp", "Array" ];
    each(types, function(type) {
      module.exports[type.toLowerCase()] = function(obj) {
        return toString.call(obj) === "[object " + type + "]";
      };
    });
    if (Array.isArray) {
      module.exports.array = Array.isArray;
    }
    module.exports.object = function(obj) {
      return obj === Object(obj);
    };
  })
  require.register("parse-duration", function(exports, require, module) {
    var is = require("is");
    var parseTime = function(time) {
      if (is.number(time)) {
        return time;
      } else if (is.string(time)) {
        var match;
        match = time.match(/([0-9]+)s/);
        if (match && match[1]) {
          return parseInt(match[1], 10) * 1e3;
        }
        match = time.match(/([0-9]+)ms/);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
        match = time.match(/([0-9]+)m/);
        if (match && match[1]) {
          return parseInt(match[1], 10) * 1e3 * 60;
        }
        match = time.match(/([0-9]+)h/);
        if (match && match[1]) {
          return parseInt(match[1], 10) * 1e3 * 60 * 60;
        }
        match = time.match(/([0-9]+)d/);
        if (match && match[1]) {
          return parseInt(match[1], 10) * 1e3 * 60 * 60 * 24;
        }
        match = time.match(/([0-9]+)w/);
        if (match && match[1]) {
          return parseInt(match[1], 10) * 1e3 * 60 * 60 * 24 * 7;
        }
        return 0;
      } else {
        throw new Error("Invalid duration");
      }
    };
    module.exports = function(duration) {
      return parseTime(duration);
    };
  })
  require.register("color-parser", function(exports, require, module) {
    /**
 * Module dependencies.
 */
    /**
 * Expose `parse`.
 */
    module.exports = parse;
    /**
 * Parse `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */
    function parse(str) {
      return hex3(str) || hex6(str) || rgb(str) || rgba(str);
    }
    /**
 * Parse rgb(n, n, n)
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */
    function rgb(str) {
      if (0 == str.indexOf("rgb(")) {
        str = str.match(/rgb\(([^)]+)\)/)[1];
        var parts = str.split(/ *, */).map(Number);
        return {
          r: parts[0],
          g: parts[1],
          b: parts[2],
          a: 1
        };
      }
    }
    /**
 * Parse rgba(n, n, n, n)
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */
    function rgba(str) {
      if (0 == str.indexOf("rgba(")) {
        str = str.match(/rgba\(([^)]+)\)/)[1];
        var parts = str.split(/ *, */).map(Number);
        return {
          r: parts[0],
          g: parts[1],
          b: parts[2],
          a: parts[3]
        };
      }
    }
    /**
 * Parse #nnnnnn
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */
    function hex6(str) {
      if ("#" == str[0] && 7 == str.length) {
        return {
          r: parseInt(str.slice(1, 3), 16),
          g: parseInt(str.slice(3, 5), 16),
          b: parseInt(str.slice(5, 7), 16),
          a: 1
        };
      }
    }
    /**
 * Parse #nnn
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */
    function hex3(str) {
      if ("#" == str[0] && 4 == str.length) {
        return {
          r: parseInt(str[1] + str[1], 16),
          g: parseInt(str[2] + str[2], 16),
          b: parseInt(str[3] + str[3], 16),
          a: 1
        };
      }
    }
  })
  require.register("binary-search", function(exports, require, module) {
    module.exports = function(arr, target) {
      var search = function search(low, high) {
        if (low > high) {
          return [ high, false ];
        }
        if (arr[low] === target) {
          return [ low, true ];
        } else if (arr[high] === target) {
          return [ high, true ];
        }
        var middle = Math.floor((low + high) / 2);
        var el = arr[middle];
        if (el > target) {
          return search(low + 1, middle);
        } else if (el < target) {
          return search(middle, high - 1);
        }
        return [ middle, true ];
      };
      return search(0, arr.length - 1);
    };
  })
  require.register("bezier", function(exports, require, module) {
    var search = require("binary-search");
    var getLinearPoint = function(t, i) {
      var _t = 1 - t;
      return _t * this._c1[i] + t * this._c2[i];
    };
    var getQuadraticPoint = function(t, i) {
      var _t = 1 - t;
      return this._c1[i] * (_t * _t) + this._c2[i] * (2 * _t * t) + this._c3[i] * (t * t);
    };
    var getCubicPoint = function(t, i) {
      var _t = 1 - t;
      return this._c1[i] * (_t * _t * _t) + this._c2[i] * (3 * _t * _t * t) + this._c3[i] * (3 * _t * (t * t)) + this._c4[i] * (t * t * t);
    };
    var BezierCurve = function(config) {
      var self = this;
      if (!config) {
        var config = {};
      }
      this._c1 = config.c1 || [ 0, 0 ];
      this._c2 = config.c2 || [ 0, 0 ];
      this._c3 = config.c3 || [ 0, 0 ];
      this._c4 = config.c4 || [ 0, 0 ];
      this.isCubic();
      return this;
    };
    var checkCoord = function(o) {
      if (typeof o.top !== "undefined" && typeof o.left !== "undefined") {
        return [ o.left, o.top ];
      } else if (typeof o.x !== "undefined" && typeof o.y !== "undefined") {
        return [ o.x, o.y ];
      } else if (typeof o[0] === "number" && typeof o[1] === "number") {
        return o;
      } else {
        throw new Error("Input unacceptable");
      }
    };
    BezierCurve.prototype = {
      c1: function(coord) {
        this._c1 = checkCoord(coord);
        return this;
      },
      c2: function(coord) {
        this._c2 = checkCoord(coord);
        return this;
      },
      c3: function(coord) {
        this._c3 = checkCoord(coord);
        return this;
      },
      c4: function(coord) {
        this._c4 = checkCoord(coord);
        return this;
      },
      isLinear: function() {
        var self = this;
        this.b = function(t, i) {
          return getLinearPoint.call(self, t, i);
        };
        return this;
      },
      isQuadratic: function() {
        var self = this;
        this.b = function(t, i) {
          return getQuadraticPoint.call(self, t, i);
        };
        return this;
      },
      isCubic: function() {
        var self = this;
        this.b = function(t, i) {
          return getCubicPoint.call(self, t, i);
        };
        return this;
      },
      point: function(n) {
        var self = this;
        return {
          x: self.b(n, 0),
          y: self.b(n, 1)
        };
      },
      pointCss: function(n) {
        var self = this;
        return {
          left: self.b(n, 0),
          top: self.b(n, 1)
        };
      },
      renderToCanvas: function(context) {
        context.beginPath();
        context.moveTo(this._c1[0], this._c1[1]);
        context.bezierCurveTo(this._c2[0], this._c2[1], this._c3[0], this._c3[1], this._c4[0], this._c4[1]);
        context.stroke();
      },
      pointArray: function(n) {
        return [ this.b(n, 0), this.b(n, 1) ];
      },
      xAtTime: function(n) {
        return this.b(n, 0);
      },
      yAtTime: function(n) {
        return this.b(n, 1);
      },
      buildLookup: function(samples) {
        var x = this._x = [];
        var y = this._y = [];
        var t;
        var size = samples || 1e4;
        for (var i = 0; i < size; i++) {
          t = i / size;
          x.push(this.xAtTime(t));
          y.push(this.yAtTime(t));
        }
        return this;
      },
      findYAtX: function(target) {
        if (target === 1) {
          return this.yAtTime(1);
        } else if (target === 0) {
          return this.yAtTime(0);
        } else {
          return this._y[search(this._x, target)[0]];
        }
      },
      query: function() {
        return {
          c1: this._c1,
          c2: this._c2,
          c3: this._c3,
          c4: this._c4
        };
      }
    };
    module.exports = function(c1, c2, c3, c4) {
      return new BezierCurve(c1, c2, c3, c4);
    };
  })
  require.register("tween", function(exports, require, module) {
    var easing = require("easing").Ease, Bezier = require("bezier"), is = require("is"), each = require("each"), colorParse = require("color-parser"), parseDuration = require("parse-duration"), tick = require("tick");
    var processStates = function(states) {
      if (is.object(states)) {
        return states;
      } else if (is.string(states)) {
        var rgb = colorParse(states);
        if (rgb) {
          return rgb;
        } else {
          throw new Error("Invalid string input!");
        }
      } else if (is.number(states)) {
        return {
          tween: states
        };
      }
      // worst case scenario..
      return {
        tween: 0
      };
    };
    var buildPaths = function() {
      if (this._pathMode === "linear") {
        each(this.tweens, function(tween) {
          tween.path = Bezier().c1([ 0, tween.start ]).c2([ 0, tween.end ]).isLinear();
        });
      }
      return true;
    };
    var Tween = function(startStates) {
      this.tweens = {};
      this._duration = 1e3;
      this._easer = easing().using("linear");
      this._pathMode = "linear";
      this.callbacks = {
        tick: function() {},
        begin: function() {},
        finish: function() {}
      };
      this.from(startStates);
      return this;
    };
    Tween.prototype = {
      from: function(startStates) {
        var self = this, states = processStates(startStates);
        each(states, function(value, key) {
          self.tweens[key] = {
            start: value,
            end: 0
          };
        });
        buildPaths.call(this);
        return this;
      },
      to: function(endStates) {
        var self = this, states = processStates(endStates);
        each(states, function(value, key) {
          if (self.tweens[key]) {
            self.tweens[key].end = value;
          } else {
            self.tweens[key] = {
              start: 0,
              end: value
            };
          }
        });
        buildPaths.call(this);
        return this;
      },
      using: function(config) {
        var self = this;
        if (is.string(config)) {
          if (require("easing").isPreset(config)) {
            // forward and back
            self._easer = easing().using(config);
          } else {
            throw new Error("Invalid easing");
          }
        } else if (is.array(config) && config.length === 4) {
          var temp = easing();
          self._easer = temp.usingCSS3Curve.apply(temp, config);
        } else if (is.object(config) && is.array(config.c1) && is.array(config.c2) && is.array(config.c3) && is.array(config.c4)) {
          self._easer = easing().usingCustomCurve(config);
        } else {
          throw new Error("Invalid easing");
        }
        return this;
      },
      duration: function(time) {
        if (time) {
          this._duration = parseDuration(time);
        }
        return this;
      },
      // callback helpers
      tick: function(callback) {
        this.callbacks.tick = callback;
        return this;
      },
      begin: function(callback) {
        this.callbacks.begin = callback;
        return this;
      },
      finish: function(callback) {
        this.callbacks.finish = callback;
        return this;
      },
      query: function() {
        return {
          easer: this._easer,
          duration: this._duration,
          tweens: this.tweens
        };
      },
      // debug method
      valueAtTime: function(time, reverse) {
        var result = {};
        var val = this._easer(time);
        if (this.tweens) {
          each(this.tweens, function(tween, id) {
            result[id] = tween.path.yAtTime(val);
          });
        }
        return result;
      },
      play: function() {
        var self = this;
        self.stopped = false;
        self.handle = tick.add(function(elapsed, stop) {
          var percent = Math.min(1, elapsed / self._duration);
          if (!self.stopped) {
            self.callbacks.tick(self.valueAtTime(percent));
          }
          if (percent === 1) {
            stop();
            self.callbacks.finish(tick.now());
          }
        });
        self.callbacks.begin(tick.now());
        return this;
      },
      stop: function() {
        var self = this;
        self.stopped = true;
        if (self.handle) {
          self.handle.stop();
        }
        return this;
      }
    };
    module.exports.Tweening = function(config) {
      return new Tween(config);
    };
  })
  require.register("voice", function(exports, require, module) {
    var ctx;
    var Voice = function(webAudioContext, mixer) {
      var self = this;
      ctx = webAudioContext;
      //this.frequency = frequency;
      this.bpm = .5;
      // create our notes
      this.filter = ctx.createBiquadFilter();
      // low pass filter for getting rid of errant harmonics.
      this.masterVolume = ctx.createGain();
      // master volume is set based on the number of sounds to be played this step
      this.envelope = ctx.createGain();
      // envelope filter for playing notes
      this.osc = ctx.createOscillator();
      // our oscillator. Probably shouldn't be making lots of these.
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
      this.filter.Q.value = .5;
      this.rampUpTimeout = -1;
      this.rampDownTimeout = -1;
      this.doGlide = false;
      // start the oscillator
      this.osc.start(ctx.currentTime);
      return this;
    };
    Voice.prototype = {
      play: function(startTime) {
        var bpm = this.bpm;
        clearTimeout(this.rampDownTimeout);
        clearTimeout(this.rampUpTimeout);
        if (this.rampUp && this.rampDown) {
          this.rampDown.stop();
          this.rampUp.stop();
        }
        var updateEnvelope = function(o) {
          self.envelope.gain.value = o.value;
        };
        var self = this, start = Math.floor(startTime - ctx.currentTime) * 1e3;
        var updateEnvelope = function(o) {
          self.envelope.gain.value = o.value;
        };
        this.rampUp = require("tween").Tweening({
          value: this.envelope.gain.value
        }).to({
          value: 1
        }).using("ease-in").duration(Math.round(bpm * 1e3 / 2)).tick(updateEnvelope);
        //.begin(function(){self.osc.type = self.osc.SINE}).finish(function(){ self.osc.type = self.osc.SINE});
        this.rampDown = require("tween").Tweening({
          value: 1
        }).to({
          value: 0
        }).using("ease-out").duration(Math.round(bpm * 1e3 * 2)).tick(updateEnvelope);
        // .begin(function(){self.osc.type = self.osc.SINE});
        if (this.doGlide) {
          this.glide = require("tween").Tweening({
            value: -600
          }).to({
            value: 0
          }).using("linear").duration(Math.round(bpm * 1e3 / 20)).tick(function(o) {
            self.osc.detune.value = o.value;
          });
        }
        this.rampUpTimeout = setTimeout(function() {
          self.rampUp.play();
          if (self.doGlide) {
            self.glide.play();
          }
        }, start);
        this.rampDownTimeout = setTimeout(function() {
          self.rampDown.play();
        }, start + Math.round(bpm * 1e3));
        return this;
      },
      gain: function(gain) {
        this.masterVolume.gain.value = gain;
        return this;
      },
      stop: function() {
        if (this.rampUp && this.rampDown) {
          this.rampUp.stop();
          this.rampDown.stop();
          clearTimeout(this.rampDownTimeout);
          clearTimeout(this.rampUpTimeout);
        }
        this.envelope.gain.value = 0;
        this.rampUpTimeout = -1;
        this.rampDownTimeout = -1;
      },
      square: function() {
        this.osc.type = this.osc.SQUARE;
        return this;
      },
      triangle: function() {
        this.osc.type = this.osc.TRIANGLE;
        return this;
      },
      ramp: function() {
        this.osc.type = this.osc.SAWTOOTH;
        return this;
      },
      sine: function() {
        this.osc.type = this.osc.SINE;
        return this;
      },
      waveform: function(waveform) {
        this.osc.type = waveform;
        return this;
      },
      frequency: function(frequency) {
        this.osc.frequency.value = frequency;
        this.filter.frequency.value = frequency * 2;
        return this;
      },
      setBPM: function(beatsPerMinute) {
        this.bpm = beatsPerMinute;
        return this;
      },
      toggleGlide: function() {
        this.doGlide = true;
        return this;
      }
    };
    module.exports.Voice = function(frequency, waveform) {
      return new Voice(frequency, waveform);
    };
    module.exports.SINE = 0;
    module.exports.SQUARE = 1;
    module.exports.SAWTOOTH = 2;
    module.exports.TRIANGLE = 3;
  })
  require.register("monome", function(exports, require, module) {
    var ctx = new webkitAudioContext(), bpm = .2, ref = ctx.createOscillator(), waveform = require("voice").SINE, mixerA = ctx.createChannelMerger(16), mixerB = ctx.createChannelMerger(16), pageVis = require("page-visibility"), tick = require("tick");
    var gainA = ctx.createGain();
    var gainB = ctx.createGain();
    var hashchange = require("hashchange");
    gainA.gain.value = 1;
    //Math.cos(0.5 * 0.5* Math.PI);
    gainB.gain.value = 1;
    //Math.cos((1.0 - 0.5) * 0.5* Math.PI);
    ref.connect(ctx.destination);
    mixerA.connect(gainA);
    mixerB.connect(gainB);
    gainA.connect(ctx.destination);
    gainB.connect(ctx.destination);
    var codeA = "Aw18ZXTt/DFOS1b0dEA=";
    var codeB = "Aw18ZXTt/DFOS1b0dEA=";
    var events = require("event");
    var measure = require("measure");
    var template = function(str, obj) {
      var candidates = str.match(/<%=([A-Za-z0-9\-\_\.]+)%>/g);
      candidates.forEach(function(match) {
        var name = match.replace(/<%=/, "");
        name = name.replace(/%>/, "");
        if (obj[name]) {
          str = str.replace(match, obj[name]);
        }
      });
      return str;
    };
    var css = {
      "ul.monome.a li.note": "-webkit-transition: -webkit-transform 0ms, background <%=sweep%>ms!important",
      "ul.monome.a li.note.queued": "-webkit-transition: -webkit-transform <%=lifespan%>ms, box-shadow <%=lifespan%>ms",
      "ul.monome.a li.note.sweep.on": "-webkit-transition: -webkit-transform <%=lifespan%>ms!important",
      "ul.monome.b li.note.sweep.on": "-webkit-transition: -webkit-transform <%=lifespanB%>ms!important",
      //"ul.monome.b li.note" : "-webkit-transition: -webkit-transform 0ms;!important",
      "ul.monome.b li.note.queued": "-webkit-transition: -webkit-transform <%=lifespanB%>ms, box-shadow <%=lifespan%>ms",
      "ul.monome.a li.note.on": "-webkit-transition: background <%=lifespan%>ms, box-shadow <%=lifespan%>ms!important",
      "ul.monome.b li.note.on": "-webkit-transition: background <%=lifespanB%>ms, box-shadow <%=lifespanB%>ms!important",
      "ul.monome.b li.note": "-webkit-transition: -webkit-transform 0ms, background <%=sweep%>ms!important"
    };
    var data = {
      lifespan: bpm * 1e3 * .7,
      sweep: bpm * 1e3 * 2,
      glow: bpm * 1e3 / 2,
      lifespanB: bpm * 8 * 1e3 * .7,
      sweepB: bpm * 8 * 1e3 * 2,
      glowB: bpm * 8 * 1e3 / 2
    };
    var sheet = document.styleSheets[document.styleSheets.length - 1];
    for (var rule in css) {
      if (css.hasOwnProperty(rule)) {
        sheet.insertRule(rule + "{" + template(css[rule], data) + "}", sheet.cssRules.length);
      }
    }
    var monomeA = require("monome-synth").Monome(ctx, mixerA, bpm, tick).glide().updateCode(function(code) {
      codeA = code;
      hashchange.updateHash("!song=" + codeA + ":" + codeB);
    });
    var monomeB = require("monome-synth").Monome(ctx, mixerB, bpm * 4, tick).waveform(ref.SAWTOOTH).updateCode(function(code) {
      codeB = code;
      hashchange.updateHash("!song=" + codeA + ":" + codeB);
    });
    monomeA.container.addClass("a");
    monomeB.container.addClass("b");
    var resize = function() {
      var ss = measure().screenSize();
      var width = Math.min(ss.x * .8 / 2, ss.y * .8);
      monomeA.resize({
        x: width,
        y: width
      }).move({
        x: ss.x * .05,
        y: ss.y * .1
      });
      monomeB.resize({
        x: width,
        y: width
      }).move({
        x: ss.x / 2 + ss.x * .05,
        y: ss.y * .1
      });
    };
    events.bind(window, "resize", resize);
    resize();
    hashchange.update(function(frag) {
      if (frag !== "" && frag.match(/!song\=/)) {
        var str = frag.replace("!song=", "");
        var bits = str.split(":");
        if (bits.length === 1) {
          codeA = bits[0];
          codeB = bits[0];
        } else {
          codeA = bits[0];
          codeB = bits[1];
        }
        monomeA.useCode(codeA);
        monomeB.useCode(codeB);
      }
    }).update();
    pageVis.onHidden(function() {
      tick.pause();
      monomeA.stop();
      monomeB.stop();
    });
    pageVis.onVisible(function() {
      tick.resume();
      monomeA.resume();
      monomeB.resume();
    });
  })
    require("monome");
})();