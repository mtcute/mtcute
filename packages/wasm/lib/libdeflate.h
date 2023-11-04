/*
 * libdeflate.h - public header for libdeflate
 */

#ifndef LIBDEFLATE_H
#define LIBDEFLATE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define LIBDEFLATE_VERSION_MAJOR	1
#define LIBDEFLATE_VERSION_MINOR	19
#define LIBDEFLATE_VERSION_STRING	"1.19"

/*
 * Users of libdeflate.dll on Windows can define LIBDEFLATE_DLL to cause
 * __declspec(dllimport) to be used.  This should be done when it's easy to do.
 * Otherwise it's fine to skip it, since it is a very minor performance
 * optimization that is irrelevant for most use cases of libdeflate.
 */
#ifndef LIBDEFLATEAPI
#  if defined(LIBDEFLATE_DLL) && (defined(_WIN32) || defined(__CYGWIN__))
#    define LIBDEFLATEAPI	__declspec(dllimport)
#  else
#    define LIBDEFLATEAPI
#  endif
#endif

/* ========================================================================== */
/*                             Compression                                    */
/* ========================================================================== */

struct libdeflate_compressor;
struct libdeflate_options;

/*
 * libdeflate_alloc_compressor() allocates a new compressor that supports
 * DEFLATE, zlib, and gzip compression.  'compression_level' is the compression
 * level on a zlib-like scale but with a higher maximum value (1 = fastest, 6 =
 * medium/default, 9 = slow, 12 = slowest).  Level 0 is also supported and means
 * "no compression", specifically "create a valid stream, but only emit
 * uncompressed blocks" (this will expand the data slightly).
 *
 * The return value is a pointer to the new compressor, or NULL if out of memory
 * or if the compression level is invalid (i.e. outside the range [0, 12]).
 *
 * Note: for compression, the sliding window size is defined at compilation time
 * to 32768, the largest size permissible in the DEFLATE format.  It cannot be
 * changed at runtime.
 *
 * A single compressor is not safe to use by multiple threads concurrently.
 * However, different threads may use different compressors concurrently.
 */
LIBDEFLATEAPI struct libdeflate_compressor *
libdeflate_alloc_compressor(int compression_level);

/*
 * Like libdeflate_alloc_compressor(), but adds the 'options' argument.
 */
//LIBDEFLATEAPI struct libdeflate_compressor *
//libdeflate_alloc_compressor_ex(int compression_level,
//			       const struct libdeflate_options *options);

LIBDEFLATEAPI size_t
libdeflate_gzip_compress(struct libdeflate_compressor *compressor,
			 const void *in, size_t in_nbytes,
			 void *out, size_t out_nbytes_avail);

//LIBDEFLATEAPI size_t
//libdeflate_gzip_compress_bound(struct libdeflate_compressor *compressor,
//			       size_t in_nbytes);

/*
 * libdeflate_free_compressor() frees a compressor that was allocated with
 * libdeflate_alloc_compressor().  If a NULL pointer is passed in, no action is
 * taken.
 */
LIBDEFLATEAPI void
libdeflate_free_compressor(struct libdeflate_compressor *compressor);

/* ========================================================================== */
/*                             Decompression                                  */
/* ========================================================================== */

struct libdeflate_decompressor;
struct libdeflate_options;

/*
 * libdeflate_alloc_decompressor() allocates a new decompressor that can be used
 * for DEFLATE, zlib, and gzip decompression.  The return value is a pointer to
 * the new decompressor, or NULL if out of memory.
 *
 * This function takes no parameters, and the returned decompressor is valid for
 * decompressing data that was compressed at any compression level and with any
 * sliding window size.
 *
 * A single decompressor is not safe to use by multiple threads concurrently.
 * However, different threads may use different decompressors concurrently.
 */
LIBDEFLATEAPI struct libdeflate_decompressor *
libdeflate_alloc_decompressor(void);

/*
 * Like libdeflate_alloc_decompressor(), but adds the 'options' argument.
 */
//LIBDEFLATEAPI struct libdeflate_decompressor *
//libdeflate_alloc_decompressor_ex(const struct libdeflate_options *options);

/*
 * Result of a call to libdeflate_deflate_decompress(),
 * libdeflate_zlib_decompress(), or libdeflate_gzip_decompress().
 */
enum libdeflate_result {
	/* Decompression was successful.  */
	LIBDEFLATE_SUCCESS = 0,

	/* Decompression failed because the compressed data was invalid,
	 * corrupt, or otherwise unsupported.  */
	LIBDEFLATE_BAD_DATA = 1,

	/* A NULL 'actual_out_nbytes_ret' was provided, but the data would have
	 * decompressed to fewer than 'out_nbytes_avail' bytes.  */
	LIBDEFLATE_SHORT_OUTPUT = 2,

	/* The data would have decompressed to more than 'out_nbytes_avail'
	 * bytes.  */
	LIBDEFLATE_INSUFFICIENT_SPACE = 3,
};

