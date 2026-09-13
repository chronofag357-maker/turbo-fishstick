"""Transfer only BOT_TOKEN over SSH stdin; never log or pass it as an argument."""
import json
import subprocess
from pathlib import Path
from dotenv import dotenv_values

token = dotenv_values(Path(__file__).resolve().parents[1] / '.env').get('BOT_TOKEN')
if not token or ':' not in token:
    raise SystemExit('Missing BOT_TOKEN')
remote = r'''
import sys,json,re,os,sqlite3
from pathlib import Path
from datetime import datetime,timezone
token=json.load(sys.stdin)['token']
root=Path('/opt/freebk/app')
backup=Path('/opt/freebk/backups')/('bot-switch-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
backup.mkdir(parents=True,mode=0o700)
env=root/'.env'
old=env.read_text()
(backup/'env.previous').write_text(old)
os.chmod(backup/'env.previous',0o600)
db=root/'bot.db'
if db.exists():
 with sqlite3.connect(db) as src,sqlite3.connect(backup/'bot.db') as dst: src.backup(dst)
new,n=re.subn(r'^BOT_TOKEN=.*$',lambda m:'BOT_TOKEN='+token,old,flags=re.M)
if n!=1: raise SystemExit('Expected exactly one BOT_TOKEN; unchanged')
other=root/'.env.esports'
if other.exists() and re.search(r'^BOT_TOKEN=',other.read_text(),re.M): raise SystemExit('Token override found; unchanged')
tmp=root/'.env.next'
tmp.write_text(new)
os.chmod(tmp,0o600)
st=env.stat();os.chown(tmp,st.st_uid,st.st_gid)
os.replace(tmp,env)
print('Token updated; backup:',backup)
'''
import shlex
result=subprocess.run(['ssh','-i',str(Path.home()/'.ssh/freebk_beget_ed25519'),'-o','BatchMode=yes','-o','ConnectTimeout=15','root@159.194.244.46','python3 -c '+shlex.quote(remote)],input=json.dumps({'token':token}),text=True,capture_output=True)
print(result.stdout,end='')
if result.returncode:
    print('Token transfer failed (details suppressed to protect credentials).')
raise SystemExit(result.returncode)
