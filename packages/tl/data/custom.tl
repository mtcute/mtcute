// some custom types for internal use

---types---

mtcute.dummyUpdate pts:int pts_count:int channel_id:int53 = Update;
mtcute.dummyInputPeerMinUser user_id:int = InputPeer;
mtcute.dummyInputPeerMinChannel channel_id:int = InputPeer;


---functions---
// temporary solution to allow users to call arbitrary methods not present in the schema,
// without having to override client's schema readers/writers map.
// will become redundant after esm tl rewrite
mtcute.customMethod bytes:bytes = bytes;
