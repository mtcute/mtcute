#ifndef MTCUTE_WASM_H
#define MTCUTE_WASM_H

#include "common_defs.h"

#define WASM_EXPORT __attribute__((visibility("default")))

// see utils/allocator.c
extern void* __malloc(size_t size);
extern void __free(void* ptr);

#define memset(p,v,n) __builtin_memset(p,v,n)
#define memcpy(d,s,n) __builtin_memcpy(d,s,n)

// more than enough for most of our cases
extern uint8_t shared_out[256];

#endif // MTCUTE_WASM_H