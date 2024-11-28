## How it works

### Data name

TDesktop allows for multiple "data names", which is basically
a prefix for data storage. Default one is `data`, but you can choose
any using `-key` CLI parameter.

### Local key

TDesktop uses something called "local key" to encrypt most of the files.
The local key itself is stored in `key_datas`, where `data` is the default 
data name. That file can be passcode-protected, in which case you will
need a correct passcode to decrypt it.

### Encryption

Without going too deep into details, encryption used is the same
as the one used in MTProto v1 for message encryption (see 
[Telegram docs](https://core.telegram.org/mtproto/description_v1#defining-aes-key-and-initialization-vector) 
for details). 

There, instead of `auth_key` a local key is used, and instead of
`msg_key` lower 16 bytes of sha1 of the contents are used.

Before encrypting (and computing sha1), content size is prepended, and
the result is padded.

### File naming

To name different files, TDesktop uses 8 lower bytes of md5 hash,
with nibbles switched (i.e. `0xFE => 0xEF`).

So, for example:

```typescript
const filename = 'data'
const md5 = crypto.md5(filename) // 8d777f385d3dfec8815d20f7496026dc 
const md5Lower = md5.slice(0, 8) // 8d777f385d3dfec8
const result = swap8(md5Lower).toUpperHex() // D877F783D5D3EF8C
```

`D877F783D5D3EF8C` is the folder that is most likely present in your
`tdata` folder, which is derived simply from `data` and is used
for your first account data.

### Multi accounts

For second, third, etc. accounts, TDesktop appends `#2`, `#3` etc. 
to the base data name respectively.

### MTProto auth keys

Auth keys are stored in a file named same as account data folder but with
`s` appended. So, for the first account that would be `D877F783D5D3EF8Cs`.