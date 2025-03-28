// Types
export interface BaseLayerData {
  layer_name: string;
  type: string;
  input_shape?: number[];
  output_shape?: number[];
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
  filters: number[][][][]; // [filter_index][in_channel][height][width]
  kernel_size: [number, number];
  stride: [number, number];
  padding: [number, number];
  in_channels?: number;
  out_channels?: number;
  cam?: number[][]; // class activation map for the layer
  feature_maps?: FeatureMap[];
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

export interface FeatureMap {
  channel_id: number;
  activation_map: number[][];
}

export interface ModelStructure {
  total_layers: number;
  total_epochs: number;
  total_params: number;
  layer_details: {
    layer_name: string;
    input_size: number;
    output_size: number;
  }[];
}

export interface TrainingData {
  epoch: number;
  batch: number;
  hyperparameters: Map<string, number> // total_epochs, learning_rate, batch_size
  batch_size: number;
  learning_rate: number;
  loss: number;
  layers: LayerData[];
  model_structure: ModelStructure;
  network_input: NetworkInput
}

export interface ModelMetaData {
  epoch: number;
  batch: number;
  batch_size: number;
  learning_rate: number;
  loss: number;
}

export interface NetworkInput {
  type: string;
  data: number[][][];
}

// Type guard functions to check layer types
export function isDenseLayer(layer: LayerData): layer is DenseLayerData {
  return layer.type === 'linear' || layer.type === 'dense';
}

export function isConvLayer(layer: LayerData): layer is ConvLayerData {
  return layer.type === 'conv' || layer.type === 'conv2d' || layer.type === 'convolution';
}

export function isPoolingLayer(layer: LayerData): layer is PoolingLayerData {
  return layer.type === 'pool' || layer.type === 'maxpool' || layer.type === 'avgpool' || 
         layer.type === 'maxpool2d' || layer.type === 'avgpool2d';
}