# Start the npm dev server in a separate minimized window
Start-Process powershell -ArgumentList "npm run dev" -WindowStyle Minimized

# Wait a few seconds for the server to start (optional tweak as per your needs)
Start-Sleep -Seconds 1

# Open the app in Microsoft Edge app mode
Start-Process -FilePath "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" -ArgumentList "--app=http://localhost:8000"

# Minimize this current PowerShell window
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Window {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();
}
"@

$consolePtr = [Window]::GetConsoleWindow()
[Window]::ShowWindow($consolePtr, 6)  # 6 = Minimize
