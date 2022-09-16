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

export class BusinessLambdas extends Construct {
    public create_business: IFunction;
    public get_all_business: IFunction;
    public get_business: IFunction;
    public update_business: IFunction;
    constructor(scope: Construct, id: string,params: Params) {
        super(scope, id);
        this.create_business = this.createBusiness(params);
        this.get_all_business = this.getAllBusiness(params);
        this.get_business = this.getBusiness(params); 
    }

    createBusiness(params: Params) {
        return new Function(this, 'create-business-lambda', {
            functionName: "CREATE_BUSSINESS_RESOURCE",
            handler: "tenant-business.create_business_tentant",
            runtime: Runtime.NODEJS_16_X,
            role: params.role,
            layers: params.layers,
            environment: params.environments,
            code: Code.fromAsset(assets_path)
        })
    }

    getAllBusiness(params: Params) {
        return new Function(this, 'get-all-business-lambda', {
            functionName: "GET_ALL_BUSINESS_RESOURCE",
            handler: "tenant-business.get_business_tentants",
            runtime: Runtime.NODEJS_16_X,
            role: params.role,
            layers: params.layers,
            environment: params.environments,
            code: Code.fromAsset(assets_path)
        })
    }

    getBusiness(params: Params) {
        return new Function(this, 'get-business-lambda', {
            functionName: "GET_BUSINESS_RESOURCE",
            handler: "tenant-business.get_business_tentant",
            runtime: Runtime.NODEJS_16_X,
            role: params.role,
            layers: params.layers,
            environment: params.environments,
            code: Code.fromAsset(assets_path)
        })
    }

    updateBusiness(params: Params) {
        return new Function(this, 'update-business-lambda', {
            functionName: "UPDATE_BUSINESS_RESOURCE",
            handler: "tenant-business.update_business_tentant",
            runtime: Runtime.NODEJS_16_X,
            role: params.role,
            layers: params.layers,
            environment: params.environments,
            code: Code.fromAsset(assets_path)
        })
    }

}