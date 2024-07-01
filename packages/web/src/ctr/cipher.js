import { Buffer } from "buffer";
import Transform from "readable-stream/lib/internal/streams/transform";
import { StringDecoder } from "string_decoder";

export default class CipherBase extends Transform {
	constructor(hashMode) {
		super();
		this.hashMode = typeof hashMode === "string";
		if (this.hashMode) {
			this[hashMode] = this._finalOrDigest;
		} else {
			this.final = this._finalOrDigest;
		}
		if (this._final) {
			this.__final = this._final;
			this._final = null;
		}
		this._decoder = null;
		this._encoding = null;
	}

	update(data, inputEnc, outputEnc) {
		if (typeof data === "string") {
			data = Buffer.from(data, inputEnc);
		}

		var outData = this._update(data);
		if (this.hashMode) return this;

		if (outputEnc) {
			outData = this._toString(outData, outputEnc);
		}

		return outData;
	}

	setAutoPadding() {}

	getAuthTag() {
		throw new Error("trying to get auth tag in unsupported state");
	}

	setAuthTag() {
		throw new Error("trying to set auth tag in unsupported state");
	}

	setAAD() {
		throw new Error("trying to set aad in unsupported state");
	}

	_transform(data, _, next) {
		var err;
		try {
			if (this.hashMode) {
				this._update(data);
			} else {
				this.push(this._update(data));
			}
		} catch (e) {
			err = e;
		} finally {
			next(err);
		}
	}
	_flush(done) {
		var err;
		try {
			this.push(this.__final());
		} catch (e) {
			err = e;
		}

		done(err);
	}
	_finalOrDigest(outputEnc) {
		var outData = this.__final() || Buffer.alloc(0);
		if (outputEnc) {
			outData = this._toString(outData, outputEnc, true);
		}
		return outData;
	}

	_toString(value, enc, fin) {
		if (!this._decoder) {
			this._decoder = new StringDecoder(enc);
			this._encoding = enc;
		}

		if (this._encoding !== enc) throw new Error("can't switch encodings");

		var out = this._decoder.write(value);
		if (fin) {
			out += this._decoder.end();
		}

		return out;
	}
}
