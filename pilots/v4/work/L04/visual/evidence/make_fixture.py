"""Generate the public, invented inputs to L04. No repository or employee data is used."""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent
baseline_wait = [3,4,6,7,8,9,9,10,11,11,12,12,13,13,14,14,15,16,16,17,19,19,20,20,20,21,21,22,23,24,25,25,26,27,28,30,32,34,36,40]
pilot_wait = [2,3,4,5,5,6,6,7,7,8,8,8,9,9,10,10,11,11,12,12,14,14,15,15,15,16,16,17,17,18,19,20,21,21,22,23,24,26,28,32]
baseline_effort = [10,12,13,14,15,15,16,17,17,18,18,19,19,20,21,21,22,22,23,24,24,25,25,26,27,27,28,28,29,30,31,32,33,34,35,36,38,40,42,45]
pilot_effort = [12,13,14,15,16,17,18,18,19,19,20,21,21,22,22,23,24,24,25,26,26,27,27,28,28,29,29,30,30,31,31,32,33,34,35,37,39,41,42,46]
flagged = {'baseline': {4,10,14,22,31,38},'pilot': {3,9,14,20,25,32,37}}
scope = {3,9,20,32}
with (ROOT/'pull_requests.csv').open('w',newline='') as f:
    w=csv.writer(f,lineterminator='\n')
    w.writerow(['pull_request','cohort','service','eligible','merged','equal_followup','business_hours_to_first_human_review','active_review_min','material_rework','rework_reason','postmerge_defect','serious_incident'])
    for cohort,wait,effort in [('baseline',baseline_wait,baseline_effort),('pilot',pilot_wait,pilot_effort)]:
        for i in range(40):
            ident=i+1; rework=ident in flagged[cohort]
            reason='out_of_scope_files' if rework and cohort=='pilot' and ident in scope else ('other_documented_reason' if rework else '')
            w.writerow([cohort[0].upper()+f'{ident:03}',cohort,'orders','1','1','1',wait[(i*13+7)%40],effort[(i*9+8)%40],int(rework),reason,int(ident==(17 if cohort=='baseline' else 21)),0])
with (ROOT/'spend.csv').open('w',newline='') as f:
    w=csv.writer(f,lineterminator='\n');w.writerow(['line','item','usd'])
    w.writerows([('01','Temporary licences',100),('02','Remote workspace',20),('03','Enablement',120)])
