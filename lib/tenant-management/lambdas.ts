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

export class SuperTenantLambdas extends Construct {
    public create_tenant: IFunction;
    public get_tenants: IFunction;
    public get_tenant: IFunction;
    // public update_tenant: IFunction;
    constructor(scope: Construct, id: string,params: Params) {
        super(scope, id);
        this.create_tenant = this.createTenant(params);
        this.get_tenants = this.getTenants(params);
        this.get_tenant = this.getTenant(params); 
    }

    createTenant(params: Params) {
        return new Function(this, 'create-tenant-lambda', {
            functionName: "CREATE_TENANT_RESOURCE",
            handler: "tenant-managment.create_tenant",
            runtime: Runtime.NODEJS_16_X,
            role: params.role,
            layers: params.layers,
            environment: params.environments,
            code: Code.fromAsset(assets_path)
        })
    }

    getTenants(params: Params) {
        return new Function(this, 'get-all-tenant-lambda', {
            functionName: "GET_ALL_TENANT_RESOURCE",
            handler: "tenant-managment.get_tenants",
            runtime: Runtime.NODEJS_16_X,
            role: params.role,
            layers: params.layers,
            environment: params.environments,
            code: Code.fromAsset(assets_path)
        })
    }

    getTenant(params: Params) {
        return new Function(this, 'get-tenant-lambda', {
            functionName: "GET_TENANT_RESOURCE",
            handler: "tenant-managment.get_tenant",
            runtime: Runtime.NODEJS_16_X,
            role: params.role,
            layers: params.layers,
            environment: params.environments,
            code: Code.fromAsset(assets_path)
        })
    }

}