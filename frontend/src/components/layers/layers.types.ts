export interface FeatureMap {
  channel_id: number;
  activation_map: number[][];
  shape: [number, number];
}

export interface BaseLayerData {
  metadata: BaseLayerMetaData; // Static base information about the layer.
  layer_name: string;
  type: string;
  input_shape?: number[];
  output_shape?: number[];
}

export interface BaseLayerMetaData {
  layer_name: string;
  layer_type: string;
  input_shape: number[];
  output_shape: number[];
}

export interface DenseLayerData extends BaseLayerData {
  type: 'linear' | 'dense';
  weights: number[][];
  biases: number[];
  activations: number[];
  gradients?: number[][];
}

export interface ConvLayerData extends BaseLayerData {
  type: 'conv' | 'conv2d' | 'convolution';
  kernel_size: [number, number];
  stride: [number, number];
  padding: [number, number];
  in_channels?: number;
  out_channels?: number;
  filters: number[][][][]; // [filter_index][in_channel][height][width]
  feature_maps?: FeatureMap[];
  cam?: number[][]; // class activation map for the layer
}

export interface PoolingLayerData extends BaseLayerData {
  type: 'pool' | 'maxpool' | 'avgpool' | 'maxpool2d' | 'avgpool2d';
  pool_type: 'max' | 'avg';
  kernel_size: [number, number];
  stride: [number, number];
  padding?: [number, number];
  feature_maps?: FeatureMap[];
}

// Union type for all layer types
export type LayerData = DenseLayerData | ConvLayerData | PoolingLayerData;

// Type guard functions to check layer types
export function isDenseLayer(layer: LayerData): layer is DenseLayerData {
  return layer.type === 'linear' || layer.type === 'dense';
}

export function isConvLayer(layer: LayerData): layer is ConvLayerData {
  return (
    layer.type === 'conv' ||
    layer.type === 'conv2d' ||
    layer.type === 'convolution'
  );
}

export function isPoolingLayer(layer: LayerData): layer is PoolingLayerData {
  return (
    layer.type === 'pool' ||
    layer.type === 'maxpool' ||
    layer.type === 'avgpool' ||
    layer.type === 'maxpool2d' ||
    layer.type === 'avgpool2d'
  );
}
