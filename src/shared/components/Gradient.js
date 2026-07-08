// expo-linear-gradient wrapped so it accepts NativeWind `className` (maps to `style`).
// The gradient `colors` array stays a prop (NativeWind can't express RN gradients in className).
import { cssInterop } from 'nativewind';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

export const LinearGradient = cssInterop(ExpoLinearGradient, { className: 'style' });
