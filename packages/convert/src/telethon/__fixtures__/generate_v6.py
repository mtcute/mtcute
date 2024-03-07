from telethon.sync import TelegramClient
from telethon.sessions import StringSession
import os
import asyncio
import logging

# logging.basicConfig(level=logging.DEBUG)

async def main():
    client = TelegramClient(
        StringSession(), 
        api_id=int(os.environ["API_ID"]),
        api_hash=os.environ["API_HASH"],
        use_ipv6=True
    )
    client.session.set_dc(1, '2001:0b28:f23d:f001:0000:0000:0000:000e', 443)
    await client.start(
        phone='9996611234',
        code_callback=lambda: '11111'
    )
    session = client.session.save()
    open("session_v6.ts", "w").write(
        'export const TELETHON_TEST_SESSION_V6 = \'' + session + '\'\n'
    )

asyncio.get_event_loop().run_until_complete(main())