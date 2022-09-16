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

export class UserTenantLambda extends Construct {
    public create_admin_tenant_user: IFunction;
    // public update_tenant: IFunction;
    constructor(scope: Construct, id: string, params: Params) {
        super(scope, id);
        this.create_admin_tenant_user = this.createAdminUser(params)
    }

    createAdminUser(params: Params) {
        return new Function(this, 'create-admin-user-lambda', {
            functionName: "CREATE_TENANT_ADMIN_USER_RESOURCE",
            handler: "user-management.create_tenant_admin_user",
            runtime: Runtime.NODEJS_16_X,
            role: params.role,
            layers: params.layers,
            environment: params.environments,
            code: Code.fromAsset(assets_path)
        })
    }
}