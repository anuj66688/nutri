# PowerShell helper to run backend and frontend locally
Write-Host "Starting AI Nutrition Intelligence Platform..." -ForegroundColor Green

# Start Backend in new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; python main.py"

# Start Frontend in new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Services started:" -ForegroundColor Cyan
Write-Host "Backend API:  http://127.0.0.1:8000 (Docs at http://127.0.0.1:8000/docs)" -ForegroundColor Yellow
Write-Host "Frontend App: http://localhost:3000" -ForegroundColor Yellow
