# Synetria: Neural Network Visualization Tool

## TODO

[x] - Separate the server into it's own process that runs and streams training information
[x] - Add Gradcam visualization
[x] - Restructure the frontend layer layout and cleanup the code
[x] - SSE instead of websockets for the server
[x] - Use Instanced mesh to render the feature maps for conv and pooling layers for performance
[x] - hover for feature maps
[x] - Layout changes, find a place for the gradcam viz.
[x] - Sidebar
   [x] - Make it collapseable/resizable
   [x] - Fix the sidebar resize overflow
   [ ] - Move the layer controls to a debug gui overlay(lil-gui or lea?)
   [ ] - Add more detailed layer information
[ ] - try compression for the payload. msgpack or gzip.
[ ] - Layer Navigation: Make a navbar that will focus the camera on a specific layer and make it easier to move around. Maybe even move the layers themselves to make them more visible(maybe make the others transparent?)
