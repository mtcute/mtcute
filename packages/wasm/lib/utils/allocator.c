#include "wasm.h"

extern unsigned char __heap_base;
static size_t __heap_tail = (size_t) &__heap_base;
static size_t __heap_mark = (size_t) &__heap_base;

#define memory_size() __builtin_wasm_memory_size(0)

#define memory_grow(delta) __builtin_wasm_memory_grow(0, delta)

enum {
	_mem_flag_used = 0xbf82583a,
	_mem_flag_free = 0xab34d705
};

WASM_EXPORT void* __malloc(size_t n) {
	n += (8 - (n % 4)) % 4;
	// check if size is enough
	size_t total = __heap_tail + n + 3 * sizeof(size_t);
	size_t size = memory_size() << 16;
	if (total > size) {
		memory_grow((total >> 16) - (size >> 16) + 1);
	}
	unsigned int r = __heap_tail;
	*((size_t*) r) = n;
	r += sizeof(size_t);
	*((size_t*) r) =_mem_flag_used;
	r += sizeof(size_t);
	__heap_tail = r + n;
	*((size_t*) __heap_tail) = n;
	__heap_tail += sizeof(size_t);
	return (void*) r;
}

WASM_EXPORT void __free(void* p) {
	size_t n;
	// null case
	if (!p) return;
	size_t r=(size_t)p;
	r -= sizeof(size_t);
	// already free
	if (*((size_t*) r) != _mem_flag_used) {
		return;
	}
	// mark it as free
	size_t flag = _mem_flag_free;
	*((size_t*) r) = flag;
	// calc ptr_tail
	r -= sizeof(size_t);
	n = *(size_t*) r; // size of current block
	size_t ptr_tail = ((size_t) p) + n + sizeof(size_t);
	// if not at tail return without moving __heap_tail
	if (__heap_tail != ptr_tail) {
		return;
	}
	__heap_tail = r;
	while (r > (size_t) &__heap_base) {
		r -= sizeof(size_t);
		n = *(size_t*) r; // size of previous block
		r -= n;
		r -= sizeof(size_t);
		flag = *((size_t*) r);
		if (flag != _mem_flag_free) break;
		r -= sizeof(size_t);
		n = *(size_t*) r; // size of current block
		__heap_tail = r;
	}
}

uint8_t shared_out[256];

WASM_EXPORT uint8_t* __get_shared_out() {
    return shared_out;
}