#include "aes256.h"

#define MIN(a, b) (((a) < (b)) ? (a) : (b))

void ctr256(uint8_t* in, uint32_t length, uint8_t* key, uint8_t* iv, uint8_t* counter, uint8_t* out) {
    uint8_t chunk[AES_BLOCK_SIZE];
    uint32_t expandedKey[EXPANDED_KEY_SIZE];
    uint32_t i, j, k;

    memcpy(out, in, length);
    aes256_set_encryption_key(key, expandedKey);

    aes256_encrypt(iv, chunk, expandedKey);

    for (i = 0; i < length; i += AES_BLOCK_SIZE) {
        for (j = 0; j < MIN(length - i, AES_BLOCK_SIZE); ++j) {
            out[i + j] ^= chunk[(*counter)++];

            if (*counter >= AES_BLOCK_SIZE)
                *counter = 0;

            if (*counter == 0) {
                k = AES_BLOCK_SIZE;
                while(k--)
                    if (++iv[k])
                        break;

                aes256_encrypt(iv, chunk, expandedKey);
            }
        }
    }
}
