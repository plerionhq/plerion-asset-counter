#!/bin/bash

# Step 1: Ask for role name with default value
#read -p "Enter the role name (default: OrganizationAccountAccessRole): " role_name
#role_name=${role_name:-OrganizationAccountAccessRole}
#
## Store original environment variables
#original_aws_access_key_id=$AWS_ACCESS_KEY_ID
#original_aws_secret_access_key=$AWS_SECRET_ACCESS_KEY
#original_aws_session_token=$AWS_SESSION_TOKEN
#
## Step 2: List accounts in the organization using management account credentials
#accounts=$(aws organizations list-accounts --output text --query 'Accounts[*].Id')
#
## Step 3: For each member account, assume the specified role and run the original script
#for account_id in $accounts; do
#    echo "Assuming role $role_name in account $account_id..."
#    assumed_role=$(aws sts assume-role --role-arn arn:aws:iam::$account_id:role/$role_name --role-session-name "AssumeRoleSession")
#    export AWS_ACCESS_KEY_ID=$(echo $assumed_role | jq -r '.Credentials.AccessKeyId')
#    export AWS_SECRET_ACCESS_KEY=$(echo $assumed_role | jq -r '.Credentials.SecretAccessKey')
#    export AWS_SESSION_TOKEN=$(echo $assumed_role | jq -r '.Credentials.SessionToken')
#
#    echo "Running script in account $account_id..."
#
#    node index.js -p AWS --accountId $account_id
#
#    # Restore original environment variables
#    export AWS_ACCESS_KEY_ID=$original_aws_access_key_id
#    export AWS_SECRET_ACCESS_KEY=$original_aws_secret_access_key
#    export AWS_SESSION_TOKEN=$original_aws_session_token
#done
#
## Unset temporary variables
#unset original_aws_access_key_id
#unset original_aws_secret_access_key
#unset original_aws_session_token

# Initialize variables to hold the sum
total_cspm=0
total_cwpp=0
total_total=0

# Iterate through files with the prefix "<someNumber>-AWS-output.json"
for file in *-AWS-output.json; do
    echo "Processing file: $file"
    # Extract values from the file using jq and sum them
    total=$(jq '.TOTAL' "$file")
    cspm_units=$(jq '.CSPM_UNITS' "$file")
    cwpp_cspm_units=$(jq '.CWPP_UNITS' "$file")
    total_units=$(jq '.TOTAL_UNITS' "$file")
    days_per_month=30
    cspm_units_per_monthly_cspm=$(jq '.CSPM_UNITS_PER_MONTH' "$file")
    cwpp_units_per_month=$(jq '.CWPP_UNITS_PER_MONTH' "$file")
    total_units_per_month=$(jq '.TOTAL_UNITS_PER_MONTH' "$file")
    info_cspm_ciem_asset_unit_base_consumption=1
    info_cwpp_asset_unit_base_consumption=10
    info_days_per_month=30
    daily_cspm=$(jq '.DAILY.CSPM_CIEM_ASSET_UNITS' "$file")
    daily_cwpp=$(jq '.DAILY.CWPP_ASSET_UNITS' "$file")
    daily_total=$(jq '.DAILY.TOTAL_ASSET_UNITS' "$file")
    monthly_cspm=$(jq '.MONTHLY.CSPM_CIEM_ASSET_UNITS' "$file")
    monthly_cwpp=$(jq '.MONTHLY.CWPP_ASSET_UNITS' "$file")
    monthly_total=$(jq '.MONTHLY.TOTAL_ASSET_UNITS' "$file")

    # Add extracted values to the totals
    total_all=$((total_all + total))
    total_cspm_units=$((total_cspm_units + cspm_units))
    total_cwpp_cspm_units=$((total_cwpp_cspm_units + cwpp_cspm_units))
    total_all_units=$((total_all_units + total_units))
    total_cspm_units_per_monthly_cspm=$((total_cspm_units_per_monthly_cspm + cspm_units_per_monthly_cspm))
    total_cwpp_units_per_month=$((total_cwpp_units_per_month + cwpp_units_per_month))
    total_all_units_per_month=$((total_all_units_per_month + total_units_per_month))
    total_daily_cspm=$((total_daily_cspm + daily_cspm))
    total_daily_cwpp=$((total_daily_cwpp + daily_cwpp))
    total_daily_total=$((total_daily_total + daily_total))
    total_monthly_cspm=$((total_monthly_cspm + monthly_cspm))
    total_monthly_cwpp=$((total_monthly_cwpp + monthly_cwpp))
    total_monthly_total=$((total_monthly_total + monthly_total))
done

# Create JSON structure for the sums
json_output='{
 "TOTAL": '$total_all',
 "CSPM_UNITS": '$total_cspm_units',
 "CWPP_UNITS": '$total_cwpp_cspm_units',
 "TOTAL_UNITS": '$total_all_units',
 "DAYS_PER_MONTH": '$days_per_month',
 "CSPM_UNITS_PER_MONTH": '$total_cspm_units_per_monthly_cspm',
 "CWPP_UNITS_PER_MONTH": '$total_cwpp_units_per_month',
 "TOTAL_UNITS_PER_MONTH": '$total_all_units_per_month',
 "INFO": {
   "CSPM_CIEM_ASSET_UNIT_BASE_CONSUMPTION": '$info_cspm_ciem_asset_unit_base_consumption',
   "CWPP_ASSET_UNIT_BASE_CONSUMPTION": '$info_cwpp_asset_unit_base_consumption',
   "TOTAL_DAYS_PER_MONTH": '$info_days_per_month'
 },
 "DAILY": {
   "CSPM_CIEM_ASSET_UNITS": '$total_daily_cspm',
   "CWPP_ASSET_UNITS": '$total_daily_cwpp',
   "TOTAL_ASSET_UNITS": '$total_daily_total'
 },
 "MONTHLY": {
   "CSPM_CIEM_ASSET_UNITS": '$total_monthly_cspm',
   "CWPP_ASSET_UNITS": '$total_monthly_cwpp',
   "TOTAL_ASSET_UNITS": '$total_monthly_total'
 }
}'

# Write JSON output to a file
echo "$json_output" > AWS-Organization-output.json

echo "Summed values written to AWS-Organization-output.json"