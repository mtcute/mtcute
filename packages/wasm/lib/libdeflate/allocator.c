#include "wasm.h"

void *
libdeflate_aligned_malloc(size_t alignment, size_t size)
{
	return __malloc_aligned(alignment, size);
}

void
libdeflate_aligned_free(void *ptr)
{
	__free_aligned(ptr);
}
