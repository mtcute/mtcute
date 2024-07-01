/**
 * The entire thing is taken from aes-browserify, just got rid of everything else and kept the ctr parts
 */

import { encrypt } from "./ctr";
import StreamCipher from "./streamCipher";

export function createCipheriv(suite, password, iv) {
	if (password.length !== 256 / 8) throw new TypeError("invalid key length " + password.length);

	if (iv.length !== 16) throw new TypeError("invalid iv length " + iv.length);

	return new StreamCipher({ encrypt }, password, iv);
}
