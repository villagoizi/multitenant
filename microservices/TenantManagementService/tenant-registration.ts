import * as aws from 'aws-sdk';
import { APIGatewayProxyEventV2WithRequestContext } from 'aws-lambda'
import { v4 } from 'uuid';
import { TenantModel, RequestCtx } from './interfaces';
const { handleResponse, HttpException, handleError } = require("/opt/nodejs/utils");
const { logger } = require("/opt/nodejs/logger");

const lambda = new aws.Lambda();


/**
 * Dependencies:
 * Role: Execution and Invoke Lambda,
 * layers: Logger, Utils
 * Lambdas: createTenant, createTenantAdminUser
 */

export async function register_tentant(event: APIGatewayProxyEventV2WithRequestContext<RequestCtx>, ctx: RequestCtx) {
    const tenant_id = v4();
    try {
        if (!event.body) throw new HttpException('Invalid params', 400);
        const tenant_details: Partial<TenantModel> = JSON.parse(event.body);
        tenant_details['tenantId'] = tenant_id;
        //Create admin user
        tenant_details['tenantAdminUsername'] = await __create_tenant_admin_user(tenant_details as TenantModel);
        //Create tenant
        const response = await __create_tenant(tenant_details as TenantModel);
        logger(response);
        return handleResponse({ message: "Onboarding completed succesfully" }, 200);
    } catch (error) {
        logger('Error onboarding a new tenant', error);
        return handleError(error);
    }
}

async function __create_tenant_admin_user(tenant_details: TenantModel) {
    try {
        const req = await lambda.invoke({
            FunctionName: "CREATE_TENANT_ADMIN_USER_RESOURCE",
            Payload: JSON.stringify(tenant_details),
            InvocationType: 'RequestResponse'
        }).promise()
        const parser = JSON.parse(req.Payload as string);
        return parser?.body;
    } catch (error) {
        throw new HttpException({ message: "Error occured while creating the tenant record in table" }, 500)
    }
}

function __create_tenant(tenant_details: TenantModel) {
    try {
        return lambda.invoke({
            FunctionName: "CREATE_TENANT_RESOURCE",
            Payload: JSON.stringify(tenant_details),
            InvocationType: 'RequestResponse'
        }).promise()
    } catch (error) {
        throw new HttpException({ message: "Error occured while creating the tenant record in table" }, 500)
    }
}