import { Code, ILayerVersion, LayerVersion, LayerVersionProps, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from 'path';
const LAYER_PATH = path.join(__dirname, "..", '..', 'microservices', 'layers');

export class CustomLayers extends Construct {
    public readonly layers: ILayerVersion;
    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.layers = this.createLayers();
    }

    createLayers() {
        return new LayerVersion(this, 'layers-utils-tenant-analytics-town', {
            compatibleRuntimes: [
                Runtime.NODEJS_16_X,
                Runtime.NODEJS_14_X,
            ],
            code: Code.fromAsset(LAYER_PATH),
            description: 'Utils handle exception layers and Logger layer',
            layerVersionName: `utilLayer`
        })
    }
}