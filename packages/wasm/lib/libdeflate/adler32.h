#ifndef LIB_DEFLATE_ADLER32_H
#define LIB_DEFLATE_ADLER32_H

#include "lib_common.h"

u32 libdeflate_adler32(u32 adler, const void *buffer, size_t len);

#endif /* LIB_DEFLATE_ADLER32_H */
