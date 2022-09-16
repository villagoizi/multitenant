import * as AWS from "aws-sdk";
type CommonParams = {
  [key: string]: any;
};

export class WrapperDynamo {
  constructor(
    protected readonly db: AWS.DynamoDB.DocumentClient,
    protected readonly tableName: string
  ) { }

  async scanAll<T = any>(
    opt: Omit<AWS.DynamoDB.DocumentClient.ScanInput, "TableName"> = {}
  ): Promise<T> {
    let hasNext = true;
    const result = [];
    while (hasNext) {
      const request = await this.db
        .scan({ ...opt, TableName: this.tableName })
        .promise();
      if (request.Items?.length) result.push(...request.Items);
      hasNext = !!request.LastEvaluatedKey;
      if (hasNext) {
        opt.ExclusiveStartKey = request.LastEvaluatedKey;
      }
    }
    return result as unknown as T;
  }

  async put<T = AWS.DynamoDB.DocumentClient.PutItemInputAttributeMap>(params: T): Promise<Boolean> {
    try {
      await this.db
        .put({
          TableName: this.tableName,
          Item: { ...params as any },
        })
        .promise();
      return true;
    } catch (error) {
      console.log(`Failed to create: ${error}`);
      throw error;
    }
  }

  async update(keys: CommonParams, params: CommonParams) {
    const paramsKeys = Object.keys(params);
    if (!paramsKeys.length)
      throw new Error("Argument invalid, params is empty");
    let UpdateExpression = "set ";
    const update = paramsKeys.reduce(
      (acc, v, i) => {
        const ExpressionAttributeValuesKey = `:${v}`;
        const ExpressionAttributeNamesKey = `#${v}`;
        acc["ExpressionAttributeNames"] = {
          ...acc["ExpressionAttributeNames"],
          [ExpressionAttributeNamesKey]: v,
        };
        acc["ExpressionAttributeValues"] = {
          ...acc["ExpressionAttributeValues"],
          [ExpressionAttributeValuesKey]: params[v],
        };
        UpdateExpression += `${ExpressionAttributeNamesKey} = ${ExpressionAttributeValuesKey}`;
        if (i !== paramsKeys.length - 1) {
          UpdateExpression += ",";
        }
        return acc;
      },
      { Key: keys } as AWS.DynamoDB.DocumentClient.UpdateItemInput
    );
    try {
      await this.db
        .update({
          ...update,
          TableName: this.tableName,
          Key: keys,
          UpdateExpression,
          ReturnValues: "UPDATED_NEW",
        })
        .promise();
      return true;
    } catch (error) {
      console.log(`Failed to update entity: ${error}`);
      throw error;
    }
  }
}
