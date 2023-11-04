.PHONY: all clean

DEFAULT_API ?= 0

DEFLATE_COMPRESSION_API ?= $(DEFAULT_API)
DEFLATE_DECOMPRESSION_API ?= $(DEFAULT_API)
GZIP_COMPRESSION_API ?= $(DEFAULT_API)
GZIP_DECOMPRESSION_API ?= $(DEFAULT_API)
ZLIB_COMPRESSION_API ?= $(DEFAULT_API)
ZLIB_DECOMPRESSION_API ?= $(DEFAULT_API)
CRC32_API ?= $(DEFAULT_API)
ADLER32_API ?= $(DEFAULT_API)
IGE_API ?= $(DEFAULT_API)
CTR_API ?= $(DEFAULT_API)

CRC32 ?= 0

LOGGING ?= 0

_DEFLATE_COMPRESSION := 1
_DEFLATE_DECOMPRESSION := 1
_ADLER32 := $(findstring 1, $(ZLIB_COMPRESSION_API)$(ZLIB_DECOMPRESSION_API))
_AES := $(findstring 1, $(IGE_API)$(CTR_API))

SOURCES = utils.c \
	$(if $(filter 1, $(_DEFLATE_COMPRESSION)), libdeflate/deflate_compress.c) \
	$(if $(filter 1, $(_DEFLATE_DECOMPRESSION)), libdeflate/deflate_decompress.c) \
	$(if $(filter 1, $(GZIP_COMPRESSION_API)), libdeflate/gzip_compress.c) \
	$(if $(filter 1, $(GZIP_DECOMPRESSION_API)), libdeflate/gzip_decompress.c) \
	$(if $(filter 1, $(ZLIB_COMPRESSION_API)), libdeflate/zlib_compress.c) \
	$(if $(filter 1, $(ZLIB_DECOMPRESSION_API)), libdeflate/zlib_decompress.c) \
	$(if $(filter 1, $(CRC32)), libdeflate/crc32.c) \
	$(if $(filter 1, $(_ADLER32)), libdeflate/adler32.c) \
	$(if $(filter 1, $(_AES)), crypto/aes256.c) \
	$(if $(filter 1, $(IGE_API)), crypto/ige256.c) \
	$(if $(filter 1, $(CTR_API)), crypto/ctr256.c)

WASM_CC ?= clang
CC := $(WASM_CC)

CFLAGS_WASM := \
	-target wasm32-unknown-unknown \
	-nostdlib -ffreestanding -DFREESTANDING \
	$(if $(filter 1, $(LOGGING)), -DLOGGING) \
	-mbulk-memory \
	-Wl,--no-entry,--export-dynamic,--lto-O3

CFLAGS := $(CFLAGS_WASM) \
	-O3 \
	-Qn \
	-DNDEBUG \
	-mno-exception-handling \
	-fdelete-null-pointer-checks \
	-fno-stack-protector \
	-flto=full \
	-fdata-sections \
	-ffunction-sections \
	-Wl,--gc-sections \
	-fno-inline \
	-fno-unroll-loops

ifneq ($(OS),Windows_NT)
    UNAME_S := $(shell uname -s)
	ifeq ($(UNAME_S),Darwin)
		export PATH := /opt/homebrew/opt/llvm/bin/:$(PATH)
    endif
endif

OUT := mtcute.wasm

$(OUT): $(SOURCES)
	$(CC) $(CFLAGS) -I . -o $@ $^

clean:
	rm -f $(OUT)

all: $(OUT)
