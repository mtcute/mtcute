#include <stdint.h>

#ifndef IGE256_H
#define IGE256_H

#ifdef __cplusplus
extern "C" {
#endif

void ige256_encrypt(uint8_t* in, uint32_t length, uint8_t* key, uint8_t* iv, uint8_t* out);
void ige256_decrypt(uint8_t* in, uint32_t length, uint8_t* key, uint8_t* iv, uint8_t* out);

#ifdef __cplusplus
}
#endif

#endif  // IGE256_H
