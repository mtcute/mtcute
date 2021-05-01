#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#ifndef AES256_H
#define AES256_H

#define AES_BLOCK_SIZE 16
#define EXPANDED_KEY_SIZE 60

#ifdef __cplusplus
extern "C" {
#endif

void aes256_set_encryption_key(uint8_t* key, uint32_t* expandedKey);
void aes256_set_decryption_key(uint8_t* key, uint32_t* expandedKey);

void aes256_encrypt(uint8_t* in, uint8_t* out, uint32_t* expandedKey);
void aes256_decrypt(uint8_t* in, uint8_t* out, uint32_t* expandedKey);


#ifdef __cplusplus
}
#endif

#endif  // AES256_H
