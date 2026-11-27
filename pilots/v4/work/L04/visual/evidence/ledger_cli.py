"""Enter interactive mode with python3 -q -i ledger_cli.py to inspect the synthetic ledger."""
import csv
from pathlib import Path
base=Path(__file__).resolve().parent
with (base/'spend.csv').open() as file:
    rows=list(csv.DictReader(file))
with (base/'pull_requests.csv').open() as file:
    eligible=sum(row['cohort']=='pilot' and row['eligible']=='1' for row in csv.DictReader(file))
amounts=[int(row['usd']) for row in rows]
import json
cap=json.loads((base/'case.json').read_text())['limits']['spend']
print('spend.csv')
for row in rows: print(f" {row['line']}   {row['item']:<22}  ${int(row['usd']):>3}")
print(f'Cap  ${cap}      Eligible requests  {eligible}')
