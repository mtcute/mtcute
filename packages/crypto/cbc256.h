#include <stdint.h>

#ifndef CBC256_H
#define CBC256_H

#ifdef __cplusplus
extern "C" {
#endif

void cbc256_encrypt(uint8_t* in, size_t length, uint8_t* key, uint8_t* iv, uint8_t* out);
void cbc256_decrypt(uint8_t* in, size_t length, uint8_t* key, uint8_t* iv, uint8_t* out);

#ifdef __cplusplus
}
#endif

#endif  // CBC256_H
