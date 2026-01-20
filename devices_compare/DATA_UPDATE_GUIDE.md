# 如何更新 `index.html` 的預設機台資料

本目錄包含一個自動化腳本，用於將最新的 Excel 規格表更新到 `index.html` 中。

## 前置需求

確保您的環境已安裝 Python 以及必要的套件：

```bash
pip install pandas openpyxl
```

## 更新步驟

1. **準備 Excel 檔案**
   - 將最新的機台規格 Excel 檔案（例如 `machine_spec_20260201.xlsx`）放入此目錄 (`devices_compare`).
   - 確保 Excel 格式與之前的版本一致（第一行為 ID，後續為資料）。

2. **執行更新腳本**
   開啟終端機 (Terminal) 並切換到此目錄，執行以下指令：

   ```bash
   # 自動抓取最新的 Excel 檔案並更新
   python convert_and_update_data.py
   ```

   或者指定特定的檔案名稱：

   ```bash
   python convert_and_update_data.py machine_spec_20260201.xlsx
   ```

3. **確認結果**
   - 腳本會讀取 Excel 並將資料轉換為 JSON 格式。
   - 自動尋找 `index.html` 中的 `const defaultData = [[...]];` 並進行替換。
   - 完成後，請重新整理網頁確認資料顯示正確。

## 檔案說明

- `convert_and_update_data.py`: 更新用的 Python 主腳本。
- `machine_spec_*.xlsx`: 機台規格資料來源。
- `index.html`: 主要顯示網頁。
