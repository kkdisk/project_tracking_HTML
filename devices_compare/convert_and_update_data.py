import pandas as pd
import json
import os
import glob
import sys
import re
from datetime import datetime

# Configuration
HTML_FILE = 'index.html'
EXCEL_PATTERN = 'machine_spec_*.xlsx'  # Pattern to find the specification file

def get_latest_excel_file():
    """Finds the latest machine_spec Excel file in the current directory."""
    files = glob.glob(EXCEL_PATTERN)
    if not files:
        # Fallback to check other likely names if the pattern doesn't match
        files = glob.glob('*.xlsx')
        
    if not files:
        return None
        
    # Sort by modification time, newest first
    files.sort(key=os.path.getmtime, reverse=True)
    return files[0]

def update_default_data(excel_path):
    print(f"Processing Excel file: {excel_path}")
    
    try:
        # 1. Read Excel file
        # header=None because the JS logic expects a raw 2D array including the header row
        df = pd.read_excel(excel_path, header=None)
        
        # Replace NaN with empty string to ensure valid JSON and consistent types
        df = df.fillna("")
        
        # Convert to list of lists (2D array)
        data = df.values.tolist()
        
        # Preprocess: Replace actual newlines in cell values with escaped \\n
        # This is critical because Excel cells may contain line breaks
        for i, row in enumerate(data):
            for j, cell in enumerate(row):
                if isinstance(cell, str) and ('\n' in cell or '\r' in cell):
                    # Replace actual newlines with escaped newline sequence
                    data[i][j] = cell.replace('\r\n', '\\n').replace('\r', '\\n').replace('\n', '\\n')
        
        # Convert to JSON string
        new_data_str = json.dumps(data, ensure_ascii=False)
        
    except Exception as e:
        print(f"Error processing Excel file: {e}")
        return False

    # 2. Update HTML file
    print(f"Updating {HTML_FILE}...")
    
    try:
        if not os.path.exists(HTML_FILE):
             print(f"Error: {HTML_FILE} not found.")
             return False

        with open(HTML_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update defaultData - use DOTALL flag to match across newlines
        default_data_pattern = r'const defaultData = \[\[.*?\]\];'
        if re.search(default_data_pattern, content, re.DOTALL):
            content = re.sub(default_data_pattern, f'const defaultData = {new_data_str};', content, flags=re.DOTALL)
            print("Found and replaced 'defaultData' variable.")
        else:
            print(f"Error: Could not find 'const defaultData = [[' line in {HTML_FILE}.")
            return False
        
        # Update DATA_UPDATE_DATE with today's date
        today_str = datetime.now().strftime("%Y-%m-%d")
        date_pattern = r'const DATA_UPDATE_DATE = "[^"]+";'
        if re.search(date_pattern, content):
            content = re.sub(date_pattern, f'const DATA_UPDATE_DATE = "{today_str}";', content)
            print(f"Updated DATA_UPDATE_DATE to: {today_str}")
        else:
            print("Warning: Could not find DATA_UPDATE_DATE variable.")
            
        # Write changes back to file
        with open(HTML_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print("Successfully updated index.html")
        return True

    except Exception as e:
        print(f"Error updating HTML file: {e}")
        return False

if __name__ == "__main__":
    # You can pass a specific filename as an argument, or let it auto-discover
    if len(sys.argv) > 1:
        target_excel = sys.argv[1]
    else:
        target_excel = get_latest_excel_file()
        
    if target_excel:
        update_default_data(target_excel)
    else:
        print("No suitable Excel file found.")
