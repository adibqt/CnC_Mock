# Installing FFmpeg for Audio Processing

The AI audio recording feature requires FFmpeg to convert audio formats.

## Windows Installation (Recommended - Easy Method)

### Option 1: Using Chocolatey (Easiest)
1. Open PowerShell as Administrator
2. Install Chocolatey if you don't have it:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```
3. Install FFmpeg:
   ```powershell
   choco install ffmpeg
   ```
4. Restart your terminal

### Option 2: Manual Installation
1. Download FFmpeg from: https://www.gyan.dev/ffmpeg/builds/
2. Download the "ffmpeg-release-essentials.zip"
3. Extract to `C:\ffmpeg`
4. Add to PATH:
   - Open "Environment Variables" in Windows Settings
   - Edit "Path" variable
   - Add: `C:\ffmpeg\bin`
5. Restart your terminal

### Option 3: Using winget (Windows 11)
```powershell
winget install ffmpeg
```

## Verify Installation
After installation, verify by running:
```powershell
ffmpeg -version
```

You should see FFmpeg version information.

## Restart Backend Server
After installing FFmpeg, restart your backend server:
```powershell
cd C:\Users\USER\Desktop\CnC_Mock\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

## Testing Audio Feature
1. Go to the AI Assistant page
2. Click the microphone button
3. Speak your symptoms
4. Stop recording
5. The audio should now be transcribed successfully!

## Troubleshooting

### "ffmpeg not found" error
- Make sure FFmpeg is in your PATH
- Restart your terminal/PowerShell after installation
- Try running `ffmpeg -version` to verify

### Still not working?
The backend has been updated to handle WebM audio files from the browser and convert them to WAV format for speech recognition. If FFmpeg is properly installed and you're still having issues, check:
1. Microphone permissions in your browser
2. Backend console for detailed error messages
3. Make sure the backend server was restarted after installing FFmpeg
