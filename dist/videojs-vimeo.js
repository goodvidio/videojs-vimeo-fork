(function (root, factory) {
  if(typeof define === 'function' && define.amd) {
    define([
        'videojs', 'vimeo'
    ], function (_video, _player) {
        return (root.Youtube = factory(_video, _player));
    });
  }
}(this, function(_video, _player) {
  'use strict';

  var _video2 = _interopRequireDefault(_video);

  var _player2 = _interopRequireDefault(_player);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var Component = _video2.default.getComponent('Component');
  var Tech = _video2.default.getComponent('Tech');
  var cssInjected = false;
  var _isOnMobile = _video2.default.browser.IS_IOS || _video2.default.browser.IS_ANDROID;

  // Since the iframe can't be touched using Vimeo's way of embedding,
  // let's add a new styling rule to have the same style as `vjs-tech`
  function injectCss() {
    if (cssInjected) {
      return;
    }
    cssInjected = true;
    var css = '\n    .vjs-vimeo iframe {\n      position: absolute;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n    }\n  ';
    var head = document.head || document.getElementsByTagName('head')[0];

    var style = document.createElement('style');

    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  }

  /**
   * Vimeo - Wrapper for Video Player API
   *
   * @param {Object=} options Object of option names and values
   * @param {Function=} ready Ready callback function
   * @extends Tech
   * @class Vimeo
   */

  var Vimeo = function (_Tech) {
    _inherits(Vimeo, _Tech);

    function Vimeo(options, ready) {
      _classCallCheck(this, Vimeo);

      var _this = _possibleConstructorReturn(this, (Vimeo.__proto__ || Object.getPrototypeOf(Vimeo)).call(this, options, ready));

      injectCss();
      _this.setPoster(options.poster);
      _this.initVimeoPlayer();
      return _this;
    }

    _createClass(Vimeo, [{
      key: 'initVimeoPlayer',
      value: function initVimeoPlayer() {
        var _this2 = this;

        var vimeoOptions = {
          url: this.options_.source.src,
          byline: false,
          portrait: false,
          title: false
        };

        if (this.options_.autoplay) {
          vimeoOptions.autoplay = true;
        }
        if (this.options_.height) {
          vimeoOptions.height = this.options_.height;
        }
        if (this.options_.width) {
          vimeoOptions.width = this.options_.width;
        }
        if (this.options_.maxheight) {
          vimeoOptions.maxheight = this.options_.maxheight;
        }
        if (this.options_.maxwidth) {
          vimeoOptions.maxwidth = this.options_.maxwidth;
        }
        if (this.options_.loop) {
          vimeoOptions.loop = this.options_.loop;
        }
        if (this.options_.color) {
          // vimeo is the only API on earth to reject hex color with leading #
          vimeoOptions.color = this.options_.color.replace(/^#/, '');
        }

        this._player = new _player2.default(this.el(), vimeoOptions);
        this.initVimeoState();

        ['play', 'pause', 'ended', 'timeupdate', 'progress', 'seeked'].forEach(function (e) {
          _this2._player.on(e, function (progress) {

            if (_this2._vimeoState.ended) {
              if (e === 'pause' || e === 'progress') {
                return;
              }
            }

            if (_this2._vimeoState.progress.duration !== progress.duration) {
              _this2.trigger('durationchange');
            }
            _this2._vimeoState.progress = progress;
            _this2.trigger(e);
          });
        });

        this._player.on('pause', function () {
          return _this2._vimeoState.playing = false;
        });
        this._player.on('play', function () {
          _this2._vimeoState.playing = true;
          _this2._vimeoState.ended = false;
        });
        this._player.on('ended', function () {
          _this2._vimeoState.playing = false;
          _this2._vimeoState.ended = true;
        });
        this._player.on('volumechange', function (v) {
          return _this2._vimeoState.volume = v;
        });
        this._player.on('error', function (e) {
          return _this2.trigger('error', e);
        });

        this.triggerReady();
      }
    }, {
      key: 'initVimeoState',
      value: function initVimeoState() {
        var state = this._vimeoState = {
          activeVideoId: this.url ? this.url.videoId : null,
          ended: false,
          playing: false,
          volume: 0,
          progress: {
            seconds: 0,
            percent: 0,
            duration: 0
          }
        };

        this._player.getCurrentTime().then(function (time) {
          return state.progress.seconds = time;
        });
        this._player.getDuration().then(function (time) {
          return state.progress.duration = time;
        });
        this._player.getPaused().then(function (paused) {
          return state.playing = !paused;
        });
        this._player.getVolume().then(function (volume) {
          return state.volume = volume;
        });
      }
    }, {
      key: 'createEl',
      value: function createEl() {
        var div = _video2.default.createEl('div', {
          id: this.options_.techId
        });

        div.style.cssText = 'width:100%;height:100%;top:0;left:0;position:absolute';
        div.className = 'vjs-vimeo';

        return div;
      }
    }, {
      key: 'controls',
      value: function controls() {
        // Vimeo doesn't provide a way to hide it's player's controls
        return true;
      }
    }, {
      key: 'supportsFullScreen',
      value: function supportsFullScreen() {
        return true;
      }
    }, {
      key: 'src',
      value: function src(_src) {
        if (_src) {
          this.setSrc({ src: _src });
        }

        return this.source;
      }
    }, {
      key: 'currentSrc',
      value: function currentSrc() {
        return this.options_.source.src;
      }
    }, {
      key: 'currentTime',
      value: function currentTime() {
        return this._vimeoState.progress.seconds;
      }
    }, {
      key: 'setCurrentTime',
      value: function setCurrentTime(time) {
        this._player.setCurrentTime(time);
      }
    }, {
      key: 'volume',
      value: function volume() {
        return this._vimeoState.volume;
      }
    }, {
      key: 'setVolume',
      value: function setVolume(volume) {
        return this._player.setVolume(volume);
      }
    }, {
      key: 'setSrc',
      value: function setSrc(source) {
        var _this3 = this;

        if (!source || !source.src) {
          return;
        }

        delete this.errorNumber;
        this.source = source;
        this.url = {
          videoId: source.src.replace('https://vimeo.com/', '')
        };

        if (this.options_.autoplay && !_isOnMobile) {
          if (this.isReady_) {
            this.play();
          } else {
            this.playOnReady = true;
          }
        } else if (this._vimeoState.activeVideoId !== this.url.videoId) {
          if (this.isReady_) {
            this._player.loadVideo(this.url.videoId).then(function () {
              _this3._player.play();
              _this3._vimeoState.activeVideoId = _this3.url.videoId;
            });
          }
        }
      }
    }, {
      key: 'duration',
      value: function duration() {
        return this._vimeoState.progress.duration;
      }
    }, {
      key: 'buffered',
      value: function buffered() {
        var progress = this._vimeoState.progress;

        return _video2.default.createTimeRange(0, progress.percent * progress.duration);
      }
    }, {
      key: 'paused',
      value: function paused() {
        return !this._vimeoState.playing;
      }
    }, {
      key: 'pause',
      value: function pause() {
        this._player.pause();
      }
    }, {
      key: 'play',
      value: function play() {
        if (!this.url || !this.url.videoId) {
          return;
        }

        if (this.isReady_) {
          if (this._vimeoState.activeVideoId === this.url.videoId) {
            this._player.play();
          } else {
            this._player.loadVideo(this.url.videoId).then(function () {
              this._vimeoState.activeVideoId = this.url.videoId;
              this._player.play();
            }.bind(this));
          }
        } else {
          this.trigger('waiting');
          this.playOnReady = true;
        }
      }
    }, {
      key: 'muted',
      value: function muted() {
        return this._vimeoState.volume === 0;
      }
    }, {
      key: 'ended',
      value: function ended() {
        return this._vimeoState.ended;
      }
    }]);

    return Vimeo;
  }(Tech);

  Vimeo.prototype.featuresTimeupdateEvents = true;

  Vimeo.isSupported = function () {
    return true;
  };

  // Add Source Handler pattern functions to this tech
  Tech.withSourceHandlers(Vimeo);

  Vimeo.nativeSourceHandler = {};

  /**
   * Check if Vimeo can play the given videotype
   * @param  {String} type    The mimetype to check
   * @return {String}         'maybe', or '' (empty string)
   */
  Vimeo.nativeSourceHandler.canPlayType = function (source) {
    if (source === 'video/vimeo') {
      return 'maybe';
    }

    return '';
  };

  /*
   * Check Vimeo can handle the source natively
   *
   * @param  {Object} source  The source object
   * @return {String}         'maybe', or '' (empty string)
   * @note: Copied over from YouTube — not sure this is relevant
   */
  Vimeo.nativeSourceHandler.canHandleSource = function (source) {
    if (source.type) {
      return Vimeo.nativeSourceHandler.canPlayType(source.type);
    } else if (source.src) {
      return Vimeo.nativeSourceHandler.canPlayType(source.src);
    }

    return '';
  };

  // @note: Copied over from YouTube — not sure this is relevant
  Vimeo.nativeSourceHandler.handleSource = function (source, tech) {
    tech.src(source.src);
  };

  // @note: Copied over from YouTube — not sure this is relevant
  Vimeo.nativeSourceHandler.dispose = function () {
    this._player.unload();

    this.el_.parentNode.className = this.el_.parentNode.className.replace(' vjs-vimeo', '');
    this.el_.parentNode.removeChild(this.el_);

    Tech.prototype.dispose.call(this);
  };

  Vimeo.registerSourceHandler(Vimeo.nativeSourceHandler);

  Component.registerComponent('Vimeo', Vimeo);
  Tech.registerTech('Vimeo', Vimeo);

  // Include the version number.
  Vimeo.VERSION = '0.0.1';

  return Vimeo;
}));