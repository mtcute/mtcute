#include <stdint.h>

#ifndef CTR256_H
#define CTR256_H

extern "C" uint8_t* ctr256(uint8_t* in, uint32_t length, uint8_t* key, uint8_t* iv, uint8_t* state, uint8_t* out);

#endif  // CTR256_H
