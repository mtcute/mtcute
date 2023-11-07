#include "aes256.h"

WASM_EXPORT void ige256_encrypt(uint8_t* in, uint32_t length, uint8_t* out) {
    uint32_t expandedKey[EXPANDED_KEY_SIZE];
    uint32_t i, j;

    uint8_t* iv1;
    uint8_t* iv2;
    uint8_t* block;

    iv1 = &aes_shared_iv_buffer[0];
    iv2 = &aes_shared_iv_buffer[16];

    aes256_set_encryption_key(aes_shared_key_buffer, expandedKey);

    for (i = 0; i < length; i += AES_BLOCK_SIZE) {
        block = &out[i];

        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            block[j] = in[i + j] ^ iv1[j];

        aes256_encrypt(block, block, expandedKey);

        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            block[j] ^= iv2[j];

        iv1 = block;
        iv2 = &in[i];
    }
}

WASM_EXPORT void ige256_decrypt(uint8_t* in, uint32_t length, uint8_t* out) {
    uint32_t expandedKey[EXPANDED_KEY_SIZE];
    uint32_t i, j;

    uint8_t* iv1;
    uint8_t* iv2;
    uint8_t* block;

    iv1 = &aes_shared_iv_buffer[16];
    iv2 = &aes_shared_iv_buffer[0];

    aes256_set_decryption_key(aes_shared_key_buffer, expandedKey);

    for (i = 0; i < length; i += AES_BLOCK_SIZE) {
        block = &out[i];

        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            block[j] = in[i + j] ^ iv1[j];

        aes256_decrypt(block, block, expandedKey);

        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            block[j] ^= iv2[j];

        iv1 = block;
        iv2 = &in[i];
    }
}