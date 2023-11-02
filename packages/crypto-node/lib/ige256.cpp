#include <node_api.h>
#include <openssl/evp.h>
#include <openssl/err.h>
#include "ige256.h"

#define THROW_OPENSSL_ERROR \
    napi_throw_error(env, NULL, ERR_error_string(ERR_get_error(), NULL)); \
    return;

void ige256_encrypt(napi_env env, uint8_t* in, uint32_t length, uint8_t* key, uint8_t* iv, uint8_t* out) {
    EVP_CIPHER_CTX *ctx;
    uint32_t i, j;

    uint8_t* iv1;
    uint8_t* iv2;
    uint8_t* block;

    int written;

    iv1 = &iv[0];
    iv2 = &iv[16];

    if (!(ctx = EVP_CIPHER_CTX_new())) {
        THROW_OPENSSL_ERROR
    }

    if (1 != EVP_EncryptInit_ex(ctx, EVP_aes_256_ecb(), NULL, key, NULL)) {
        THROW_OPENSSL_ERROR
    }

    for (i = 0; i < length; i += AES_BLOCK_SIZE) {
        block = &out[i];

        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            block[j] = in[i + j] ^ iv1[j];

        if (1 != EVP_EncryptUpdate(ctx, block, &written, block, AES_BLOCK_SIZE)) {
            THROW_OPENSSL_ERROR
        }

        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            block[j] ^= iv2[j];

        iv1 = block;
        iv2 = &in[i];
    }

    EVP_CIPHER_CTX_free(ctx);
}

void ige256_decrypt(napi_env env, uint8_t* in, uint32_t length, uint8_t* key, uint8_t* iv, uint8_t* out) {
    EVP_CIPHER_CTX *ctx;
    uint32_t i, j;

    uint8_t* iv1;
    uint8_t* iv2;
    uint8_t* block;

    int written;

    iv1 = &iv[16];
    iv2 = &iv[0];

    if (!(ctx = EVP_CIPHER_CTX_new())) {
        THROW_OPENSSL_ERROR
    }

    if (1 != EVP_DecryptInit_ex(ctx, EVP_aes_256_ecb(), NULL, key, NULL)) {
        THROW_OPENSSL_ERROR
    }

    if (1 != EVP_CIPHER_CTX_set_padding(ctx, 0)) {
        THROW_OPENSSL_ERROR
    }

    for (i = 0; i < length; i += AES_BLOCK_SIZE) {
        block = &out[i];

        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            block[j] = in[i + j] ^ iv1[j];

        if (1 != EVP_DecryptUpdate(ctx, block, &written, block, AES_BLOCK_SIZE)) {
            THROW_OPENSSL_ERROR
        }

        for (j = 0; j < AES_BLOCK_SIZE; ++j)
            block[j] ^= iv2[j];

        iv1 = block;
        iv2 = &in[i];
    }
}
