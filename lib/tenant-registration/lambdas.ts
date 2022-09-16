import { IRole } from "aws-cdk-lib/aws-iam";
import { Code, Function, IFunction, ILayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from 'path';

const assets_path = path.join(
    __dirname,
    '/../../microservices', 'TenantManagementService'
)


type Params = {
    role: IRole;
    environments: { [key: string]: any };
    layers: ILayerVersion[]
}

export class RegistrationLambdas extends Construct {
    public register_tenant: IFunction;
    constructor(scope: Construct, id: string, params: Params) {
        super(scope, id);
        this.register_tenant = this.registerTenant(params);
    }

    registerTenant(params: Params) {
        return new Function(this, 'register-tenant-lambda', {
            functionName: "REGISTER_TENANT",
            handler: "tenant-registration.register_tentant",
            runtime: Runtime.NODEJS_16_X,
            role: params.role,
            layers: params.layers,
            environment: params.environments,
            code: Code.fromAsset(assets_path)
        })
    }
}