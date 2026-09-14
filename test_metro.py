import urllib.request
import re

def test_metro_bundle():
    url = "http://localhost:8081/src/lib/supabase.bundle?platform=android&dev=true&minify=false"
    try:
        req = urllib.request.urlopen(url)
        content = req.read().decode('utf-8')
        
        print("Successfully fetched bundle from Metro.")
        # Search for the variables
        if "EXPO_PUBLIC_SUPABASE_URL" in content:
            print("Found EXPO_PUBLIC_SUPABASE_URL string in bundle.")
        else:
            print("EXPO_PUBLIC_SUPABASE_URL NOT found in bundle.")
            
        if "uhybopkoomacdybcqahc" in content:
            print("Found the actual SUPABASE_URL value in the bundle!")
        else:
            print("Did NOT find the actual SUPABASE_URL value in the bundle.")
            
        # Let's extract the relevant code block
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if "Missing Supabase environment variables" in line:
                start = max(0, i - 15)
                end = min(len(lines), i + 15)
                print("\n--- Code snippet from bundle ---")
                for j in range(start, end):
                    print(lines[j])
                print("--------------------------------\n")
                break
                
    except Exception as e:
        print(f"Failed to fetch from Metro: {e}")

if __name__ == '__main__':
    test_metro_bundle()
