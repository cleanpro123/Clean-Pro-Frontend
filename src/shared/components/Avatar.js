import React from 'react';
import { Image } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { presetAvatarXml } from '../constants/avatars';

// Renders a stored avatar value: preset avatars (`avatar:<id>`) are drawn
// as SVG; anything else is treated as an image URL (older accounts saved
// DiceBear URLs, which keep working).
export default function Avatar({ value, style }) {
  const xml = presetAvatarXml(value);
  if (xml) return <SvgXml xml={xml} width="100%" height="100%" style={style} />;
  return <Image source={{ uri: value }} style={style} />;
}
