#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const filename = path.resolve(process.argv[2])

const before = [`/**
 * videojs-vimeo
 * @version 3.0.0
 * @copyright 2017 Benoit Tremblay <trembl.ben@gmail.com>
 * @license MIT
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.videojsVimeo = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
define(['exports', 'video.js', '@vimeo/player'], function (exports, _video, _player) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });`, `
  exports.default = Vimeo;
});
},{}]},{},[1])(1)
});`]

const after = [`(function (root, factory) {
  if(typeof define === 'function' && define.amd) {
    define([
        'videojs', 'vimeo'
    ], function (_video, _player) {
        return (root.Youtube = factory(_video, _player));
    });
  }
}(this, function(_video, _player) {
  'use strict';`, `
  return Vimeo;
}));`]

let content = fs
  .readFileSync(filename, 'utf8')
  .replace(before[0], after[0])
  .replace(before[1], after[1])

fs.writeFileSync(filename, content, 'utf8')
