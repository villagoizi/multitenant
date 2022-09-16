//Lake model correctly the requestContext
export interface RequestCtx {
    resourceId: string,
    resourcePath: string,
    httpMethod: string,
    extendedRequestId: string,
    requestTime: string,
    path: string,
    accountId: string,
    protocol: string,
    stage: string,
    domainPrefix: string,
    requestTimeEpoch: number,
    requestId: string,
    identity: {
        cognitoIdentityPoolId: string,
        accountId: string,
        cognitoIdentityId: string,
        caller: string,
        sourceIp: string,
        principalOrgId: string,
        accessKey: string,
        cognitoAuthenticationType: string,
        cognitoAuthenticationProvider: string,
        userArn: string,
        userAgent: string,
        user: any
    },
    requestContext: {
        'accesskey': string,
        'secretkey' : string,
        'sessiontoken' : string,
        'userName': string,
        'tenantId': string,
        'userPoolId': string,
        'apiKey': string,
        'userRole': string,
        'parentId': string
    },
    domainName: string,
    apiId: string
}

export type IRequest = {
    'accesskey': string,
    'secretkey' : string,
    'sessiontoken' : string,
    'userName': string,
    'tenantId': string,
    'userPoolId': string,
    'apiKey': string,
    'userRole': string,
    'parentId': string
}

export type RegisterTenantDto = {
    email: string;
}

export type TenantModel = {
    email: string;
    password: string;
    tenantId: string;
    parentId?: string;
    tenantAdminUsername: string;
}

export type SuperTenantModel = {
    email: string;
    tenantId: string;
    apiKey: string;
    userPoolId: string;
    appClientId: string;
}

export type UserBussinesModel = {
    tenantId: string;
    parentId: string;
}
