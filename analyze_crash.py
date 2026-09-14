import sys

def analyze_crash():
    with open(r"c:\rivals_2\crash.txt", "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if "FATAL EXCEPTION" in line or "AndroidRuntime" in line:
            print("Found exception around line", i)
            start = max(0, i - 5)
            end = min(len(lines), i + 30)
            for j in range(start, end):
                print(f"{j+1}: {lines[j].strip()}")
            return
            
    print("No fatal exception found.")

if __name__ == '__main__':
    analyze_crash()
