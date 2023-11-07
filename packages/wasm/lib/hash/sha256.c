/*
    MIT License

    Copyright (c) 2020 LekKit https://github.com/LekKit

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

#include "wasm.h"

struct lekkit_sha256_buff {
    uint64_t data_size;
    uint32_t h[8];
    uint8_t last_chunk[64];
    uint8_t chunk_size;
};

void lekkit_sha256_init(struct lekkit_sha256_buff* buff) {
    buff->h[0] = 0x6a09e667;
    buff->h[1] = 0xbb67ae85;
    buff->h[2] = 0x3c6ef372;
    buff->h[3] = 0xa54ff53a;
    buff->h[4] = 0x510e527f;
    buff->h[5] = 0x9b05688c;
    buff->h[6] = 0x1f83d9ab;
    buff->h[7] = 0x5be0cd19;
    buff->data_size = 0;
    buff->chunk_size = 0;
}

static const uint32_t lekkit_k[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

#define rotate_r(val, bits) (val >> bits | val << (32 - bits))

static void lekkit_sha256_calc_chunk(struct lekkit_sha256_buff* buff, const uint8_t* chunk) {
    uint32_t w[64];
    uint32_t tv[8];
    uint32_t i;

    for (i=0; i<16; ++i){
        w[i] = (uint32_t) chunk[0] << 24 | (uint32_t) chunk[1] << 16 | (uint32_t) chunk[2] << 8 | (uint32_t) chunk[3];
        chunk += 4;
    }
    
    for (i=16; i<64; ++i){
        uint32_t s0 = rotate_r(w[i-15], 7) ^ rotate_r(w[i-15], 18) ^ (w[i-15] >> 3);
        uint32_t s1 = rotate_r(w[i-2], 17) ^ rotate_r(w[i-2], 19) ^ (w[i-2] >> 10);
        w[i] = w[i-16] + s0 + w[i-7] + s1;
    }
    
    for (i = 0; i < 8; ++i)
        tv[i] = buff->h[i];
    
    for (i=0; i<64; ++i){
        uint32_t S1 = rotate_r(tv[4], 6) ^ rotate_r(tv[4], 11) ^ rotate_r(tv[4], 25);
        uint32_t ch = (tv[4] & tv[5]) ^ (~tv[4] & tv[6]);
        uint32_t temp1 = tv[7] + S1 + ch + lekkit_k[i] + w[i];
        uint32_t S0 = rotate_r(tv[0], 2) ^ rotate_r(tv[0], 13) ^ rotate_r(tv[0], 22);
        uint32_t maj = (tv[0] & tv[1]) ^ (tv[0] & tv[2]) ^ (tv[1] & tv[2]);
        uint32_t temp2 = S0 + maj;
        
        tv[7] = tv[6];
        tv[6] = tv[5];
        tv[5] = tv[4];
        tv[4] = tv[3] + temp1;
        tv[3] = tv[2];
        tv[2] = tv[1];
        tv[1] = tv[0];
        tv[0] = temp1 + temp2;
    }

    for (i = 0; i < 8; ++i)
        buff->h[i] += tv[i];
}

void lekkit_sha256_update(struct lekkit_sha256_buff* buff, const void* data, uint32_t size) {
    const uint8_t* ptr = (const uint8_t*)data;
    buff->data_size += size;
    /* If there is data left in buff, concatenate it to process as new chunk */
    if (size + buff->chunk_size >= 64) {
        uint8_t tmp_chunk[64];
        __builtin_memcpy(tmp_chunk, buff->last_chunk, buff->chunk_size);
        __builtin_memcpy(tmp_chunk + buff->chunk_size, ptr, 64 - buff->chunk_size);
        ptr += (64 - buff->chunk_size);
        size -= (64 - buff->chunk_size);
        buff->chunk_size = 0;
        lekkit_sha256_calc_chunk(buff, tmp_chunk);
    }
    /* Run over data chunks */
    while (size  >= 64) {
        lekkit_sha256_calc_chunk(buff, ptr);
        ptr += 64;
        size -= 64; 
    }
    
    /* Save remaining data in buff, will be reused on next call or finalize */
    __builtin_memcpy(buff->last_chunk + buff->chunk_size, ptr, size);
    buff->chunk_size += size;
}

void lekkit_sha256_finalize(struct lekkit_sha256_buff* buff) {
    buff->last_chunk[buff->chunk_size] = 0x80;
    buff->chunk_size++;
    __builtin_memset(buff->last_chunk + buff->chunk_size, 0, 64 - buff->chunk_size);

    /* If there isn't enough space to fit int64, pad chunk with zeroes and prepare next chunk */
    if (buff->chunk_size > 56) {
        lekkit_sha256_calc_chunk(buff, buff->last_chunk);
        __builtin_memset(buff->last_chunk, 0, 64);
    }

    /* Add total size as big-endian int64 x8 */
    uint64_t size = buff->data_size * 8;
    int i;
    for (i = 8; i > 0; --i) {
        buff->last_chunk[55+i] = size & 255;
        size >>= 8;
    }

    lekkit_sha256_calc_chunk(buff, buff->last_chunk);
}

void lekkit_sha256_read(const struct lekkit_sha256_buff* buff, uint8_t* hash) {
    uint32_t i;
    for (i = 0; i < 8; i++) {
        hash[i*4] = (buff->h[i] >> 24) & 255;
        hash[i*4 + 1] = (buff->h[i] >> 16) & 255;
        hash[i*4 + 2] = (buff->h[i] >> 8) & 255;
        hash[i*4 + 3] = buff->h[i] & 255;
    }
}

struct lekkit_sha256_buff lekkit_shared_ctx;

WASM_EXPORT void sha256(const void* data, uint32_t size) {
    lekkit_sha256_init(&lekkit_shared_ctx);
    lekkit_sha256_update(&lekkit_shared_ctx, data, size);
    lekkit_sha256_finalize(&lekkit_shared_ctx);
    lekkit_sha256_read(&lekkit_shared_ctx, shared_out);
}

#undef rotate_r