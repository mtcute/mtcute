#include "aes256.h"

WASM_EXPORT void ige256_encrypt(uint8_t* in, uint32_t length, uint8_t* out) {
    alignas(16) uint32_t expandedKey[EXPANDED_KEY_SIZE];
    uint32_t i;

    v16qi iv1 = *(v16qi*)&aes_shared_iv_buffer[0];
    v16qi iv2 = *(v16qi*)&aes_shared_iv_buffer[16];

    aes256_set_encryption_key(aes_shared_key_buffer, expandedKey);

    for (i = 0; i < length; i += AES_BLOCK_SIZE) {
        v16qi v_in = *(v16qi*)&in[i];

        v16qi block = aes256_encrypt(v_in ^ iv1, expandedKey);

        block ^= iv2;

        *(v16qi*)&out[i] = block;

        iv1 = block;
        iv2 = v_in;
    }
}

WASM_EXPORT void ige256_decrypt(uint8_t* in, uint32_t length, uint8_t* out) {
    alignas(16) uint32_t expandedKey[EXPANDED_KEY_SIZE];
    uint32_t i;

    v16qi iv1 = *(v16qi*)&aes_shared_iv_buffer[16];
    v16qi iv2 = *(v16qi*)&aes_shared_iv_buffer[0];

    aes256_set_decryption_key(aes_shared_key_buffer, expandedKey);

    for (i = 0; i < length; i += AES_BLOCK_SIZE) {
        v16qi v_in = *(v16qi*)&in[i];

        v16qi block = aes256_decrypt(v_in ^ iv1, expandedKey);

        block ^= iv2;

        *(v16qi*)&out[i] = block;

        iv1 = block;
        iv2 = v_in;
    }
}
