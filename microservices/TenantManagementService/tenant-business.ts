import * as aws from 'aws-sdk';
import { APIGatewayProxyEventV2WithRequestContext } from 'aws-lambda'
import { v4 } from 'uuid';
import { TenantModel, RequestCtx, IRequest } from './interfaces';
import { WrapperDynamo } from './dynamo.helper';
const { handleResponse, HttpException, handleError } = require("/opt/nodejs/utils");
const { logger } = require("/opt/nodejs/logger");
const db = new WrapperDynamo(new aws.DynamoDB.DocumentClient(), 'TENANT_DETAILS_TABLE')
const lambda = new aws.Lambda();
/**
 * Tenant Bussines:
 * 
 */

/**
 * Only super-tenant can create a bussiness tenant.
 * Method: POST bussiness-tenant
 * Event: requestContext.parentId
 * Body: {}
 * @param event 
 * @param ctx 
 * @returns 
 */
export async function create_business_tentant(event: APIGatewayProxyEventV2WithRequestContext<IRequest>, ctx: RequestCtx) {
    const tenant_id = v4();
    try {
        if (!event.body) throw new HttpException({ message: 'Invalid params' }, 400);
        const parentId = event.requestContext.parentId;
        const tenant_details: Partial<TenantModel> = JSON.parse(event.body);
        tenant_details['tenantId'] = tenant_id;
        tenant_details['parentId'] = parentId;
        const response = await __create_tenant(tenant_details as TenantModel);
        //Create user group by the business or add then
        logger(response);
    } catch (error) {
        logger('Error onboarding a new tenant', error);
        return handleError(error);
    }
}

/**
 * Only super-tenant can update a bussiness tenant.
 * Method: PUT bussiness-tenant/:tenantId
 * Event: requestContext.parentId
 * Body: {}
 * @param event 
 * @param ctx 
 * @returns 
 */
export async function update_business_tentant(event: APIGatewayProxyEventV2WithRequestContext<IRequest>, ctx: RequestCtx) {
    try {
        if (!event.body) throw new HttpException('Invalid params', 400);
        const { parentId, tenantId } = utils_tenant_validation(event);
        const tenant_details: Partial<TenantModel> = JSON.parse(event.body);
        const found = await db.scanAll({
            FilterExpression: "parentId = :parentId AND tenantId = :tenantId",
            ExpressionAttributeValues: {
                ':parentId': parentId,
                ':tenantId': tenantId
            },
            ConsistentRead: true,
            Limit: 1
        })
        const current = found.Items?.[0];
        if (!current) throw new HttpException({ message: 'Resource not found' }, 404);
        await db.update({
            tenantId
        }, tenant_details);
        return handleResponse({ message: "Bussines tenant update sucessfully" }, 200);
    } catch (error) {
        logger('Error update business tenant', error);
        return handleError(error);
    }
}
/**
 * Only super-tenant and owner tenant can get a bussiness tenant
 * Method: GET bussiness-tenant/:tenantId
 * Event: requestContext.parentId
 * Body: {}
 * @param event 
 * @param ctx 
 * @returns 
 */
export async function get_business_tentant(event: APIGatewayProxyEventV2WithRequestContext<IRequest>, ctx: RequestCtx) {
    try {
        const { parentId, tenantId } = utils_tenant_validation(event);
        //validar si ese tenan corresponde al tenant que lo solicita
        const data = await db.scanAll({
            FilterExpression: "parentId = :parentId AND tenantId = :tenantId",
            ExpressionAttributeValues: { ':parentId': parentId, ':tenantId': tenantId }
        })
        return handleResponse({
            items: data
        }, 200)
    } catch (error) {
        logger('Error get business tenant by id', error);
        return handleError(error);
    }
}


/**
 * Only super-tenant can get a bussiness tenant
 * Method: GET bussiness-tenant
 * Event: requestContext.parentId
 * Body: {}
 * @param event 
 * @param ctx 
 * @returns 
 */
export async function get_business_tentants(event: APIGatewayProxyEventV2WithRequestContext<IRequest>, ctx: RequestCtx) {
    try {
        const parentId = event.requestContext.parentId;
        const data = await db.scanAll({
            FilterExpression: "parentId = :parentId",
            ExpressionAttributeValues: { ':parentId': parentId }
        });
        return handleResponse({
            items: data
        }, 200)
    } catch (error) {
        logger('Error get business tenants', error);
        return handleError(error);
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
        throw new HttpException("Error occured while creating the tenant record in table", 500)
    }
}



function utils_tenant_validation(event: APIGatewayProxyEventV2WithRequestContext<IRequest>) {
    const parentId = event.requestContext.parentId;
    const params = event['pathParameters'];
    if (!params) throw new HttpException({ message: 'Invalid params' }, 400);
    const tenantId = params?.tenantid
    if (!tenantId) throw new HttpException({ message: 'Invalid params' }, 400);
    return { parentId, tenantId }
}