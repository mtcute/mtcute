/*
 * utils.c - utility functions for libdeflate
 *
 * Copyright 2016 Eric Biggers
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

#include "lib_common.h"

extern unsigned char __heap_base;
static size_t __heap_tail = (size_t) &__heap_base;
static size_t __heap_mark = (size_t) &__heap_base;

#define memory_size() __builtin_wasm_memory_size(0)

#define memory_grow(delta) __builtin_wasm_memory_grow(0, delta)

enum {
	_mem_flag_used = 0xbf82583a,
	_mem_flag_free = 0xab34d705
};

__attribute__((visibility("default"))) void* __malloc(size_t n) {
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

__attribute__((visibility("default"))) void __free(void* p) {
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

void *
libdeflate_aligned_malloc(size_t alignment, size_t size)
{
	void *ptr = __malloc(sizeof(void *) + alignment - 1 + size);

	if (ptr) {
		void *orig_ptr = ptr;

		ptr = (void *)ALIGN((uintptr_t)ptr + sizeof(void *), alignment);
		((void **)ptr)[-1] = orig_ptr;
	}
	return ptr;
}

void
libdeflate_aligned_free(void *ptr)
{
	__free((((void **)ptr)[-1]));
}


#ifdef LOGGING
char* __debug_log = 0;
char __debug_log_pos = 0;
__attribute__((visibility("default"))) char* __get_debug_log() {
    return __debug_log;
}

void __debug(char* str) {
    if (!__debug_log) {
        __debug_log = __malloc(1024);
    }

    int i = 0;
    while (str[i] != '\0') {
        __debug_log[__debug_log_pos++] = str[i++];
    }
    __debug_log[__debug_log_pos++] = '\n';
    __debug_log[__debug_log_pos] = '\0';
}
#endif
