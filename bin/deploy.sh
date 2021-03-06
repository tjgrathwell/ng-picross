set -e

if git rev-parse --verify gh-pages &> /dev/null; then
  git branch -D gh-pages
fi

git checkout -b gh-pages

perl -i -nle'/^dist$/||print' .gitignore

NODE_ENV=production gulp build

git add .

git commit -m "Adding dist"

git filter-branch -f --env-filter "
    GIT_AUTHOR_NAME='nobody'
    GIT_AUTHOR_EMAIL='nobody-gh-pages@example.com'
    GIT_COMMITTER_NAME='nobody'
    GIT_COMMITTER_EMAIL='nobody-gh-pages@example.com'
  " HEAD

git push origin `git subtree split --prefix dist gh-pages`:gh-pages --force

git checkout master
