.PHONY: all clean

SOURCES = utils/allocator.c \
	libdeflate/allocator.c \
	libdeflate/deflate_compress.c \
	libdeflate/deflate_decompress.c \
	libdeflate/gzip_decompress.c \
	libdeflate/zlib_compress.c \
	libdeflate/adler32.c \
	crypto/aes256.c \
	crypto/ige256.c \
	crypto/ctr256.c \
	hash/sha256.c \
	hash/sha1.c

WASM_CC ?= clang
CC := $(WASM_CC)

CFLAGS_WASM := \
	-target wasm32-unknown-unknown \
	-nostdlib -ffreestanding -DFREESTANDING \
	-mbulk-memory \
	-msimd128 \
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

OUT := ../mtcute.wasm

$(OUT): $(SOURCES)
	$(CC) $(CFLAGS) -I . -I utils -o $@ $^

clean:
	rm -f $(OUT)

all: $(OUT)
