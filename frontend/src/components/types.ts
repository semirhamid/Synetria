import { LayerData } from "./layers/layers.types";

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

export interface TrainingMetadata {
  epoch: number;
  batch: number;
  loss: number;
}

export interface TrainingParams {
  total_epochs: number;
  learning_rate: number;
  batch_size: number;
}

export interface TrainingData {
  metadata: TrainingMetadata;
  parameters: TrainingParams;
  model_structure: ModelStructure;
  network_input: NetworkInput;
  layers: LayerData[];
}

export interface NetworkInput {
  type: string;
  data: number[][][];
}