/*
 * libdeflate_deflate_decompress() decompresses a DEFLATE stream from the buffer
 * 'in' with compressed size up to 'in_nbytes' bytes.  The uncompressed data is
 * written to 'out', a buffer with size 'out_nbytes_avail' bytes.  If
 * decompression succeeds, then 0 (LIBDEFLATE_SUCCESS) is returned.  Otherwise,
 * a nonzero result code such as LIBDEFLATE_BAD_DATA is returned, and the
 * contents of the output buffer are undefined.
 *
 * Decompression stops at the end of the DEFLATE stream (as indicated by the
 * BFINAL flag), even if it is actually shorter than 'in_nbytes' bytes.
 *
 * libdeflate_deflate_decompress() can be used in cases where the actual
 * uncompressed size is known (recommended) or unknown (not recommended):
 *
 *   - If the actual uncompressed size is known, then pass the actual
 *     uncompressed size as 'out_nbytes_avail' and pass NULL for
 *     'actual_out_nbytes_ret'.  This makes libdeflate_deflate_decompress() fail
 *     with LIBDEFLATE_SHORT_OUTPUT if the data decompressed to fewer than the
 *     specified number of bytes.
 *
 *   - If the actual uncompressed size is unknown, then provide a non-NULL
 *     'actual_out_nbytes_ret' and provide a buffer with some size
 *     'out_nbytes_avail' that you think is large enough to hold all the
 *     uncompressed data.  In this case, if the data decompresses to less than
 *     or equal to 'out_nbytes_avail' bytes, then
 *     libdeflate_deflate_decompress() will write the actual uncompressed size
 *     to *actual_out_nbytes_ret and return 0 (LIBDEFLATE_SUCCESS).  Otherwise,
 *     it will return LIBDEFLATE_INSUFFICIENT_SPACE if the provided buffer was
 *     not large enough but no other problems were encountered, or another
 *     nonzero result code if decompression failed for another reason.
 */
//LIBDEFLATEAPI enum libdeflate_result
//libdeflate_deflate_decompress(struct libdeflate_decompressor *decompressor,
//			      const void *in, size_t in_nbytes,
//			      void *out, size_t out_nbytes_avail,
//			      size_t *actual_out_nbytes_ret);

/*
 * Like libdeflate_deflate_decompress(), but adds the 'actual_in_nbytes_ret'
 * argument.  If decompression succeeds and 'actual_in_nbytes_ret' is not NULL,
 * then the actual compressed size of the DEFLATE stream (aligned to the next
 * byte boundary) is written to *actual_in_nbytes_ret.
 */
enum libdeflate_result
libdeflate_deflate_decompress_ex(struct libdeflate_decompressor *decompressor,
				 const void *in, size_t in_nbytes,
				 void *out, size_t out_nbytes_avail,
				 size_t *actual_in_nbytes_ret,
				 size_t *actual_out_nbytes_ret);

/*
 * Like libdeflate_deflate_decompress(), but assumes the gzip wrapper format
 * instead of raw DEFLATE.
 *
 * If multiple gzip-compressed members are concatenated, then only the first
 * will be decompressed.  Use libdeflate_gzip_decompress_ex() if you need
 * multi-member support.
 */
LIBDEFLATEAPI enum libdeflate_result
libdeflate_gzip_decompress(struct libdeflate_decompressor *decompressor,
			   const void *in, size_t in_nbytes,
			   void *out, size_t out_nbytes_avail);
			   

/*
 * Like libdeflate_gzip_decompress(), but adds the 'actual_in_nbytes_ret'
 * argument.  If 'actual_in_nbytes_ret' is not NULL and the decompression
 * succeeds (indicating that the first gzip-compressed member in the input
 * buffer was decompressed), then the actual number of input bytes consumed is
 * written to *actual_in_nbytes_ret.
 */
//LIBDEFLATEAPI enum libdeflate_result
//libdeflate_gzip_decompress_ex(struct libdeflate_decompressor *decompressor,
//			      const void *in, size_t in_nbytes,
//			      void *out, size_t out_nbytes_avail,
//			      size_t *actual_in_nbytes_ret,
//			      size_t *actual_out_nbytes_ret);

/*
 * libdeflate_free_decompressor() frees a decompressor that was allocated with
 * libdeflate_alloc_decompressor().  If a NULL pointer is passed in, no action
 * is taken.
 */
LIBDEFLATEAPI void
libdeflate_free_decompressor(struct libdeflate_decompressor *decompressor);

/*
 * Advanced options.  This is the options structure that
 * libdeflate_alloc_compressor_ex() and libdeflate_alloc_decompressor_ex()
 * require.  Most users won't need this and should just use the non-"_ex"
 * functions instead.  If you do need this, it should be initialized like this:
 *
 *	struct libdeflate_options options;
 *
 *	__builtin_memset(&options, 0, sizeof(options));
 *	options.sizeof_options = sizeof(options);
 *	// Then set the fields that you need to override the defaults for.
 */
struct libdeflate_options {
	/*
	 * This field must be set to the struct size.  This field exists for
	 * extensibility, so that fields can be appended to this struct in
	 * future versions of libdeflate while still supporting old binaries.
	 */
	size_t sizeof_options;
};

#ifdef __cplusplus
}
#endif

#endif /* LIBDEFLATE_H */
