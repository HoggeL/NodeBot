var Opus = require('node-opus');
var util = require('util');
var Transform = require('stream').Transform;
util.inherits(BaseStream, Transform);
util.inherits(Decoder, BaseStream)

function BaseStream(options) {
	options = options || {};
	options.channels = options.channels || 2;
	this._rate = options.rate || 48000;
	this._frame_size = options._frame_size || this._rate / 100;
	this._codec = new Opus.OpusEncoder( this._rate, options.channels );
	Transform.call(this, options);
}
BaseStream.prototype._flush = function(callback) {
	callback();
}


function Decoder(options) {
	if (!(this instanceof Decoder))
		return new Decoder(options);
	BaseStream.call(this, options);
}
Decoder.prototype._transform = function(chunk, encoding, done) {
	done(null, this._codec.decode(chunk, this._frame_size));
}

exports.Decoder = Decoder;