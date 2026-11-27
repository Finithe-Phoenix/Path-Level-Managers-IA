"""Write an editable Calc/Excel workbook from the two public CSVs."""
import csv
import json
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter
ROOT=Path(__file__).resolve().parent
with (ROOT/'pull_requests.csv').open() as f:requests=list(csv.reader(f))
with (ROOT/'spend.csv').open() as f:spend=list(csv.DictReader(f))
book=Workbook();w=book.active;w.title='Spend';raw=book.create_sheet('Requests')
for i,row in enumerate(requests):
    raw.append([int(v) if i and j in [3,4,5,6,7,8,10,11] else v for j,v in enumerate(row)])
raw.freeze_panes='C2';raw.auto_filter.ref=raw.dimensions
for i,x in enumerate(requests[0],1):raw.column_dimensions[get_column_letter(i)].width=min(42,max(15,len(x)+3))
w.append(['Pilot review / incremental spend']);w.append(['Public synthetic teaching case']);w.append([])
w.append(['Line','Expense','USD'])
for r in spend:w.append([r['line'],r['item'],int(r['usd'])])
w.append(['','Total','=SUM(C5:C7)'])
w.append(['','Cap',json.loads((ROOT/'case.json').read_text())['limits']['spend']])
w.append(['','Remaining','=C9-C8'])
w.append(['','Eligible pilot requests','=COUNTIFS(Requests!B2:B81,"pilot",Requests!D2:D81,1)'])
w.append(['','Cost per request','=C8/C11'])
for cell in [*w[4],*raw[1]]:cell.font=Font(bold=True,color='FFFFFF');cell.fill=PatternFill('solid',fgColor='214FBB')
for i in [5,6,7,8,9,10,12]:w.cell(i,3).number_format='"$"#,##0.00'
w['A1'].font=Font(bold=True,size=20,color='122435');w['A2'].font=Font(italic=True,color='506374')
w.column_dimensions['A'].width=18;w.column_dimensions['B'].width=34;w.column_dimensions['C'].width=17
for r in range(4,13):w.row_dimensions[r].height=25
w.freeze_panes='A5';w.sheet_view.zoomScale=130
book.save(ROOT/'pilot-ledger.xlsx')
