from telethon.sync import TelegramClient
from telethon.sessions import StringSession
import os
import asyncio

async def main():
    client = TelegramClient(
        StringSession(), 
        api_id=int(os.environ["API_ID"]),
        api_hash=os.environ["API_HASH"],
    )
    client.session.set_dc(2, '149.154.167.40', 80)
    await client.start(
        phone='9996621234',
        code_callback=lambda: '22222'
    )
    session = client.session.save()
    open("session.ts", "w").write(
        'export const TELETHON_TEST_SESSION = \'' + session + '\'\n'
    )

asyncio.get_event_loop().run_until_complete(main())