; OpenFCAD Custom NSIS Installer & Uninstaller Hooks
; Saves the selected installer language LCID ($LANGUAGE) so OpenFCAD starts in the user's chosen language
; and registers .dxf / .ofcad.json file associations in HKCU.

!macro customInstall
  FileOpen $0 "$INSTDIR\installer-lang.json" w
  FileWrite $0 '{"lcid": $LANGUAGE}'
  FileClose $0

  ; Register .dxf and .ofcad.json file associations for current user
  WriteRegStr HKCU "Software\Classes\.dxf" "" "OpenFCAD.Document"
  WriteRegStr HKCU "Software\Classes\.ofcad.json" "" "OpenFCAD.Document"
  WriteRegStr HKCU "Software\Classes\OpenFCAD.Document" "" "OpenFCAD CAD Drawing"
  WriteRegStr HKCU "Software\Classes\OpenFCAD.Document\DefaultIcon" "" "$INSTDIR\OpenFCAD.exe,0"
  WriteRegStr HKCU "Software\Classes\OpenFCAD.Document\shell\open\command" "" '"$INSTDIR\OpenFCAD.exe" "%1"'
!macroend

!macro customUnInstall
  Delete "$INSTDIR\installer-lang.json"
  DeleteRegKey HKCU "Software\Classes\OpenFCAD.Document"
!macroend
