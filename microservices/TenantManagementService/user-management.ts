

import * as aws from 'aws-sdk';
import { SuperTenantModel } from './interfaces';
const cognito = new aws.CognitoIdentityServiceProvider();
const { handleResponse, HttpException, handleError } = require("/opt/nodejs/utils");
const { logger } = require("/opt/nodejs/logger");
const db = new aws.DynamoDB.DocumentClient();
//Probar de este modo primero, luego probar con el freemium only and pooled strategy


/**
 * Dependencies:
 * DynamoDb: TENANT_USER_MAPPING_TABLE, TENANT_DETAILS_TABLE
 * Lambda: LambdaPowerTools -> Research it
 * Environments: TENANT_USER_POOL_CALLBACK_URL,
 * Role: DynamoDb, ExcutionRole, CloudWatch, Cognito (FullAccess)
 * 
 *  
 */
/**
 * Only tenant-registration and system can invoke
 * Method POST /user-pool
 * Body: {
 *  tenantId: string
 *  email: string
 * }
 * @param body 
 * @returns 
 */
export async function create_tenant_admin_user(body: SuperTenantModel) {
    try {
        const sTenantId = body.tenantId;
        logger(body);
        const user_pool_request = await _create_user_pool(sTenantId);
        const user_pool_id = user_pool_request.UserPool?.Id;
        logger(user_pool_id);
        const app_client_request = await _create_user_pool_client(user_pool_id as string);
        const app_client_id = app_client_request.UserPoolClient?.ClientId;
        const user_pool_domain_req = await _create_user_pool_domain(user_pool_id as string, sTenantId);
        logger(user_pool_domain_req);
        const user_group_request = await _create_user_group(user_pool_id as string, sTenantId, `User group for tenant ${sTenantId}`);
        const tenant_admin_user = body.email;
        const admin_user = await _create_admin(user_pool_id as string, tenant_admin_user, body);
        const add_user_request = await _add_user_to_group(user_pool_id as string, tenant_admin_user, user_group_request.Group?.GroupName as string);
        await _create_user_tenant_mapping({
            tenantId: sTenantId,
            user: tenant_admin_user
        })
        const item = {
            userPoolId: user_pool_id,
            appClientId: app_client_id,
            tenantId: sTenantId,
            tenantAdminUserName: tenant_admin_user,
        }
        return handleResponse({item}, 200)
    } catch (error) {
        return handleError(error)
    }
}


async function _create_user_pool(tenantId: string) {
    const email_template = `Bienvenido a ${"testing_serverless_sass"}, link de verificacion: {####}`;
    const email_subject = 'Verification user';
    const response = await cognito.createUserPool({
        PoolName: `${tenantId}-user-pool`,
        AutoVerifiedAttributes: ['email'],
        VerificationMessageTemplate: {
            DefaultEmailOption: "CONFIRM_WITH_LINK",
            EmailMessage: email_template,
            EmailSubject: email_subject
        },
        AccountRecoverySetting: {
            RecoveryMechanisms: [{
                Name: "verified_email",
                Priority: 1
            }]
        },
        UsernameAttributes: ['email']
        // Schema: [
        //     {
        //         AttributeDataType: "String",
        //         Name: 'email',
        //         Mutable: true
        //     }
        // ]
    }).promise()
    await cognito.addCustomAttributes({
        CustomAttributes: [
            {
                AttributeDataType: "String",
                Name: 'tenantId',
                Mutable: true
            },
            {
                AttributeDataType: "String",
                Name: 'parentId',
                Mutable: true
            },
            {
                AttributeDataType: "String",
                Name: 'userRole',
                Mutable: true
            }

        ],
        UserPoolId: response.UserPool?.Id as string
    }).promise()
    return response;
}

async function _create_user_pool_client(user_pool_id: string) {
    const user_pool_callback_url = process.env.TENANT_USER_POOL_CALLBACK_URL as string || "https://www.hexaoffice.com/";
    const response = await cognito.createUserPoolClient({
        UserPoolId: user_pool_id,
        ClientName: "SaaSClient",
        GenerateSecret: false,
        AllowedOAuthFlowsUserPoolClient: true,
        AllowedOAuthFlows: ['code', 'implicit'],
        SupportedIdentityProviders: ['COGNITO'],
        CallbackURLs: [user_pool_callback_url],
        LogoutURLs: [user_pool_callback_url],
        AllowedOAuthScopes: ['email', 'openid', 'profile'],
        WriteAttributes: [
            // 'email',
            'custom:tenantId',
            'custom:parentId',
            'custom:userRole'
        ]
    }).promise()
    return response;
}

async function _create_user_pool_domain(user_pool_id: string, tenant_id: string) {
    return cognito.createUserPoolDomain({
        Domain: `${tenant_id}-saas`,
        UserPoolId: user_pool_id
    }).promise()
}

/**
 * Useful to create_user_group by tenant that belong to same supertenant.
 * @param user_pool_id 
 * @param s_tenant_id 
 * @param description 
 * @returns 
 */
async function _create_user_group(user_pool_id: string, s_tenant_id: string, description: string) {
    return cognito.createGroup({
        GroupName: s_tenant_id,
        UserPoolId: user_pool_id,
        Description: description,
        Precedence: 0
    }).promise()
}
/**
 * Useful to create_user_group by tenant that belong to same supertenant.
 * @param user_pool_id 
 * @param username 
 * @param user_details SuperTenantModel
 * @returns 
 */
async function _create_admin(user_pool_id: string, username: string, user_details: SuperTenantModel) {
    return cognito.adminCreateUser({
        Username: username,
        UserPoolId: user_pool_id,
        UserAttributes: [
            {
                Name: "email",
                Value: user_details.email
            },
            {
                Name: "custom:userRole",
                Value: "super-tenant-admin"
            },
            {
                Name: "custom:tenantId",
                Value: ""
            },
            {
                Name: "custom:parentId",
                Value: user_details.tenantId,
            },
        ]
    }).promise();
}

/**
 * Useful to create_user_group by tenant that belong to same supertenant.
 * @param user_pool_id 
 * @param tenant_admin_user 
 * @param group_name SuperTenantModel
 * @returns 
 */
async function _add_user_to_group(user_pool_id: string, tenant_admin_user: string, group_name: string) {
    return cognito.adminAddUserToGroup({
        Username: tenant_admin_user,
        UserPoolId: user_pool_id,
        GroupName: group_name
    }).promise()
}

async function _create_user_tenant_mapping(params: { user: string, tenantId: string, parentId?: string }) {
    try {
        await db.put({
            Item: params,
            TableName: "TENANT_USER_MAPPING_TABLE"
        }).promise()
        return handleResponse("Register successfully", 200)
    } catch (error) {
        logger(error);
        throw new HttpException("Error to create tenant: " + error, 500);
    }
}