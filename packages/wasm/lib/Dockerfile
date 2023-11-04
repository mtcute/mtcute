FROM alpine:3.18.4 AS build

WORKDIR /src

RUN apk add --no-cache lld make clang16 binaryen

COPY crypto /src/crypto
COPY libdeflate /src/libdeflate
COPY *.h *.c Makefile /src/

RUN ZLIB_COMPRESSION_API=1 GZIP_DECOMPRESSION_API=1 IGE_API=1 CTR_API=1 make

FROM scratch AS binaries
COPY --from=build /src/mtcute.wasm /
