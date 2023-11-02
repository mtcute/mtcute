#include <assert.h>
#include <node_api.h>
#include "ige256.h"

#ifndef NODE_GYP_MODULE_NAME
#define NODE_GYP_MODULE_NAME crypto
#endif

// maybe i love macros a bit too much

#define CALL_ASSERT_OK(code) \
    status = code; \
    assert(status == napi_ok);

#define THROW_WRONG_ARGS \
    napi_throw_type_error(env, NULL, "Wrong arguments"); \
    return NULL;

#define CHECK_ARG_COUNT(cnt) \
    if (argc < cnt) { \
        THROW_WRONG_ARGS \
    }

#define CHECK_ARG_BUFFER(idx) \
    CALL_ASSERT_OK(napi_is_buffer(env, args[idx], &is_buf)) \
    if (!is_buf) { \
        THROW_WRONG_ARGS \
    }

#define READ_BUF_ARG(idx, out_buf, out_size) \
    CALL_ASSERT_OK(napi_get_buffer_info(env, args[idx], (void**) out_buf, out_size))

#define READ_BOOL_ARG(idx, out) \
    CALL_ASSERT_OK(napi_get_value_bool(env, args[idx], out))

#define READ_ARGS(n) \
    size_t argc = n; \
    napi_value args[n]; \
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL); \
    assert(status == napi_ok);

#define WRAP_KEY_IV_METHOD(name, ivSize) \
    static napi_value node_##name(napi_env env, napi_callback_info info) { \
        napi_status status; \
        bool is_buf; \
\
        uint8_t* input_buf; \
        uint8_t* key_buf; \
        uint8_t* iv_buf; \
        uint8_t* output_buf; \
\
        size_t size; \
\
        READ_ARGS(3) \
\
        CHECK_ARG_COUNT(3) \
        CHECK_ARG_BUFFER(0) \
        CHECK_ARG_BUFFER(1) \
        CHECK_ARG_BUFFER(2) \
\
        READ_BUF_ARG(1, &key_buf, &size); \
        if (size != 32) { \
            THROW_WRONG_ARGS \
        } \
        READ_BUF_ARG(2, &iv_buf, &size); \
        if (size != ivSize) { \
            THROW_WRONG_ARGS \
        } \
        READ_BUF_ARG(0, &input_buf, &size); \
        if (size % 16 != 0) { \
            THROW_WRONG_ARGS \
        } \
\
        napi_value ret; \
        CALL_ASSERT_OK(napi_create_buffer(env, size, (void**) &output_buf, &ret)); \
\
        name(env, input_buf, size, key_buf, iv_buf, output_buf); \
\
        return ret; \
    }

WRAP_KEY_IV_METHOD(ige256_encrypt, 32)
WRAP_KEY_IV_METHOD(ige256_decrypt, 32)


#define DECLARE_NAPI_METHOD(name, func) \
    { name, 0, func, 0, 0, 0, napi_default, 0 }

#define EXPORT_METHOD(name, func) \
    desc = DECLARE_NAPI_METHOD(name, func); \
    CALL_ASSERT_OK(napi_define_properties(env, exports, 1, &desc));

static napi_value Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_property_descriptor desc;

    // nodejs is bundled with openssl, thus the only
    // mode that it makes sense to implement in native code is
    // IGE, since it is not implemented by openssl.
    // 
    // benchmarks have shown that openssl is much faster
    // than this implementation for cbc and ctr modes.    
    EXPORT_METHOD("ige256_encrypt", node_ige256_encrypt)
    EXPORT_METHOD("ige256_decrypt", node_ige256_decrypt)
    
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
