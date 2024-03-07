from pyrogram import Client, filters
import asyncio
import os

async def main():
    async with Client(
        "my_account_test",
        api_id=int(os.environ["API_ID"]),
        api_hash=os.environ["API_HASH"],
        test_mode=True,
        in_memory=True,
        phone_number="9996621234",
        phone_code="22222"
    ) as app:
        session = await app.export_session_string()
        open("session.ts", "w").write(
            'export const PYROGRAM_TEST_SESSION = \'' + session + '\'\n'
        )

asyncio.get_event_loop().run_until_complete(main())