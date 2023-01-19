# Plerion Asset Counter
A tool which returns the total number of assets Plerion will monitor.

## How to run for an AWS account
1. Ensure you have AWS CLI access. You can test this by running the following command and observing the output:
```
aws sts get-caller-identity
```
It should return the Account ID that you're wanting to run the asset counter over. _Note that we are limited to whatever
role you're using in the CLI._
1. Ensure you have `npm` install
2. Run `npm i` to install packages
3. Run `node index.js -p AWS`
    * Can also be run on the service level `node index.js -p AWS -s IAM`
    * Or the resource type level `node index.js -p AWS -r AWS::IAM::Role`
    * You may also include verbose logging which will give you asset counts on the resource level `node index.js -p AWS -v`
4. Open up `AWS-output.json` once it has finished running. Errors may throw which is fine as some AWS APIs return an
error if there are no resources in that region.

## Docker instructions
1. `docker build -t asset-counter .`
2. `docker run --rm -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN asset-counter -p AWS`
