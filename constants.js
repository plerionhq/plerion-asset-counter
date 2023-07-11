export const UNIT_MAPPING = {
  AWS: {
    // default is 1 unit, unless CWPP
    EC2: {
      "AWS::EC2::Instance": 10,
    },
    Lambda: { "AWS::Lambda::Function": 10 },
    ECS: { "AWS::ECS::TaskDefinition": 10 },
  },
};

export const DAYS_PER_MONTH = 30;