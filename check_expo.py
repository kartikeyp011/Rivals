import psutil

def check_expo_processes():
    found = False
    for p in psutil.process_iter(['pid', 'name', 'cmdline', 'cwd']):
        try:
            cmd = " ".join(p.info['cmdline'] or [])
            if 'node' in (p.info['name'] or '').lower() or 'node' in cmd.lower():
                if 'expo' in cmd.lower() or 'metro' in cmd.lower():
                    found = True
                    print(f"PID: {p.info['pid']}")
                    print(f"CWD: {p.info['cwd']}")
                    print(f"CMD: {cmd}")
                    print("-" * 40)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    if not found:
        print("No Expo/Metro node processes found.")

if __name__ == '__main__':
    check_expo_processes()
