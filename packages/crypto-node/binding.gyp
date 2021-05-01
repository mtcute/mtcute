{
    "targets": [
        {
            "target_name": "crypto",
            "sources": [
                "../crypto/aes256.c",
                "../crypto/aes256.h",
                "../crypto/ige256.c",
                "../crypto/ige256.h",
                "lib/entry.cpp",
            ],
            "cflags_cc": [
                "-std=c++17"
            ]
        }
    ]
}
