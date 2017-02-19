// stream.js
const EventEmitter = require('events');
const async = require('async');
const request = require('request');
const _ = require('lodash');

function httpStream(opts) {
  opts = _.assign({
    server: 'http://herodotus.io/log',
    payload_size: 100,
    emit_error: false
  }, opts);

  if (!opts.api_token) {
    throw new Error('no api_token provided');
  }

  httpStream.prototype.__proto__ = EventEmitter.prototype;

  this.cargo = async.cargo((task, callback) =>{
    let form = {
      api_token: opts.api_token,
      logs: task
    };

    request.post(opts.server, {form: form}, (err, res) => {
      if (res.statusCode !== 200) {
        const level = opts.emit_error ? 'error' : 'warn';
        this.emit(level, err);
      }
      callback();
    });
  }, opts.payload_size);

  this.write = (log, cb) => {
    this.cargo.push(log, cb);
  };

  return this;
}

module.exports = function(opts) {
  return new httpStream(opts);
};
