// Types
export interface LayerData {
  layer_name: string;
  type: string;

  // linear layer data
  weights: number[][];
  biases: number[];
  activations: number[];

  // conv layer data
  filters?: number[][][][]; // [filter_index][in_channel][height][width]
  kernel_size?: [number, number];
  stride?: [number, number];
  padding?: [number, number];
  in_channels?: number;
  out_channels?: number;

  // feature maps (activations)
  feature_maps?: number[][][]; // [channel][height][width]

  // pooling layer data
  pool_size?: [number, number];
  pool_stride?: [number, number];
  pool_padding?: [number, number];
  pool_type?: 'max' | 'avg';

  // input data (for visualization)
  input_shape?: number[];
  output_shape?: number[];
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
}

export interface ModelMetaData {
  epoch: number;
  batch: number;
  batch_size: number;
  learning_rate: number;
  loss: number;
}
