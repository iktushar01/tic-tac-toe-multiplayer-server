# How to Get Firebase Private Key

## Quick Steps:

1. Go to: https://console.firebase.google.com/project/tic-tac-toe-online-dbf10/settings/serviceaccounts/adminsdk

2. Click "Generate new private key" button

3. Click "Generate key" in the popup (warning about file security)

4. A JSON file will download - open it with Notepad

5. In the JSON file, find these values:
   - `"private_key"`: This is your FIREBASE_PRIVATE_KEY
   - `"client_email"`: This is your FIREBASE_CLIENT_EMAIL

6. Copy them to your .env file

## OR Use This PowerShell Script:

```powershell
# Run this in your terminal from Tic-Tac-Toe-Server folder
$jsonPath = Read-Host "Enter path to downloaded Firebase JSON file"

if (Test-Path $jsonPath) {
    $json = Get-Content $jsonPath | ConvertFrom-Json
    
    Write-Host "`nYour Firebase credentials:" -ForegroundColor Green
    Write-Host "`nFIREBASE_PROJECT_ID=$($json.project_id)"
    Write-Host "FIREBASE_CLIENT_EMAIL=$($json.client_email)"
    Write-Host "`nFIREBASE_PRIVATE_KEY=`"$($json.private_key)`""
    
    Write-Host "`nCopy the above values and update your .env file" -ForegroundColor Yellow
} else {
    Write-Host "File not found!" -ForegroundColor Red
}
```

## After Getting the Key:

Update your .env file with the actual values from the JSON file.

