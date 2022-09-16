import { ApiKey, Period, RestApi, UsagePlan } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class Gateway extends Construct {
    public readonly gateway: RestApi
    public readonly url: string;
    public readonly free_api_key: string = "tBcPYjFWYcjhByFyWnt6QUUeUTOnLxnn9YuxRSwYrDYWMSLVzh7mLQPdzzb6pFtO";
    public readonly premium_api_key: string = "a5tONmDrVtk9Q8nQCNcF904B8BUguAY1D6cVznBuUACLsmKQqB8f9OQ8MxbXV34J";
    public readonly system_api_key: string = "3dUGlCjLtxRNWLl0ehCGPaD6AkE2efVCueN0cgxvPHfXfYGZ9W8qDmC5upSBE43W";
    constructor(scope: Construct, id: string, stage: string) {
        super(scope, id)
        this.gateway = this.create(stage);
        this.url = this.gateway.url;
        this.create_api_keys(this.gateway);
    }

    create(stage: string) {
        const rest_api = new RestApi(this, 'architecture-saas-rest-api', {
            restApiName: "api-gateway-analytics-town",
            description: "Api gateway to Analytics Town SaaS",
            cloudWatchRole: false, //create role cloudwatch
        })
        return rest_api;
    }

    private create_api_keys(rest_api: RestApi) {
        const free_api_key = new ApiKey(this, 'api-key-free-tier', {
            apiKeyName: "free-tier-api-key",
            description: "This is the api key to be used to free tier super tenants",
            enabled: true,
            value: this.free_api_key
        })
        const premium_api_key = new ApiKey(this, 'api-key-premium-tier', {
            apiKeyName: "premium-tier-api-key",
            description: "This is the api key to be used to premium tier super tenants",
            enabled: true,
            value: this.premium_api_key
        })
        const system_api_key = new ApiKey(this, 'api-key-system', {
            apiKeyName: "system-api-key",
            description: "This is the api key to be used to System Admin tenants",
            enabled: true,
            value: this.system_api_key
        });

        const usagePlanFree = new UsagePlan(this, 'api-usage-plan-free-tier', {
            name: "usage-plan-free-tier",
            description: "Usage plan for free tier super tenants",
            quota: {
                limit: 1000,
                period: Period.DAY,
            },
            throttle: {
                burstLimit: 100,
                rateLimit: 50
            },
            apiStages: [{
                api: rest_api,
                stage: rest_api.deploymentStage
            }]
        })

        const usagePlanPremium = new UsagePlan(this, 'api-usage-plan-premium-tier', {
            name: "usage-plan-free-tier",
            description: "Usage plan for premium tier super tenants",
            quota: {
                limit: 10000,
                period: Period.DAY,
            },
            throttle: {
                burstLimit: 300,
                rateLimit: 300
            },
            apiStages: [{
                api: rest_api,
                stage: rest_api.deploymentStage
            }]
        })

        const usagePlanSystem = new UsagePlan(this, 'api-usage-plan-system', {
            name: "usage-plan-system",
            description: "Usage plan for system tenants",
            quota: {
                limit: 10000,
                period: Period.DAY,
            },
            throttle: {
                burstLimit: 300,
                rateLimit: 300
            },
            apiStages: [{
                api: rest_api,
                stage: rest_api.deploymentStage
            }]
        })

        usagePlanFree.addApiKey(free_api_key);
        usagePlanPremium.addApiKey(premium_api_key);
        usagePlanSystem.addApiKey(system_api_key);

        return {
            free: [free_api_key, usagePlanFree],
            premium: [premium_api_key, usagePlanPremium],
            system: [system_api_key, usagePlanSystem]
        }
    }

    // private _exec(l: FnLambdas[]) {
    //     const group = new Map<string, {
    //         valuesWithId: FnLambdas[],
    //         values: FnLambdas[]
    //     }>();
    //     const api = new RestApi(this, "saas-api", {
    //         restApiName: "SaaS Service",
    //         description: "Services of Ecommerce.",
    //     });
    //     l.forEach(v => {
    //         const hasId = (v.method == 'GET' && !(v.lambda as any).physicalName.includes('ALL')) || ["PUT", "DELETE"].includes(v.method) && v.method !== 'POST'
    //         if (group.has(v.prefix) && !!group.get(v.prefix)) {
    //             let current = group.get(v.prefix);
    //             !hasId ? current?.values.push(v) : current?.valuesWithId.push(v);
    //             group.set(v.prefix, current as any);
    //             return;
    //         }
    //         const save = {
    //             values: !hasId ? [v] : [],
    //             valuesWithId: hasId ? [v] : [],
    //         };
    //         group.set(v.prefix, save);
    //     })

    //     const final = [...group];
    //     final.forEach(([prefix, values]) => {
    //         const apiWithPrefix = api.root.addResource(prefix);
    //         for (let v of values.values) {
    //             apiWithPrefix.addMethod(v.method, new LambdaIntegration(v.lambda));
    //         }
    //         if (!values.valuesWithId.length) return
    //         const singles = apiWithPrefix.addResource('{id}');
    //         for (let vId of values.valuesWithId) {
    //             singles.addMethod(vId.method, new LambdaIntegration(vId.lambda));
    //         }
    //     })
    //     return api.url;
    // }
}