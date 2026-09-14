import os

def find_in_bundle():
    dist_dir = r"c:\rivals_2\mobile\dist\_expo\static\js\android"
    if not os.path.exists(dist_dir):
        print("Bundle directory not found.")
        return
        
    for f in os.listdir(dist_dir):
        if f.endswith('.hbc') or f.endswith('.js'):
            filepath = os.path.join(dist_dir, f)
            with open(filepath, 'rb') as file:
                content = file.read()
                
                print(f"--- Checking {f} ---")
                
                # Check for the raw variable names
                if b"EXPO_PUBLIC_SUPABASE_URL" in content:
                    print("Found 'EXPO_PUBLIC_SUPABASE_URL' (un-inlined variable reference!)")
                else:
                    print("Did not find 'EXPO_PUBLIC_SUPABASE_URL'.")
                    
                if b"EXPO_PUBLIC_SUPABASE_ANON_KEY" in content:
                    print("Found 'EXPO_PUBLIC_SUPABASE_ANON_KEY' (un-inlined variable reference!)")
                else:
                    print("Did not find 'EXPO_PUBLIC_SUPABASE_ANON_KEY'.")
                
                # Check for the actual URL value
                if b"uhybopkoomacdybcqahc.supabase.co" in content:
                    print("Found actual SUPABASE_URL value in the bundle! It WAS correctly inlined/exported.")
                else:
                    print("Did not find actual SUPABASE_URL value.")
                    
                # Check for the missing variable error string
                if b"Missing Supabase environment variables" in content:
                    print("Found 'Missing Supabase environment variables' error string.")
                print("----------------------\n")

if __name__ == '__main__':
    find_in_bundle()
