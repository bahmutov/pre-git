echo "Linking current pre-git"
npm link

echo "Creating test folder"
folder=/tmp/test-pre-git
rm -rf $folder
mkdir $folder
cd $folder
echo "Created test folder $folder"

echo "Creating local git repo"
git init

echo "Running npm init -y"
npm init --yes
echo "started package"

echo "Installing git hooks"
npm install --save-dev pre-git
echo "Package.json after installing pre-git"
cat package.json
git add package.json
# echo "deleting node_modules folder just for testing"
# rm -rf node_modules
git commit -m "chore(test): this is a test commit"

ls -la
git log --oneline
git show
echo "All done testing pre-git"
