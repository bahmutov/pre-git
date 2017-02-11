set -e

preGitFolder=$PWD
echo Current folder $preGitFolder

echo "Creating test folder"
folder=/tmp/test-pre-git-disabled
rm -rf $folder
mkdir $folder
cd $folder
echo "Created test folder $folder"

echo "Creating local git repo"
git init

# echo "Running npm init -y"
# npm init --yes
echo "Writing package.json with pre-git disabled"
cat > package.json <<EOF
{
  "name": "test",
  "version": "0.0.0",
  "scripts": {
    "test": "exit 0"
  },
  "config": {
    "pre-git": {
      "enabled": true,
      "allow-untracked-files": true,
      "commit-msg": "simple",
      "pre-commit": ["npm test"],
      "pre-push": [],
      "post-commit": [],
      "post-checkout": [],
      "post-merge": []
    }
  }
}
EOF
echo "started package"

echo "Installing git hooks"
# we can install latest from NPM
# npm install --save-dev pre-git
# or we can install current dev source
npm install $preGitFolder
echo "Package.json after installing pre-git"
cat package.json

# let us commit the code
git add package.json

# echo "deleting node_modules folder just for testing"
# rm -rf node_modules

# see how the check handles untracked files
# touch something
echo node_modules/ >> .gitignore
git add .gitignore
git commit -m "chore(test): this is a test commit"

ls -la
git log --oneline
git show --name-status
echo "Could commit with untracked files because allow-untracked-files is enabled"