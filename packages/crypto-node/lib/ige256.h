#include <stdint.h>
#include <node_api.h>

#ifndef IGE256_H
#define IGE256_H

#define AES_BLOCK_SIZE 16

typedef uint8_t v16qi __attribute__ (( vector_size(16), aligned(4) ));

void ige256_encrypt(napi_env env, uint8_t* in, uint32_t length, uint8_t* key, uint8_t* iv, uint8_t* out);
void ige256_decrypt(napi_env env, uint8_t* in, uint32_t length, uint8_t* key, uint8_t* iv, uint8_t* out);

#endif  // IGE256_H
