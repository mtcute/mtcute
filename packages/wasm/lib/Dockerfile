FROM alpine:3.18.4 AS build

WORKDIR /src

RUN apk add --no-cache lld make clang16 binaryen

COPY crypto /src/crypto
COPY libdeflate /src/libdeflate
COPY utils /src/utils
COPY wasm.h Makefile /src/

RUN make

FROM scratch AS binaries
COPY --from=build /src/mtcute.wasm ../
