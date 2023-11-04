#ifndef LIB_DEFLATE_COMPRESS_H
#define LIB_DEFLATE_COMPRESS_H

#include "lib_common.h"

enum libdeflate_result
libdeflate_deflate_decompress_ex(struct libdeflate_decompressor *d,
				 const void *in, size_t in_nbytes,
				 void *out, size_t out_nbytes_avail,
				 size_t *actual_in_nbytes_ret,
				 size_t *actual_out_nbytes_ret);


#endif /* LIB_DEFLATE_COMPRESS_H */
