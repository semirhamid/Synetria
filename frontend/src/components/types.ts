// Types
export interface LayerData {
  layer: string;
  weights: number[][];
  biases: number[];
}

// CNN-specific interfaces
export interface ConvFilterData {
  filter_id: number;
  channel: number;
  filter_weights: number[][];
}

export interface FeatureMapData {
  channel_id: number;
  activation_map: number[][];
}

export interface ConvLayerData {
  layer_name: string;
  filters: ConvFilterData[];
  feature_maps: FeatureMapData[];
  kernel_size: number[];
  stride: number[];
  padding: number[];
  input_shape: number[];
  output_shape: number[];
}

export interface PoolingLayerData {
  layer_name: string;
  pool_type: string; // 'max', 'avg', etc.
  kernel_size: number[];
  stride: number[];
  input_shape: number[];
  output_shape: number[];
  feature_maps: FeatureMapData[];
}

export interface ModelStructure {
  total_layers: number;
  total_epochs: number;
  total_params: number;
  layer_details: {
    layer_name: string;
    layer_type: string; // 'conv', 'pool', 'linear', etc.
    input_size: number | number[];
    output_size: number | number[];
  }[];
}

export interface TrainingData {
  epoch: number;
  batch: number;
  batch_size: number;
  learning_rate: number;
  loss: number;
  layers: LayerData[];
  conv_layers?: ConvLayerData[];
  pooling_layers?: PoolingLayerData[];
  input_image?: number[][][]; // For storing the original input image
  model_structure: ModelStructure;
}

export interface ModelMetaData {
  epoch: number;
  batch: number;
  batch_size: number;
  learning_rate: number;
  loss: number;
}