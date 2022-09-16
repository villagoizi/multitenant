import { AttributeType, BillingMode, ITable, Table, TableProps } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class TenantTables extends Construct {
    public tenant_details_table: ITable;
    public user_mapping_table: ITable;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.tenant_details_table = this.tenantDetails();
        this.user_mapping_table = this.userMapping();
    }

    tenantDetails() {
        const props: TableProps = {
            partitionKey: {
                name: "tenantId",
                type: AttributeType.STRING
            },
            tableName: "TENANT_DETAILS_TABLE",
            billingMode: BillingMode.PAY_PER_REQUEST
        }
        return new Table(this, 'tenant-table-details-dynamodb', props);
    }

    userMapping() {
        return new Table(this, 'tenant-user-mapping-table', {
            tableName: 'TENANT_USER_MAPPING_TABLE',
            partitionKey: {
                name: "tenantId",
                type: AttributeType.STRING
            },
            sortKey: {
                name: "email",
                type: AttributeType.STRING
            },
            billingMode: BillingMode.PAY_PER_REQUEST
        })
    }

}