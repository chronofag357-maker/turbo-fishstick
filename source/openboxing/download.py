"""Explicit manual import of public Open Boxing data, not used by the live feed."""
import json
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parent
def main():
    report={'checked_at':datetime.now(timezone.utc).isoformat(),'datasets':{}}
    for endpoint in ['bouts/scheduled.json','bouts/all.json','champions/all.json','reigns/all.json']:
        url='https://openboxing.org/api/'+endpoint
        try:
            with urllib.request.urlopen(url,timeout=30) as response:
                data=json.load(response)
            if not isinstance(data,list):raise ValueError('Expected a list')
            filename=endpoint.replace('/','-')
            (ROOT/filename).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
            dates=sorted(r['date'] for r in data if isinstance(r,dict) and r.get('date'))
            result={'url':url,'file':filename,'count':len(data),'earliest_date':dates[0] if dates else None,'latest_date':dates[-1] if dates else None}
            report['datasets'][endpoint]=result
            print(endpoint,result['count'],result['earliest_date'],result['latest_date'])
        except Exception as exc:
            report['datasets'][endpoint]={'url':url,'error':type(exc).__name__}
            print(endpoint,type(exc).__name__)
    (ROOT/'import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':main()
