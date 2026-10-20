
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Warennummern-Checker.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "C:\EORI_Check\Start-Warennummern-Checker.bat"
oLink.WorkingDirectory = "C:\EORI_Check"
oLink.Description = "Warennummern-Checker (Destatis Sova-Leitdatei)"
oLink.Save
