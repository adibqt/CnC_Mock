"""
FFmpeg Diagnostic Script
Checks if FFmpeg is properly installed and accessible
"""

import subprocess
import shutil
import os
import sys

print("=" * 60)
print("FFmpeg Installation Diagnostic")
print("=" * 60)

# Check 1: Is FFmpeg in PATH?
print("\n1. Checking if FFmpeg is in system PATH...")
ffmpeg_path = shutil.which("ffmpeg")
if ffmpeg_path:
    print(f"   ✓ FFmpeg found in PATH: {ffmpeg_path}")
else:
    print("   ✗ FFmpeg NOT found in PATH")

# Check 2: Try common installation locations
print("\n2. Checking common installation locations...")
common_paths = [
    r"C:\ffmpeg\bin\ffmpeg.exe",
    r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
    r"C:\ProgramData\chocolatey\bin\ffmpeg.exe",
    r"C:\ProgramData\chocolatey\lib\ffmpeg\tools\ffmpeg\bin\ffmpeg.exe",
]

found_in_common = False
for path in common_paths:
    if os.path.exists(path):
        print(f"   ✓ Found at: {path}")
        found_in_common = True
    else:
        print(f"   ✗ Not at: {path}")

# Check 3: Try 'where' command (Windows)
print("\n3. Using 'where' command to locate FFmpeg...")
try:
    result = subprocess.run(['where', 'ffmpeg'], capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        locations = result.stdout.strip().split('\n')
        print(f"   ✓ Found {len(locations)} location(s):")
        for loc in locations:
            print(f"      - {loc}")
    else:
        print("   ✗ 'where' command did not find FFmpeg")
except Exception as e:
    print(f"   ✗ Error running 'where' command: {e}")

# Check 4: Try to run FFmpeg
print("\n4. Attempting to run FFmpeg...")
try:
    result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        version_line = result.stdout.split('\n')[0]
        print(f"   ✓ FFmpeg is working!")
        print(f"   Version: {version_line}")
    else:
        print("   ✗ FFmpeg command failed")
        print(f"   Error: {result.stderr}")
except FileNotFoundError:
    print("   ✗ FFmpeg executable not found")
except Exception as e:
    print(f"   ✗ Error running FFmpeg: {e}")

# Check 5: Environment PATH variable
print("\n5. Checking PATH environment variable...")
path_env = os.environ.get('PATH', '')
path_dirs = path_env.split(';')
ffmpeg_in_path = [d for d in path_dirs if 'ffmpeg' in d.lower() or 'chocolatey' in d.lower()]
if ffmpeg_in_path:
    print(f"   Found {len(ffmpeg_in_path)} FFmpeg-related path(s):")
    for p in ffmpeg_in_path:
        print(f"      - {p}")
else:
    print("   ✗ No FFmpeg-related directories in PATH")

print("\n" + "=" * 60)
print("Diagnostic Summary")
print("=" * 60)

if ffmpeg_path:
    print("✓ FFmpeg is properly installed and accessible!")
    print(f"  Location: {ffmpeg_path}")
    print("\nYou can now use audio recording features.")
elif found_in_common:
    print("⚠️  FFmpeg is installed but not in PATH!")
    print("  Solution: Restart your terminal/PowerShell window")
    print("  The PATH should be updated after restarting.")
else:
    print("✗ FFmpeg is NOT installed!")
    print("\nTo install FFmpeg, run in PowerShell as Administrator:")
    print("  choco install ffmpeg -y")
    print("\nThen restart your terminal and run this script again.")

print("=" * 60)
