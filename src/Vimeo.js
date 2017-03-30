import videojs from 'video.js';
import VimeoPlayer from '@vimeo/player';

const Component = videojs.getComponent('Component');
const Tech = videojs.getComponent('Tech');
let cssInjected = false;
var _isOnMobile = videojs.browser.IS_IOS || videojs.browser.IS_ANDROID;

// Since the iframe can't be touched using Vimeo's way of embedding,
// let's add a new styling rule to have the same style as `vjs-tech`
function injectCss() {
  if (cssInjected) {
    return;
  }
  cssInjected = true;
  const css = `
    .vjs-vimeo iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  `;
  const head = document.head || document.getElementsByTagName('head')[0];

  const style = document.createElement('style');

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
class Vimeo extends Tech {
  constructor(options, ready) {
    super(options, ready);

    injectCss();
    this.setPoster(options.poster);
    this.initVimeoPlayer();
  }

  initVimeoPlayer() {
    const vimeoOptions = {
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

    this._player = new VimeoPlayer(this.el(), vimeoOptions);
    this.initVimeoState();

    ['play', 'pause', 'ended', 'timeupdate', 'progress', 'seeked'].forEach(e => {
      this._player.on(e, (progress) => {

        if (this._vimeoState.ended) {
          if (e === 'pause' || e === 'progress') {
            return;
          }
        }

        if (this._vimeoState.progress.duration !== progress.duration) {
          this.trigger('durationchange');
        }
        this._vimeoState.progress = progress;
        this.trigger(e);
      });
    });

    this._player.on('pause', () => this._vimeoState.playing = false);
    this._player.on('play', () => {
      this._vimeoState.playing = true;
      this._vimeoState.ended = false;
    });
    this._player.on('ended', () => {
      this._vimeoState.playing = false;
      this._vimeoState.ended = true;
    });
    this._player.on('volumechange', (v) => this._vimeoState.volume = v);
    this._player.on('error', e => {
      this.trigger('error', e);
      console.log(e);
    });

    this.triggerReady();
  }

  initVimeoState() {
    const state = this._vimeoState = {
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

    this._player.getCurrentTime().then(time => state.progress.seconds = time);
    this._player.getDuration().then(time => state.progress.duration = time);
    this._player.getPaused().then(paused => state.playing = !paused);
    this._player.getVolume().then(volume => state.volume = volume);
  }

  createEl() {
    const div = videojs.createEl('div', {
      id: this.options_.techId
    });

    div.style.cssText = 'width:100%;height:100%;top:0;left:0;position:absolute';
    div.className = 'vjs-vimeo';

    return div;
  }

  controls() {
    // Vimeo doesn't provide a way to hide it's player's controls
    return true;
  }

  supportsFullScreen() {
    return true;
  }

  src(src) {
    if (src) {
      this.setSrc({src});
    }

    return this.source;
  }

  currentSrc() {
    return this.options_.source.src;
  }

  currentTime() {
    return this._vimeoState.progress.seconds;
  }

  setCurrentTime(time) {
    this._player.setCurrentTime(time);
  }

  volume() {
    return this._vimeoState.volume;
  }

  setVolume(volume) {
    return this._player.setVolume(volume);
  }

  setSrc(source) {
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
        this._player
          .loadVideo(this.url.videoId)
          .then(() => {
            this._player.play();
            this._vimeoState.activeVideoId = this.url.videoId;
          })
          .catch(e => console.log(e));
      }
    }
  }

  duration() {
    return this._vimeoState.progress.duration;
  }

  buffered() {
    const progress = this._vimeoState.progress;

    return videojs.createTimeRange(0, progress.percent * progress.duration);
  }

  paused() {
    return !this._vimeoState.playing;
  }

  pause() {
    this._player.pause();
  }

  play() {
    if (!this.url || !this.url.videoId) {
      return;
    }

    if (this.isReady_) {
      if (this._vimeoState.activeVideoId === this.url.videoId) {
        this._player.play();
      } else {
        this._player
          .loadVideo(this.url.videoId)
          .then(function () {
            this._vimeoState.activeVideoId = this.url.videoId;
            this._player.play();
          }.bind(this))
          .catch(e => console.log(e));
      }
    } else {
      this.trigger('waiting');
      this.playOnReady = true;
    }
  }

  muted() {
    return this._vimeoState.volume === 0;
  }

  ended() {
    return this._vimeoState.ended;
  }

  // Vimeo does has a mute API and native controls aren't being used,
  // so setMuted doesn't really make sense and shouldn't be called.
  // setMuted(mute) {}
}

Vimeo.prototype.featuresTimeupdateEvents = true;

Vimeo.isSupported = function() {
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
Vimeo.nativeSourceHandler.canPlayType = function(source) {
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
Vimeo.nativeSourceHandler.canHandleSource = function(source) {
  if (source.type) {
    return Vimeo.nativeSourceHandler.canPlayType(source.type);
  } else if (source.src) {
    return Vimeo.nativeSourceHandler.canPlayType(source.src);
  }

  return '';
};

// @note: Copied over from YouTube — not sure this is relevant
Vimeo.nativeSourceHandler.handleSource = function(source, tech) {
  tech.src(source.src);
};

// @note: Copied over from YouTube — not sure this is relevant
Vimeo.nativeSourceHandler.dispose = function() {
  this._player.unload();

  this.el_.parentNode.className = this.el_.parentNode.className
    .replace(' vjs-vimeo', '');
  this.el_.parentNode.removeChild(this.el_);

  Tech.prototype.dispose.call(this);
};

Vimeo.registerSourceHandler(Vimeo.nativeSourceHandler);

Component.registerComponent('Vimeo', Vimeo);
Tech.registerTech('Vimeo', Vimeo);

// Include the version number.
Vimeo.VERSION = '0.0.1';

export default Vimeo;
