#include "aes256.h"

void cbc256_encrypt(uint8_t* in, size_t length, uint8_t* key, uint8_t* iv, uint8_t* out) {
    uint32_t expandedKey[EXPANDED_KEY_SIZE];
    uint32_t i, j;

    uint8_t* currentIv = iv;

    aes256_set_encryption_key(key, expandedKey);

    for (i = 0; i < length; i += AES_BLOCK_SIZE) {
        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            out[i + j] = in[i + j] ^ currentIv[j];

        aes256_encrypt(&out[i], &out[i], expandedKey);
        currentIv = &out[i];
    }
}

void cbc256_decrypt(uint8_t* in, size_t length, uint8_t* key, uint8_t* iv, uint8_t* out) {
    uint32_t expandedKey[EXPANDED_KEY_SIZE];
    uint32_t i, j;

    uint8_t* currentIv = iv;

    aes256_set_decryption_key(key, expandedKey);

    for (i = 0; i < length; i += AES_BLOCK_SIZE) {
        aes256_decrypt(&in[i], &out[i], expandedKey);

        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            out[i + j] ^= currentIv[j];

        currentIv = &in[i];
    }
}