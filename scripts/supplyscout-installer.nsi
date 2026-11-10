; SupplyScout Windows installer (built with Linux makensis)
!include "MUI2.nsh"

Name "SupplyScout"
OutFile "..\release\SupplyScout-Setup-0.1.0.exe"
InstallDir "$LOCALAPPDATA\SupplyScout"
InstallDirRegKey HKCU "Software\SupplyScout" "InstallDir"
RequestExecutionLevel user
Unicode True
SetCompressor /SOLID lzma

!define MUI_ABORTWARNING
!define PRODUCT_NAME "SupplyScout"
!define PRODUCT_VERSION "0.1.0"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "..\release\win-unpacked\*.*"

  CreateDirectory "$SMPROGRAMS\SupplyScout"
  CreateShortCut "$SMPROGRAMS\SupplyScout\SupplyScout.lnk" "$INSTDIR\SupplyScout.exe"
  CreateShortCut "$DESKTOP\SupplyScout.lnk" "$INSTDIR\SupplyScout.exe"

  WriteRegStr HKCU "Software\SupplyScout" "InstallDir" "$INSTDIR"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SupplyScout" "DisplayName" "SupplyScout"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SupplyScout" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SupplyScout" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SupplyScout" "Publisher" "SupplyScout"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\SupplyScout.lnk"
  Delete "$SMPROGRAMS\SupplyScout\SupplyScout.lnk"
  RMDir "$SMPROGRAMS\SupplyScout"

  RMDir /r "$INSTDIR"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SupplyScout"
  DeleteRegKey HKCU "Software\SupplyScout"
SectionEnd
