"""Recalculate every measurement shown in the film from the included synthetic tables."""
import csv
import json
import statistics
import sys
from fractions import Fraction
from pathlib import Path

ROOT=Path(__file__).resolve().parent
def read(name):
    with (ROOT/name).open() as f: return list(csv.DictReader(f))
def cohort(rows,name):
    group=[r for r in rows if r['cohort']==name and all(r[k]=='1' for k in ['eligible','merged','equal_followup'])]
    def ordered(key):return sorted([{'id':r['pull_request'],'v':int(r[key])} for r in group],key=lambda r:(r['v'],r['id']))
    wait=ordered('business_hours_to_first_human_review');effort=ordered('active_review_min')
    cases=[r['pull_request'] for r in group if r['material_rework']=='1']
    return dict(n=len(group),wait=wait,effort=effort,waitMedian=statistics.median(x['v'] for x in wait),effortMedian=statistics.median(x['v'] for x in effort),
        ids=[r['pull_request'] for r in group],rework=cases,reworkPercent=float(Fraction(len(cases)*100,len(group))),
        defects=[r['pull_request'] for r in group if r['postmerge_defect']=='1'],incidents=sum(int(r['serious_incident']) for r in group),
        scope=[r['pull_request'] for r in group if r['rework_reason']=='out_of_scope_files'])
def assemble():
    rows=read('pull_requests.csv'); assert len(set(r['pull_request'] for r in rows))==80
    b,p=[cohort(rows,k) for k in ['baseline','pilot']];spend=[{'item':r['item'],'usd':int(r['usd'])} for r in read('spend.csv')];total=sum(r['usd'] for r in spend)
    fixture=json.loads((ROOT/'case.json').read_text());threshold=fixture['limits'];transfer=fixture['transfer'];n=transfer['eligible'];rework=transfer['rework']
    cap=Fraction(threshold['reworkPercent']*n,100);floor=cap.numerator//cap.denominator
    assert fixture['scopeExample']['id'] in p['scope']
    assert next(row['v'] for row in p['wait'] if row['id']==fixture['scopeExample']['id'])==fixture['scopeExample']['hours']
    assert len(p['scope'])==4 and len(p['rework'])==7 and b['waitMedian']==18 and p['waitMedian']==13
    assert (b['effortMedian'],p['effortMedian'],b['reworkPercent'],p['reworkPercent'],total)==(24,26,15,17.5,240)
    assert len(b['defects'])==len(p['defects'])==1 and b['incidents']==p['incidents']==0 and floor==7
    return dict(baseline=b,pilot=p,limits=threshold,spend=spend,totalUsd=total,perPR=total/p['n'],remainingUsd=threshold['spend']-total,
        scopeExample=fixture['scopeExample'],transfer=dict(**transfer,percent=float(Fraction(rework*100,n)),limitCount=float(cap),maxAllowed=floor,passPercent=float(Fraction(floor*100,n))))
if __name__=='__main__':
    value=json.dumps(assemble(),indent=2,ensure_ascii=False)+'\n'; out=ROOT/'scorecard.json'
    if '--check' in sys.argv:
        assert value==out.read_text(),'scorecard.json is stale; run python3 evidence/calculate.py';print('80 fixture rows, 3 ledger items, and all film calculations agree.')
    else: out.write_text(value);print(out)
