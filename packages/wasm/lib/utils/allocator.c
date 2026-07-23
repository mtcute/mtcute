#include "wasm.h"

extern unsigned char __heap_base;
static size_t __heap_tail = (size_t) &__heap_base;

#define memory_size() __builtin_wasm_memory_size(0)

#define memory_grow(delta) __builtin_wasm_memory_grow(0, delta)

#define WASM_PAGE_SIZE (1U << 16)

enum {
	_mem_flag_used = 0xbf82583a,
	_mem_flag_free = 0xab34d705
};

WASM_EXPORT void* __malloc(size_t n) {
	size_t padding = (sizeof(size_t) - (n % sizeof(size_t))) % sizeof(size_t);
	if (n > (size_t)-1 - padding) {
		return NULL;
	}
	n += padding;

	if (n > (size_t)-1 - 3 * sizeof(size_t) ||
	    __heap_tail > (size_t)-1 - n - 3 * sizeof(size_t)) {
		return NULL;
	}

	// check if size is enough
	size_t total = __heap_tail + n + 3 * sizeof(size_t);
	size_t current_pages = memory_size();
	size_t required_pages = total / WASM_PAGE_SIZE + (total % WASM_PAGE_SIZE != 0);
	if (required_pages > current_pages) {
		if (memory_grow(required_pages - current_pages) == (size_t)-1) {
			return NULL;
		}
	}
	size_t r = __heap_tail;
	*((size_t*) r) = n;
	r += sizeof(size_t);
	*((size_t*) r) =_mem_flag_used;
	r += sizeof(size_t);
	__heap_tail = r + n;
	*((size_t*) __heap_tail) = n;
	__heap_tail += sizeof(size_t);
	return (void*) r;
}

void* __malloc_aligned(size_t alignment, size_t n) {
	if (alignment == 0 || (alignment & (alignment - 1)) != 0) {
		return NULL;
	}

	size_t alignment_padding = alignment - 1;
	if (alignment_padding > (size_t)-1 - sizeof(void*)) {
		return NULL;
	}

	size_t overhead = sizeof(void*) + alignment_padding;
	if (n > (size_t)-1 - overhead) {
		return NULL;
	}

	void* original = __malloc(n + overhead);
	if (original == NULL) {
		return NULL;
	}

	uintptr_t aligned = ((uintptr_t) original + overhead) & ~(uintptr_t) alignment_padding;
	// Keep the original allocation immediately before the aligned address so it can be released.
	((void**) aligned)[-1] = original;
	return (void*) aligned;
}

void __free_aligned(void* p) {
	if (p == NULL) {
		return;
	}

	__free(((void**) p)[-1]);
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
