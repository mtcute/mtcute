{
    "targets": [
        {
            "target_name": "crypto",
            "sources": [
                "lib/entry.cpp",
                "lib/ige256.cpp",
            ],
            "cflags_cc": [
                "-std=c++17"
            ],
            "defines": [
                "OPENSSL_API_COMPAT=0x10100001L",
                "OPENSSL_CONFIGURED_API=0x30000000L",
            ]
        }
    ]
}
