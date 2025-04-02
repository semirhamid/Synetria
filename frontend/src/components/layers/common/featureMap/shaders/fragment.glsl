uniform sampler2DArray textureAtlas;
uniform float mapCount;
uniform float mapSize;

flat in int vIndex;
varying vec2 vUv;

void main() {
  int layer = vIndex;
  vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y); // Flip vertically to align the texture properly.
  vec4 color = texture(textureAtlas, vec3(flippedUv, layer));
  gl_FragColor = color;
}