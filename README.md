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

## Using with an AWS Organization Management Account
1. Run `npm i` to install packages
2. [Ensure you have `jq` installed (`brew install jq`)](https://jqlang.github.io/jq/)
3. Give `run_on_aws_management_account.sh` permission to run. `chmod +x run_on_aws_management_account.sh`
4. Assume Role into your AWS Organization Management Account using admin access
5. You can verify this by running `aws sts get-caller-identity` and checking if the outputed `Account` field is the same as the AWS Organization Management Account's id
6. Run the script `./run_on_aws_management_account.sh`
7. For each member account it will assume either the `OrganizationAccountAccessRole` by default, or an otherwise specified role. [`OrganizationAccountAccessRole` is a default role which managed accounts automatically have](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_access.html).
8. If you have many member accounts this script may take some time to run. Each time a member account's run has completed it'll create a new file called `<awsAccountId>-AWS-Output.json`
9. Once completely done it will create a file `AWS-Organization-output.json` which will contain estimated Plerion Unit consumption data for your entire Organization


## How to run for Kubernetes cluster
1. Install kubernetes and ensure `kubectl` command runs locally. Further information on Kubernetes installation can be found [here](https://kubernetes.io/docs/tasks/tools).
2. Ensure kubernetes context and authentication is properly configured. Use command `kubectl config current-context` to verify.
    * For AWS EKS, authentication can be done using: `aws eks update-kubeconfig --region <region> --name <cluster-name>`
3. Run `npm i` to install packages
4. Run `node index.js -p K8S`
    * Can also be run on the resource level `node index.js -p K8S -r po,ns`
    * You may also include verbose logging which will give you resource counts `node index.js -p K8S -v`
5. Open up `K8S-output.json` once it has finished running. The `K8S-output.json` file should consist count of each Kubernetes resources under `resources` attribute when `verbose` flag is enabled.  
