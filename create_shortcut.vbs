
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Warennummern-Checker.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "C:\EORI_Check\Start-App.bat"
oLink.WorkingDirectory = "C:\EORI_Check"
oLink.Description = "Warennummern-Checker (Destatis Sova-Leitdatei 2026)"
oLink.IconLocation = "C:\EORI_Check\public\icon.ico,0"
oLink.Save
