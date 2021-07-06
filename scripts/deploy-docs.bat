@echo off

cd %~dp0\..\docs
echo mt.tei.su > CNAME

rem reset git repo
rd /s /q .git

git init
git add --all . > nul 2> nul
git commit -am deploy  > nul 2> nul

git push -f https://github.com/teidesu/mtcute.git gh-pages
cd ../
