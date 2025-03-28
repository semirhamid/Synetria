import React from "react";
import * as THREE from 'three';

import { LayerData } from '../../types';

interface LayerComponentProps {
  layer: LayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  nodeSize: number;
}

const LayerComponent: React.FC<LayerComponentProps> = ({
  layer,
  layerIndex,
  nextLayer,
  layerSpacing,
  nodeSize,
}) => {
  
}
