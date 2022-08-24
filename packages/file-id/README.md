# `@mtcute/file-id`

![](./coverage.svg)

A package that is used internally by `@mtcute/client` to parse, serialize
and manipulate TDLib and Bot API compatible File IDs, but can also be used
for any other purposes.

## Contents
This package exports a number of functions, namely:
 - `parseFileId()` which parses provided File ID to an object representing its contents
 - `toFileId()` which serializes provided object containing file info to a File ID
 - `toUniqueFileId()` which serializes provided object containing file info to a Unique File ID
 - `fileIdTo*()` which converts a File ID to an input TL object, which can be used
   in RPC calls etc.

This package also exports namespace `tdFileId`, which contains all the types
used by the library

## Acknowledgements
This is basically a port of a portion of TDLib APIs, but greatly
simplified in usage and made to work seamlessly with the rest of the
MTCute APIs.

This is a list of files from TDLib repository, from which most of the code was taken:
 - [td/telegram/files/FileManager.cpp](https://github.com/tdlib/td/blob/master/td/telegram/files/FileManager.cpp)
 - [td/telegram/files/FileLocation.hpp](https://github.com/tdlib/td/blob/master/td/telegram/files/FileLocation.hpp)
 - [td/telegram/PhotoSizeSource.h](https://github.com/tdlib/td/blob/master/td/telegram/PhotoSizeSource.h)
 - [td/telegram/PhotoSizeSource.hpp](https://github.com/tdlib/td/blob/master/td/telegram/PhotoSizeSource.hpp)
 - [td/telegram/Version.h](https://github.com/tdlib/td/blob/master/td/telegram/Version.h)

Additionally, some of the test cases were taken from a similar Python
library, [luckydonald/telegram_file_id](https://github.com/luckydonald/telegram_file_id)
