export const UNIT_MAPPING = {
  AWS: {
    // default is 1 unit, unless CWPP
    EC2: {
      "AWS::EC2::Instance": 10,
      "AWS::EC2::AMI": 10,
    },
    Lambda: { "AWS::Lambda::Function": 10 },
    ECR: { "AWS::ECR::ContainerImage": 10 },
    ECS: { "AWS::ECS::TaskDefinition": 10 },
    AutoScaling: { "AWS::AutoScaling::AutoScalingGroup": 10 },
  },
  K8S: {
    pods: 10,
    deployments: 10,
    statefulsets: 10,
    daemonsets: 10,
    jobs: 10,
    cronjobs: 10,
  },
};

export const DAYS_PER_MONTH = 30;
