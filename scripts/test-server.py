
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

try:
    print("re-importing backend.main...")
    from backend.main import app
    print("\n✅ Successfully imported app from backend.main")
    
    print("\n📍 Registered Routes:")
    for rule in app.url_map.iter_rules():
        print(f" - {rule} ({','.join(rule.methods)})")
        
    print("\n🚀 Try running the server with:")
    print("python -u backend/main.py")
    
except ImportError as e:
    print(f"\n❌ ImportError: {e}")
    print("Make sure you are running this from the root 'e:\\Projects\\skeptek'")
except Exception as e:
    print(f"\n❌ Error: {e}")
