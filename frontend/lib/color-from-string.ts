/**
 * La API no expone (todavia) una URL para servir la imagen original de
 * una captura, asi que las tarjetas de producto usan un color/icono
 * determinista en vez de la foto real como marcador visual.
 */
export function colorFromString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `oklch(0.7 0.14 ${hue})`;
}
