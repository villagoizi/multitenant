import { IRole, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class UserManagementRole extends Construct {
    public user_tenant_role: IRole;
    public user_tenant_arn: Array<string> = [
        "arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy",
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        "arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess",
        //TO DO: Add role to Cognito and DynamoDb tables (UserMapping and TenantDetails)
    ];
    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.user_tenant_role = this.createRole();
    }

    createRole() {
        return new Role(this, "tenant-management-role", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: "tenant-common-role",
            managedPolicies: this.user_tenant_arn.map(v => ({ managedPolicyArn: v }))
        })
    }

}