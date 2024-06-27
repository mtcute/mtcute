#include "wasm.h"
#include <stdalign.h>

#ifndef AES256_H
#define AES256_H

#define AES_BLOCK_SIZE 16
#define EXPANDED_KEY_SIZE 60

typedef uint8_t v16qi __attribute__ (( vector_size(16) ));
typedef uint32_t v4si __attribute__ (( vector_size(16) ));

extern alignas(16) uint8_t aes_shared_key_buffer[32];
extern alignas(16) uint8_t aes_shared_iv_buffer[32];

void aes256_set_encryption_key(uint8_t* key, uint32_t* expandedKey);
void aes256_set_decryption_key(uint8_t* key, uint32_t* expandedKey);

v16qi aes256_encrypt(v16qi in, uint32_t* expandedKey);
v16qi aes256_decrypt(v16qi in, uint32_t* expandedKey);

#endif  // AES256_H
