#!/bin/bash

# Input values as an array
declare -a resources=(
"AWS::DynamoDB::ScalableTarget"
"AWS::EC2::Instance"
"AWS::EC2::DefaultEBSEncryption"
"AWS::EC2::Snapshot"
"AWS::EC2::AMI"
"AWS::EC2::FpgaImage"
"AWS::Glacier::Vault"
"AWS::IAM::Group"
"AWS::IAM::Role"
"AWS::IAM::User"
"AWS::IAM::Policy"
"AWS::Kinesis::FirehoseDeliveryStream"
"AWS::Kinesis::Stream"
"AWS::Lambda::Function"
"AWS::MemoryDB::ACL"
"AWS::MemoryDB::Cluster"
"AWS::MemoryDB::User"
"AWS::Organizations::Organization"
"AWS::Organizations::OrganizationalUnit"
"AWS::Organizations::Account"
"AWS::S3Control::PublicAccessBlock"
"AWS::SSM::Document"
"AWS::SSM::Parameter"
"AWS::APIGateway::Stage"
"AWS::ECS::Service"
"AWS::DocDB::DBInstance"
"AWS::DocDB::DBCluster"
"AWS::DocDB::DBClusterParameterGroup"
"AWS::RDS::DBInstance"
"AWS::RDS::DBCluster"
"AWS::RDS::DBClusterSnapshot"
"AWS::Neptune::DBInstance"
"AWS::Neptune::DBCluster"
"AWS::ECS::TaskDefinition"
"AWS::WAFv2::RuleGroup"
"AWS::EKS::NodeGroup"
"AWS::S3::Bucket"
"AWS::EMR::Cluster"
"AWS::ApiGatewayV2::API"
"AWS::ComputeOptimizer::EnrollmentStatus"
"AWS::ApplicationAutoScaling::ECSScalingPolicy"
"AWS::Neptune::DBClusterParameterGroup"
)

# Loop through each resource string
for resource in "${resources[@]}"; do
    # Extract service name and resource name using awk
    service_name=$(echo $resource | awk -F '::' '{print ($2)}')
    resource_name=$(echo $resource | awk -F '::' '{print ($3)}')

    # Create the directory if it doesn't exist
    mkdir -p $service_name

    # Create the .js file inside the directory
    touch $service_name/$resource_name.js

    echo "Directory $service_name and file $resource_name.js created."
done

