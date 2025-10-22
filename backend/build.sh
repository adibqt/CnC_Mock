#!/usr/bin/env bash
# Render build script

set -o errexit

# Install FFmpeg
apt-get update
apt-get install -y ffmpeg

# Install Python dependencies
pip install --no-cache-dir -r requirements.txt

# Verify FFmpeg installation
ffmpeg -version || echo "FFmpeg installation failed"
