@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
set "ANDROID_HOME=C:\Users\prakash c\AppData\Local\Android\Sdk"
cd android
call "C:\Users\prakash c\.gradle\wrapper\dists\gradle-8.9-bin\90cnw93cvbtalezasaz0blq0a\gradle-8.9\bin\gradle.bat" clean assembleRelease --no-daemon --no-build-cache
if exist app\build\outputs\apk\release\app-release.apk (
    copy /Y app\build\outputs\apk\release\app-release.apk ..\LostSeek.apk
    copy /Y app\build\outputs\apk\release\app-release.apk ..\public\LostSeek.apk
    copy /Y app\build\outputs\apk\release\app-release.apk LostSeek-Release.apk
    copy /Y app\build\outputs\apk\release\app-release.apk LostSeek.apk
    echo Signed APK Build and Copy Succeeded!
) else if exist app\build\outputs\apk\release\app-release-unsigned.apk (
    copy /Y app\build\outputs\apk\release\app-release-unsigned.apk ..\LostSeek.apk
    copy /Y app\build\outputs\apk\release\app-release-unsigned.apk ..\public\LostSeek.apk
    copy /Y app\build\outputs\apk\release\app-release-unsigned.apk LostSeek-Release.apk
    copy /Y app\build\outputs\apk\release\app-release-unsigned.apk LostSeek.apk
    echo Unsigned APK Build and Copy Succeeded!
)


