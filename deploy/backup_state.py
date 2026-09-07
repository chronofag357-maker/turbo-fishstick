"""Online SQLite backups; run daily on the VPS. Does not delete old backups."""
import json
import shutil
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path


def backup_database(source, target):
    with closing(sqlite3.connect(source.as_uri()+'?mode=ro', uri=True)) as original:
        with closing(sqlite3.connect(target)) as backup:
            original.backup(backup)
            if backup.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise RuntimeError('Backup integrity check failed')
    target.chmod(0o600)


def main():
    root = Path(__file__).resolve().parents[1]
    destination = root.parent/'backups'
    destination.mkdir(mode=0o700, exist_ok=True)
    if shutil.disk_usage(destination).free < 1024**3:
        raise RuntimeError('Less than 1 GiB free; inspect disk before continuing backups')
    folder = destination/('state-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    folder.mkdir(mode=0o700)
    for source in (root/'bot.db', root/'data'/'miniapp.sqlite3'):
        if source.exists():
            backup_database(source, folder/source.name)
    print(json.dumps({'backup': str(folder), 'integrity': 'ok'}))


if __name__ == '__main__':
    main()
