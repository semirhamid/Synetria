flat out int vIndex;
varying vec2 vUv;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vIndex = gl_InstanceID;
  vUv = uv;
}