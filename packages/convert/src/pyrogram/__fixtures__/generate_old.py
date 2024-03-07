# pip install pyrogram==1.4.16
# also it needs to be patched a bit because its broken smh
from pyrogram import Client, filters
import asyncio
import os
import logging

logging.basicConfig(level=logging.DEBUG)

async def main():
    async with Client(
        ":memory:",
        api_id=int(os.environ["API_ID"]),
        api_hash=os.environ["API_HASH"],
        test_mode=True,
        phone_number="9996621234",
        phone_code="22222"
    ) as app:
        session = await app.export_session_string()
        open("session_old.ts", "w").write(
            'export const PYROGRAM_TEST_SESSION_OLD = \'' + session + '\'\n'
        )

asyncio.get_event_loop().run_until_complete(main())