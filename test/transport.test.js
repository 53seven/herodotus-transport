/* global describe, it, beforeEach, afterEach */
const sinon = require('sinon');
const request = require('request');
const chai = require('chai');
const expect = chai.expect;

const transport = require('../');

const api_token = 'a token';

describe('herodotus-transport', () => {

  let postStub;
  let endpoint;
  let herodotus_err;
  let herodotus_response;
  let call_count;
  let sample_log;

  beforeEach(() => {
    // stub request.post
    endpoint = 'http://herodotus.io/log';
    herodotus_err;
    herodotus_response = {statusCode: 200};
    call_count = 1;
    sample_log = {foo: 'bar'};

    postStub = sinon.stub(request, 'post', (url, payload, callback) => {
      //console.log(url, payload, 1);

      expect(url).to.be.equal(endpoint);
      expect(payload).to.have.property('form');
      expect(payload.form).to.have.property('api_token', api_token);
      expect(payload.form).to.have.property('logs');
      expect(payload.form.logs[0]).to.deep.equal(sample_log);

      callback(herodotus_err, herodotus_response);
    });
  });

  afterEach(() => {
    postStub.restore();
  });

  it('should error when no api token is provided', () => {
    expect(() => {
      transport();
    }).to.throw();
  });

  it('should send bundled data to herodotus', (done) => {
    const stream = transport({api_token});
    stream.write(sample_log, (err) => {
      expect(err).to.be.undefined;
      expect(postStub.callCount).to.equal(call_count);
      done();
    });
  });

  it('should bundle up to the payload_size', (done) => {
    call_count = 2;
    const stream = transport({api_token});
    for (let i = 0; i < 150; i++) {
      stream.write(sample_log);
    }
    stream.write(sample_log, (err) => {
      expect(err).to.be.undefined;
      expect(postStub.callCount).to.equal(call_count);
      done();
    });
  });

  it('should emit warnings by default', (done) => {
    herodotus_err = new Error('foo');
    herodotus_response = {statusCode: 404};
    const stream = transport({api_token});
    stream.on('warn', (err) => {
      expect(err).to.be.equal(herodotus_err);
      done();
    });
    stream.write(sample_log);
  });

  it('should emit errors when asked', (done) => {
    herodotus_err = new Error('foo');
    herodotus_response = {statusCode: 404};
    const stream = transport({api_token, emit_error: true});
    stream.on('error', (err) => {
      expect(err).to.be.equal(herodotus_err);
      done();
    });
    stream.write(sample_log);
  });

});
