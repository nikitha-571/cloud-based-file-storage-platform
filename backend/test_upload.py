from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"🔗 URL: {SUPABASE_URL}")
print(f"🔑 Key: {SUPABASE_KEY[:20]}...")

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # List buckets
    buckets = supabase.storage.list_buckets()
    print(f"✅ Connected! Buckets: {[b['name'] for b in buckets]}")

    # Check if user-files exists
    user_files_exists = any(b['name'] == 'user-files' for b in buckets)
    if user_files_exists:
        print("✅ 'user-files' bucket exists")
    else:
        print("❌ 'user-files' bucket NOT FOUND - Please create it!")

    # Try to upload a test file
    test_content = b"Hello World Test"
    result = supabase.storage.from_('user-files').upload(
        'test/test.txt',
        test_content,
        {"content-type": "text/plain", "upsert": "true"}
    )
    print(f"✅ Test upload successful: {result}")

    # Delete test file
    supabase.storage.from_('user-files').remove(['test/test.txt'])
    print("✅ Test file cleaned up")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    print(traceback.format_exc())