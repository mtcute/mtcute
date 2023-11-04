/*
 * lib_common.h - internal header included by all library code
 */

#ifndef LIB_LIB_COMMON_H
#define LIB_LIB_COMMON_H

#ifdef LIBDEFLATE_H
 /*
  * When building the library, LIBDEFLATEAPI needs to be defined properly before
  * including libdeflate.h.
  */
#  error "lib_common.h must always be included before libdeflate.h"
#endif

#if defined(LIBDEFLATE_DLL) && (defined(_WIN32) || defined(__CYGWIN__))
#  define LIBDEFLATE_EXPORT_SYM  __declspec(dllexport)
#elif defined(__GNUC__)
#  define LIBDEFLATE_EXPORT_SYM  __attribute__((visibility("default")))
#else
#  define LIBDEFLATE_EXPORT_SYM
#endif

/*
 * On i386, gcc assumes that the stack is 16-byte aligned at function entry.
 * However, some compilers (e.g. MSVC) and programming languages (e.g. Delphi)
 * only guarantee 4-byte alignment when calling functions.  This is mainly an
 * issue on Windows, but it has been seen on Linux too.  Work around this ABI
 * incompatibility by realigning the stack pointer when entering libdeflate.
 * This prevents crashes in SSE/AVX code.
 */
#if defined(__GNUC__) && defined(__i386__)
#  define LIBDEFLATE_ALIGN_STACK  __attribute__((force_align_arg_pointer))
#else
#  define LIBDEFLATE_ALIGN_STACK
#endif

#define LIBDEFLATEAPI	LIBDEFLATE_EXPORT_SYM LIBDEFLATE_ALIGN_STACK

#include "common_defs.h"

extern void* __malloc(size_t size);
extern void __free(void* ptr);

void *libdeflate_aligned_malloc(size_t alignment, size_t size);
void libdeflate_aligned_free(void *ptr);

#define ASSERT(expr) (void)(expr)
#define CONCAT_IMPL(a, b)	a##b
#define CONCAT(a, b)		CONCAT_IMPL(a, b)
#define ADD_SUFFIX(name)	CONCAT(name, SUFFIX)

#ifdef LOGGING
void __debug(char* str);

#define DEBUG(str) __debug(str);

#else
#define DEBUG(str)
#endif

#endif /* LIB_LIB_COMMON_H */
