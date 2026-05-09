import base64
import os

path = r"C:\Users\AJ\.gemini\antigravity\brain\c29f01a3-cbd4-45dd-b154-ce0d9e883f98\jarfi_logo_1778350215847.png"
if os.path.exists(path):
    with open(path, "rb") as f:
        data = f.read()
        print(base64.b64encode(data).decode('utf-8'))
else:
    print("FILE_NOT_FOUND")
