// for internal use
---types---

dummyUpdate pts:int pts_count:int channel_id:int53 = Update;

// reactions
// taken from OLD official
// no longer work on newer layers because they changed this thing entirely
// kept only as a historical reference

// ---types---
//
// updateMessageReactions peer:Peer msg_id:int reactions:MessageReactions = Update;
// messageReactions flags:# min:flags.0?true results:Vector<ReactionCount> = MessageReactions;
// reactionCount flags:# chosen:flags.0?true reaction:string count:int = ReactionCount;
//
// messageReactionsList flags:# count:int reactions:Vector<MessageUserReaction> users:Vector<User> next_offset:flags.0?string = MessageReactionsList;
// messageUserReaction user_id:int reaction:string = MessageUserReaction;
//
// ---functions---
//
// messages.sendReaction flags:# peer:InputPeer msg_id:int reaction:flags.0?string = Updates;
// messages.getMessagesReactions peer:InputPeer id:Vector<int> = Updates;
// messages.getMessageReactionsList flags:# peer:InputPeer id:int reaction:flags.0?string offset:flags.1?string limit:int = MessageReactionsList;
