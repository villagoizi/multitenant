import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CDKContext } from '../types';
import { CustomLayers } from './shared/layers';
import { Gateway } from './shared/gateway';
import { MockIntegration, PassthroughBehavior } from 'aws-cdk-lib/aws-apigateway';

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, ctx: CDKContext) {
    super(scope, id, props);
    const { stage, ddbPITRecovery } = ctx;

    const layers = new CustomLayers(this, 'shared-layers-analytics-town');
    const gw = new Gateway(this, 'shared-gateway-analytics-town', stage);
    // const api = gw.gateway.root.addMethod('ANY');
    const method = gw.gateway.root.addResource('test').addMethod('GET', new MockIntegration({
      integrationResponses: [{
        statusCode: '200',
      }],
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    }), {
      methodResponses: [{ statusCode: '200' }],
    });
    new CfnOutput(this, 'gateway-url', {
      value: gw.url,
      description: "Url gateway"
    })
  }
}
