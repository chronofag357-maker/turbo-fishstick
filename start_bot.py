"""Start a temporary public Mini App and Telegram bot together. Ctrl+C stops both."""
import os
from pathlib import Path
import queue
import re
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)


def main():
    from bot.config import settings
    tunnel_exe = ROOT / ".tools" / "cloudflared.exe"
    if not tunnel_exe.exists():
        raise SystemExit("Missing .tools/cloudflared.exe. Install the official Cloudflare tunnel client first.")
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", settings.mini_app_api_port)) == 0:
            raise SystemExit("Port is occupied. Stop the previous bot before starting another instance.")
    tunnel = subprocess.Popen(
        [str(tunnel_exe), "tunnel", "--protocol", "http2", "--url", f"http://127.0.0.1:{settings.mini_app_api_port}",
         "--no-autoupdate"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace",
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    lines = queue.Queue()
    def read_output():
        for line in tunnel.stdout:
            lines.put(line)
    threading.Thread(target=read_output, daemon=True).start()
    bot = None
    try:
        print("Starting public HTTPS address...", flush=True)
        deadline = time.monotonic() + 60
        public_url = None
        registered = False
        while time.monotonic() < deadline:
            if tunnel.poll() is not None:
                raise RuntimeError("Tunnel exited; check network access to Cloudflare.")
            try:
                line = lines.get(timeout=1)
            except queue.Empty:
                continue
            match = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line)
            if match:
                public_url = match.group(0)
            if "Registered tunnel connection" in line:
                registered = True
            if public_url and registered:
                break
        if not public_url or not registered:
            raise RuntimeError("Cloudflare did not establish the tunnel within 60 seconds. Check your network.")
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        # Check the public route before replacing the Telegram menu URL.
        bot = subprocess.Popen([sys.executable, "-m", "bot.web.api"], cwd=ROOT, env=env)
        ready = False
        for attempt in range(6):
            try:
                with urllib.request.urlopen(public_url + "/api/health", timeout=5) as response:
                    ready = response.status == 200
            except (urllib.error.URLError, TimeoutError):
                pass
            if ready:
                break
            print("Waiting for public HTTPS access...", flush=True)
            time.sleep(2)
        if not ready:
            raise RuntimeError("Public HTTPS is unreachable. Telegram Mini App cannot work through this network. Use a stable HTTPS host or restore Cloudflare connectivity.")
        bot.terminate()
        bot.wait(timeout=5)
        env["MINI_APP_URL"] = public_url + "/"
        print("MINI_APP_URL=" + public_url, flush=True)
        print("Send /start in Telegram for fresh buttons. Keep this terminal open. Ctrl+C stops the bot.", flush=True)
        bot = subprocess.Popen([sys.executable, "-m", "bot.main"], cwd=ROOT, env=env)
        while bot.poll() is None:
            if tunnel.poll() is not None:
                raise RuntimeError("Tunnel stopped. Restart to restore Mini App access.")
            time.sleep(0.5)
        if bot.returncode:
            raise RuntimeError("Bot stopped with an error; see output above.")
    except KeyboardInterrupt:
        print("Stopping...")
    finally:
        for process in (bot, tunnel):
            if process and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()


if __name__ == "__main__":
    main()
