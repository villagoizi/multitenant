import { IRole, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class SuperTenantManagementRole extends Construct {
    public tenant_role: IRole;
    public tenant_arn: Array<string> = [
        "arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy",
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        "arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess"
    ];
    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.tenant_role = this.createRole();
    }

    createRole() {
        return new Role(this, "tenant-management-role", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: "tenant-common-role",
            managedPolicies: this.tenant_arn.map(v => ({ managedPolicyArn: v }))
        })
    }

}