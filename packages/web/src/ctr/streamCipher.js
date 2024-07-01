import CipherBase from "./cipher";
import { AES } from "./aes";
import { Buffer } from "buffer";

export default class StreamCipher extends CipherBase {
	constructor(mode, key, iv, decrypt) {
		super();
		this._cipher = new AES(key);
		this._prev = Buffer.from(iv);
		this._cache = Buffer.allocUnsafe(0);
		this._secCache = Buffer.allocUnsafe(0);
		this._decrypt = decrypt;
		this._mode = mode;
	}

	_update = function (chunk) {
		return this._mode.encrypt(this, chunk, this._decrypt);
	};

	_final = function () {
		this._cipher.scrub();
	};
}
