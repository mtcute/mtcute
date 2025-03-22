# @mtcute/file-id

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_file-id.html)

This package is used internally by `@mtcute/core` to parse, serialize
and manipulate TDLib and Bot API compatible File IDs, but can also be used
for any other purposes.

## Acknowledgements
This is basically a port of a portion of TDLib APIs, but greatly
simplified in usage and made to work seamlessly with the rest of the
mtcute APIs.

This is a list of files from TDLib repository, from which most of the code was taken:
 - [td/telegram/files/FileManager.cpp](https://github.com/tdlib/td/blob/master/td/telegram/files/FileManager.cpp)
 - [td/telegram/files/FileLocation.hpp](https://github.com/tdlib/td/blob/master/td/telegram/files/FileLocation.hpp)
 - [td/telegram/PhotoSizeSource.h](https://github.com/tdlib/td/blob/master/td/telegram/PhotoSizeSource.h)
 - [td/telegram/PhotoSizeSource.hpp](https://github.com/tdlib/td/blob/master/td/telegram/PhotoSizeSource.hpp)
 - [td/telegram/Version.h](https://github.com/tdlib/td/blob/master/td/telegram/Version.h)

Additionally, some of the test cases were taken from a similar Python
library, [luckydonald/telegram_file_id](https://github.com/luckydonald/telegram_file_id)
