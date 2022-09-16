import { AccountRecovery, ClientAttributes, IUserPool, OAuthScope, StringAttribute, UserPool, UserPoolClientIdentityProvider } from "aws-cdk-lib/aws-cognito";
import { Polly } from "aws-sdk";
import { Construct } from "constructs";

//Este no va de momento
export class TenantCognito extends Construct {
    public readonly TENANTS_POOLED: IUserPool;
    public readonly TENANTS_OPERATIONS: IUserPool;
    constructor(scope: Construct, id: string) {
        super(scope, id);
    }

    private __create_tenants_operations_user_pool() {
        const pool = new UserPool(this, 'tenants-operations-user-pool', {
            userPoolName: "TENANTS_OPERATIONS",
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            standardAttributes: {
                email: {
                    mutable: true,
                    required: true
                }
            },
            customAttributes: {
                tenantId: new StringAttribute(),
                userRole: new StringAttribute({ mutable: true })
            },
            autoVerify: {
                email: true
            }
        });
        const readAttributes = new ClientAttributes().withCustomAttributes('email').withCustomAttributes('custom:tenantId', "custom:userRole");
        const writeAttributes = new ClientAttributes().withCustomAttributes('email').withCustomAttributes('custom:tenantId', "custom:userRole");
        const client = pool.addClient('tenants-operations-user-pool-client', {
            userPoolClientName: "OPERATIONS_USERS_POOL_CLIENT",
            generateSecret: false,
            supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
            readAttributes,
            writeAttributes
        })
        
    }

    // private __create_tentants_pooled_user_pool() {
    //     return new UserPool(this, "tenants-pooled-user-pool", {
    //         userPoolName: "TENANTS_POOLED",

    //     })
    // }


}