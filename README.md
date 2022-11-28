# plerion-asset-counter
A script which returns the number of assets Plerion will monitor over a cloud provider's account

## How to run
1. Ensure you have AWS CLI access. You can test this by running the following command and observing the output:
```
aws sts get-caller-identity
```
It should return the Account ID that you're wanting to run the asset counter over. Note that we are limited to whatever
role you're using in the CLI.
1. Ensure you have `npm` install
2. Run `npm i` to install packages
3. Run `node index.js -p AWS`
4. Open up `AWS-output.json` once it has finished running. Errors may throw which is fine as some AWS APIs return an
error if there are no resources in that region. 
