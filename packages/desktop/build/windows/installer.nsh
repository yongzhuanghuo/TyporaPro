; Windows remembers an "Open with" choice as a UserChoice naming this ProgId,
; and that pin outlives any reinstall, so the name must stay as it is.
!define MT_PROGID "TyporaPro.Document"

; These must be written on every install and removed only on a real uninstall.
; electron-builder runs the previous version's uninstaller silently before it
; installs, so unregistering there unconditionally while registering only
; behind a prompt left any update or reinstall answered "No" with a UserChoice
; pointing at a ProgId that no longer existed, and Explorer's double-click did
; nothing at all (#4966).

; The "Open with" dialog builds its UserChoice from OpenWithProgids, so
; without that entry Windows pins the ProgId electron-builder registers from
; `fileAssociations` rather than this one.
!macro mtAssociateExtension EXT
  WriteRegStr SHELL_CONTEXT "Software\Classes\${EXT}" "" "${MT_PROGID}"
  WriteRegNone SHELL_CONTEXT "Software\Classes\${EXT}\OpenWithProgids" "${MT_PROGID}"
!macroend

; The extension key also carries the OpenWithProgids entries of every other
; Markdown editor the user has installed, so only TyporaPro's own values go.
!macro mtUnassociateExtension EXT
  DeleteRegValue SHELL_CONTEXT "Software\Classes\${EXT}\OpenWithProgids" "${MT_PROGID}"
  Push $0
  ReadRegStr $0 SHELL_CONTEXT "Software\Classes\${EXT}" ""
  ${if} $0 == "${MT_PROGID}"
    DeleteRegValue SHELL_CONTEXT "Software\Classes\${EXT}" ""
  ${endIf}
  Pop $0
!macroend

!macro customInstall
  !insertmacro mtAssociateExtension ".md"
  !insertmacro mtAssociateExtension ".markdown"
  !insertmacro mtAssociateExtension ".mmd"
  !insertmacro mtAssociateExtension ".mdown"
  !insertmacro mtAssociateExtension ".mdtxt"
  !insertmacro mtAssociateExtension ".mdtext"
  !insertmacro mtAssociateExtension ".mdx"

  WriteRegStr SHELL_CONTEXT "Software\Classes\${MT_PROGID}" \
    "" "TyporaPro Markdown Document"
  WriteRegExpandStr SHELL_CONTEXT "Software\Classes\${MT_PROGID}\DefaultIcon" \
    "" "$INSTDIR\resources\icons\md.ico,0"
  WriteRegExpandStr SHELL_CONTEXT "Software\Classes\${MT_PROGID}\shell\open\command" \
    "" '"$INSTDIR\typorapro.exe" "%1"'

  ; electron-builder writes the command for its own ProgId — `Markdown`, the
  ; `fileAssociations[].name` in electron-builder.yml — with the executable
  ; path unquoted, which runs `C:\Program` when the directory the user picked
  ; during setup contains a space.
  WriteRegStr SHELL_CONTEXT "Software\Classes\Markdown\shell\open\command" \
    "" '"$INSTDIR\typorapro.exe" "%1"'

  ; A shortcut kept from the previous MarkText install is renamed during an
  ; upgrade but still points at the removed marktext.exe, so Explorer renders
  ; it without an icon. Recreate both shortcuts so their target and icon refer
  ; to the current executable again. The built-in macros still honour the
  ; "create desktop shortcut" choice.
  StrCpy $keepShortcuts "false"
  !insertmacro addStartMenuLink $keepShortcuts
  !insertmacro addDesktopLink $keepShortcuts

  ; Explorer serves file types from a cache that a fresh install otherwise
  ; keeps until the next sign-in.
  System::Call 'shell32::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

!macro customUnInstall
  ; An update reaches here through the old uninstaller, right before the new
  ; version registers the association again.
  ${ifNot} ${isUpdated}
    !insertmacro mtUnassociateExtension ".md"
    !insertmacro mtUnassociateExtension ".markdown"
    !insertmacro mtUnassociateExtension ".mmd"
    !insertmacro mtUnassociateExtension ".mdown"
    !insertmacro mtUnassociateExtension ".mdtxt"
    !insertmacro mtUnassociateExtension ".mdtext"
    !insertmacro mtUnassociateExtension ".mdx"
    DeleteRegKey SHELL_CONTEXT "Software\Classes\${MT_PROGID}"
  ${endIf}

  MessageBox MB_YESNO "Do you want to delete user settings?" /SD IDNO IDNO SkipRemoval
    SetShellVarContext current
    RMDir /r "$APPDATA\TyporaPro"
  SkipRemoval:
!macroend
