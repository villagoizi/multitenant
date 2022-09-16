

import * as aws from 'aws-sdk';
import { SuperTenantModel, UserBussinesModel } from './interfaces';
const cognito = new aws.CognitoIdentityServiceProvider();
const docClient = new aws.DynamoDB.DocumentClient();
const { handleResponse, HttpException, handleError } = require("/opt/nodejs/utils");

/**
 * Only use the business tenant (to attach any users created by super-tenant must be use your EP)
 * @param body 
 * @param context 
 * @returns 
 */
export async function create_tenant_business_user(body: UserBussinesModel, context: any) {
    
    console.log(body);

    const tenantId = body.tenantId;
    const parentId = body.parentId;
    const paretn = await getParentTenant(parentId);

    //

    if(paretn == null){
        throw new handleError({ message: 'Invalid Parent ID' }, 400)
    }

    const userPoolId = paretn?.userPoolID;
    const appClientId = paretn?.appClientId;

    const user_group_request = await _create_user_group(userPoolId, parentId, `User group for business ${parentId}`);

    const groupName = user_group_request.Group?.GroupName;
    
    return {
        userPoolId,
        appClientId,
        tenantId: parentId
    }
}

async function getParentTenant(idParent: string){
    const data = await (docClient.scan({
        TableName: "TENANT_DETAILS_TABLE",
        FilterExpression: "tenantId = :tenantId",
        ExpressionAttributeValues: {':tenantId': idParent}
    }).promise());
    const itemsAll : any = [];
    itemsAll.push(...(data.Items ? data.Items: []));
    if(itemsAll.length > 0){
        return itemsAll[0];
    }else{
        return null;
    }
}


async function _create_user_group(user_pool_id: string, s_tenant_id: string, description: string) {
    return cognito.createGroup({
        GroupName: s_tenant_id,
        UserPoolId: user_pool_id,
        Description: description,
        Precedence: 0
    }).promise()
}
