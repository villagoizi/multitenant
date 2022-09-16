import * as aws from 'aws-sdk';
import { APIGatewayProxyEventV2WithRequestContext } from 'aws-lambda'
import { TenantModel, RequestCtx, IRequest } from './interfaces';
import { WrapperDynamo } from './dynamo.helper';
const { handleResponse, HttpException, handleError } = require("/opt/nodejs/utils");
const { logger } = require("/opt/nodejs/logger");
const db = new WrapperDynamo(new aws.DynamoDB.DocumentClient(), 'TENANT_DETAILS_TABLE')

/**
 * Dependencies
 * DynamoDb: TENANT_DETAILS_TABLE
 * Layers: Logger, Utils
 * Role: DynamoDB, ExecutionRole,CloudWatchLambdaInsightsExecutionRolePolicy
 *  
 */

/**
 * Only the lambda tenant-registration and system can use this EP (create super-tenant)
 * Method: POST /super-tenant
 * 
 * @param event 
 * @param ctx 
 * @returns 
 */
export async function create_tenant(event: APIGatewayProxyEventV2WithRequestContext<IRequest>, ctx: RequestCtx) {
    try {
        if (!event.body) throw new HttpException(400, 'Invalid params');
        const tenant_details = JSON.parse(event.body);
        await db.put({ ...tenant_details, isActive: true })
        return handleResponse("Register successfully", 200)
    } catch (error) {
        logger(error);
        throw new HttpException("Error to create tenant: " + error, 500);
    }
}

/**
 * Only use system admin
 * GET /super-tenants
 * @param event 
 * @param ctx 
 * @returns 
 */
export async function get_tenants(event: APIGatewayProxyEventV2WithRequestContext<IRequest>, ctx: RequestCtx) {
    try {
        const req = await db.scanAll({ FilterExpression: "attribute_not_exists(parentId)", });
        return handleResponse(req.Items, 200);
    } catch (error) {
        logger(error)
        throw new HttpException({ message: "Error getting all tenants", error }, 500);
    }
}

/**
 * Only use system admin and super-tenant
 * GET /super-tenant/:tenantId
 * @param event 
 * @param ctx 
 * @returns 
 */

export async function get_tenant(event: APIGatewayProxyEventV2WithRequestContext<IRequest>, ctx: RequestCtx) {
    const params = event['pathParameters'];
    if (!params) throw new HttpException({ message: 'Invalid params' }, 400);
    const tenantId = params?.tenantId
    if (!tenantId) throw new HttpException({ message: 'Invalid params' }, 400);
    try {
        const req = await db.scanAll({
            FilterExpression: "attribute_not_exists(parentId) AND tenantId = :tenantId",
            ExpressionAttributeValues: {
                ":tenantId": tenantId
            },
            Limit: 1
        })
        return handleResponse({
            item: req?.[0] || null
        }, 200);
    } catch (error) {
        logger(error)
        throw new HttpException({ message: "Error getting all tenants", error }, 500);
    }
}

/**
 * Only use system admin and super-tenant (only a few atrributes)
 * PUT /super-tenant/:tenantId
 * @param event 
 * @param ctx 
 * @returns 
 */
export async function update_tenant(event: APIGatewayProxyEventV2WithRequestContext<IRequest>, ctx: RequestCtx) {
    try {
        if (!event.body) throw new HttpException('Invalid params', 400);
        const { tenantId } = utils_tenant_validation(event);
        const tenant_details: Partial<TenantModel> = JSON.parse(event.body);
        const found = await db.scanAll({
            FilterExpression: "attribute_not_exists(parentId) AND tenantId = :tenantId",
            ExpressionAttributeValues: {
                ':tenantId': tenantId
            },
            ConsistentRead: true,
            Limit: 1
        })
        const current = found.Items?.[0];
        if (!current) throw new HttpException({ message: 'Resource not found' }, 404);
        await db.update({ tenantId }, tenant_details);
        return handleResponse({ message: "Bussines tenant update sucessfully" }, 200);
    } catch (error) {
        logger('Error update business tenant', error);
        return handleError(error);
    }
}

function utils_tenant_validation(event: APIGatewayProxyEventV2WithRequestContext<IRequest>) {
    const params = event['pathParameters'];
    if (!params) throw new HttpException({ message: 'Invalid params' }, 400);
    const tenantId = params?.tenantid
    if (!tenantId) throw new HttpException({ message: 'Invalid params' }, 400);
    return { tenantId }
}