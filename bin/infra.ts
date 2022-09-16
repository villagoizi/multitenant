#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';
import * as gitBranch from 'git-branch';
import { CDKContext } from '../types';

// const app = new cdk.App();
// new InfraStack(app, 'InfraStack', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });

//Create Stacks
async function createStacks() {
  try {
    const app = new cdk.App();
    const ctx = await getContext(app);
    const tags: any = {
      Environment: ctx.stage
    }
    const props: cdk.StackProps = {
      env: {
        region: ctx.region,
        account: ctx.account || process.env.AWS_ACCOUNT
      },
      stackName: `${ctx.appName}-stack-${ctx.stage}`,
      tags
    }
    new InfraStack(app, `${ctx.appName}-stack-${ctx.stage}`, props, ctx);
  } catch (error) {
    console.log(error);
  }
}


//Get ctx based on git branch.
export const getContext = async (app: cdk.App): Promise<CDKContext> => {
  try {
    const currentBranch = await gitBranch();
    console.log("Git branch:", currentBranch)
    const environment = app.node.tryGetContext("environments").find((e: any) => e.branchName === currentBranch)
    if (!environment) throw new Error(`Config to environment: ${currentBranch}, not found, please modify cdk.json and add the stage configuration with the branchName`);
    console.log("Environment found:")
    console.log(JSON.stringify(environment, null, 2));
    const globals = app.node.tryGetContext("global") || {};
    console.log("Globals setup:")
    console.log(JSON.stringify(globals, null, 2));
    return { ...environment, ...globals } as CDKContext;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

createStacks();