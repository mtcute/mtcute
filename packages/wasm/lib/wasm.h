#ifndef MTCUTE_WASM_H
#define MTCUTE_WASM_H

#include "common_defs.h"

#define WASM_EXPORT __attribute__((visibility("default")))

// Returns NULL without changing allocator state if the allocation cannot be satisfied.
// See utils/allocator.c.
extern void* __malloc(size_t size);
extern void __free(void* ptr);

// Internal aligned-allocation helpers. Alignment must be a nonzero power of two.
extern void* __malloc_aligned(size_t alignment, size_t size);
extern void __free_aligned(void* ptr);

#define memset(p,v,n) __builtin_memset(p,v,n)
#define memcpy(d,s,n) __builtin_memcpy(d,s,n)

// more than enough for most of our cases
extern uint8_t shared_out[256];

#endif // MTCUTE_WASM_H
