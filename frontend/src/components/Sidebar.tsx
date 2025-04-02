import * as React from 'react';
import { ChevronDown, Layers, Settings } from 'lucide-react';
import debounce from 'lodash.debounce';

import type { ModelStructure, TrainingMetadata, TrainingParams } from './types';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface ModelSidebarProps {
  modelStructure: ModelStructure;
  modelMetadata: TrainingMetadata;
  trainingParams: TrainingParams;
  layerSpacing: number;
  setLayerSpacing: (value: number) => void;
  neuronSpacing: number;
  setNeuronSpacing: (value: number) => void;
  nodeSize: number;
  setNodeSize: (value: number) => void;
  children?: React.ReactNode;
}

export function ModelSidebarWrapper({
  modelStructure,
  modelMetadata,
  trainingParams,
  layerSpacing,
  setLayerSpacing,
  neuronSpacing,
  setNeuronSpacing,
  nodeSize,
  setNodeSize,
  children,
}: ModelSidebarProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <ModelSidebarContent
          modelStructure={modelStructure}
          modelMetadata={modelMetadata}
          trainingParams={trainingParams}
          layerSpacing={layerSpacing}
          setLayerSpacing={setLayerSpacing}
          neuronSpacing={neuronSpacing}
          setNeuronSpacing={setNeuronSpacing}
          nodeSize={nodeSize}
          setNodeSize={setNodeSize}
        />
        <SidebarInset className="flex-1">
          <div className="flex h-16 items-center border-b px-4">
            <SidebarTrigger className="mr-4" />
            {/* <h1 className="text-xl font-semibold">
              Neural Network Visualization
            </h1> */}
          </div>
          <div className="flex h-screen w-full">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function ModelSidebarContent({
  modelStructure,
  modelMetadata,
  trainingParams,
  layerSpacing,
  setLayerSpacing,
  neuronSpacing,
  setNeuronSpacing,
  nodeSize,
  setNodeSize,
}: Omit<ModelSidebarProps, 'children'>) {
  // Create debounced handlers for the sliders
  const handleLayerSpacingChange = React.useCallback(
    debounce((value: number[]) => setLayerSpacing(value[0]), 200),
    [setLayerSpacing]
  );

  const handleNeuronSpacingChange = React.useCallback(
    debounce((value: number[]) => setNeuronSpacing(value[0]), 200),
    [setNeuronSpacing]
  );

  const handleNodeSizeChange = React.useCallback(
    debounce((value: number[]) => setNodeSize(value[0]), 200),
    [setNodeSize]
  );

  // Calculate training progress
  const trainingProgress =
    (modelMetadata.epoch / trainingParams.total_epochs) * 100;

  return (
    <Sidebar
      className="border-r border-border bg-gradient-to-b from-background to-background/80 backdrop-blur-sm"
      collapsible="offcanvas"
    >
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Model Inspector</h1>
        </div>
        <Progress value={trainingProgress} className="mt-2" />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>
            Epoch {modelMetadata.epoch}/{trainingParams.total_epochs}
          </span>
          <span>Loss: {modelMetadata.loss.toFixed(5)}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Model Metadata Section */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel
              asChild
              className="group/label text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Model Metadata</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <CollapsibleContent>
                <div className="space-y-3 rounded-md bg-card p-3 text-sm shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Total Layers:</div>
                    <div className="font-medium">
                      {modelStructure.total_layers}
                    </div>

                    <div className="text-muted-foreground">Total Params:</div>
                    <div className="font-medium">
                      {modelStructure.total_params}
                    </div>

                    <div className="text-muted-foreground">Batch:</div>
                    <div className="font-medium">{modelMetadata.batch}</div>

                    <div className="text-muted-foreground">Batch Size:</div>
                    <div className="font-medium">
                      {trainingParams.batch_size}
                    </div>

                    <div className="text-muted-foreground">Learning Rate:</div>
                    <div className="font-medium">
                      {trainingParams.learning_rate.toFixed(5)}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </SidebarGroupContent>
          </SidebarGroup>
        </Collapsible>

        {/* Layer Details Section */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel
              asChild
              className="group/label text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Layer Details</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="space-y-2 pr-1">
                  {modelStructure.layer_details.map((layer, index) => (
                    <div
                      key={`layer-meta-${index}`}
                      className="group flex items-center justify-between rounded-md bg-card p-3 shadow-sm transition-colors hover:bg-accent"
                    >
                      <div className="font-medium group-hover:text-accent-foreground">
                        {layer.layer_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {layer.input_size} → {layer.output_size}
                      </div>
                    </div>
                  ))}
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Visual Controls Section */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel
              asChild
              className="group/label text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Visual Controls</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="space-y-6 rounded-md bg-card p-3 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        Layer Spacing
                      </label>
                      <span className="text-xs font-medium">
                        {layerSpacing}
                      </span>
                    </div>
                    <Slider
                      defaultValue={[layerSpacing]}
                      min={5}
                      max={20}
                      step={1}
                      onValueChange={handleLayerSpacingChange}
                      className="py-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        Neuron Spacing
                      </label>
                      <span className="text-xs font-medium">
                        {neuronSpacing}
                      </span>
                    </div>
                    <Slider
                      defaultValue={[neuronSpacing]}
                      min={1}
                      max={5}
                      step={0.1}
                      onValueChange={handleNeuronSpacingChange}
                      className="py-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        Node Size
                      </label>
                      <span className="text-xs font-medium">
                        {nodeSize.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      defaultValue={[nodeSize]}
                      min={0.2}
                      max={1}
                      step={0.1}
                      onValueChange={handleNodeSizeChange}
                      className="py-1"
                    />
                  </div>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Settings className="h-4 w-4" />
          <span>v1.0.0</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
