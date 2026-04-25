import os, pandas as pd, sys

sys.stdout.reconfigure(encoding='utf-8')
xlsx_file = None
for root, _, files in os.walk('.'):
    for f in files:
        if f.endswith('.xlsx') and not f.startswith('~'):
            xlsx_file = os.path.join(root, f)
            break
    if xlsx_file: break

if xlsx_file:
    xl = pd.ExcelFile(xlsx_file)
    print(f"File found: {xlsx_file}")
    
    with open("excel_summary.txt", "w", encoding="utf-8") as f:
        f.write(f"Total Sheets: {len(xl.sheet_names)}\n")
        f.write(f"Sheet List: {xl.sheet_names}\n\n")
        for s in xl.sheet_names:
            df = xl.parse(s, nrows=1)
            f.write(f"--- Sheet: {s} ---\n")
            f.write(f"Headers: {list(df.columns)}\n\n")
    print("Summary written to excel_summary.txt")
else:
    print("No excel file found.")
