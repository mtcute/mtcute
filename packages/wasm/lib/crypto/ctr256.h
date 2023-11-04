#ifndef CTR256_H
#define CTR256_H

uint8_t *ctr256(const uint8_t in[], uint32_t length, const uint8_t key[32], uint8_t iv[16], uint8_t *state);

#endif