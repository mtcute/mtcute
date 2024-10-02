## updating checklist

updating a schema and keeping up to date with telegram is a bit of a headache, 
so here's a checklist to help me (and maybe you) out:

### common steps
- run `pnpm run fetch-and-gen`
- look at the diff in `diff.json` for `long` types, make sure to update `data/int53-overrides.json` if needed
- run `pnpm run fetch-and-gen` again if there were any changes (note that this will overwrite diff.json file so you may want to have a copy of it)
- run `pnpm run -w lint:tsc` to make sure everything typechecks, if not – fix it.

### type-specific steps

#### message-related updates

if there were changes to message-related `Update`-s, make sure to update `_fetchMissingPeers` 
in updates manager to accomodate for any new fields.

note that this also aplies to any types used inside them, including but not limited to:
- `messageAction*`
- `messageMedia*`
- `messageReply*Header`, `messageForwardHeader`, etc.
- `messageEntity*`

#### peer-related updates

if there were changes to `user` or `channel`, make sure to update `service/peers.ts` min updating
logic to accomodate for any new fields. 
