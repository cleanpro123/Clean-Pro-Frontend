// App-wide icon component: modern Lucide line icons behind the Ionicons API.
//
// Screens (and the backend — service icons are stored as Ionicons names such
// as "water-outline") keep passing Ionicons names; they're mapped to Lucide
// here. "-outline" / "-sharp" suffixes are ignored, so "home" and
// "home-outline" draw the same glyph; pass `filled` for a solid look (e.g.
// active tab, rating stars). Any name without a mapping falls back to the old
// Ionicons glyph, so nothing ever renders blank.
//
// Icons are imported one by one (not `import *`) so Metro only bundles the
// ones we use.
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgePercent,
  Bell,
  Bike,
  Box,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Clock,
  CloudSun,
  Droplets,
  Eye,
  EyeOff,
  Flame,
  Gift,
  Headset,
  Heart,
  House,
  Info,
  KeyRound,
  Leaf,
  LockKeyhole,
  LogOut,
  Mail,
  MailOpen,
  MapPin,
  Mic,
  Moon,
  Navigation,
  Package,
  Pencil,
  Phone,
  Plus,
  Quote,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tag,
  Tags,
  ThumbsUp,
  Timer,
  Trash2,
  TriangleAlert,
  Truck,
  UserRound,
  Wallet,
  WashingMachine,
  X,
  Zap,
} from 'lucide-react-native';

// Ionicons base name → Lucide component.
const MAP = {
  add: Plus,
  'add-circle': Plus,
  'alert-circle': CircleAlert,
  'arrow-back': ArrowLeft,
  'arrow-forward': ArrowRight,
  bicycle: Bike,
  car: Truck,
  calendar: CalendarClock,
  call: Phone,
  checkmark: Check,
  'checkmark-circle': CircleCheck,
  'chevron-back': ChevronLeft,
  'chevron-down': ChevronDown,
  'chevron-forward': ChevronRight,
  'chevron-up': ChevronUp,
  close: X,
  create: Pencil,
  cube: Package,
  eye: Eye,
  'eye-off': EyeOff,
  flame: Flame,
  flash: Zap,
  gift: Gift,
  headset: Headset,
  heart: Heart,
  home: House,
  'information-circle': Info,
  key: KeyRound,
  leaf: Leaf,
  location: MapPin,
  'lock-closed': LockKeyhole,
  'log-out': LogOut,
  mail: Mail,
  'mail-open': MailOpen,
  'mail-unread': MailOpen,
  mic: Mic,
  moon: Moon,
  navigate: Navigation,
  notifications: Bell,
  options: SlidersHorizontal,
  'partly-sunny': CloudSun,
  pencil: Pencil,
  person: UserRound,
  pricetag: Tag,
  pricetags: Tags,
  quote: Quote,
  receipt: ReceiptText,
  refresh: RefreshCw,
  'refresh-circle': RotateCcw,
  ribbon: Award,
  search: Search,
  settings: Settings,
  shirt: Shirt,
  'shield-checkmark': ShieldCheck,
  snow: Snowflake,
  sparkles: Sparkles,
  star: Star,
  sunny: Sun,
  'thumbs-up': ThumbsUp,
  time: Clock,
  timer: Timer,
  trash: Trash2,
  wallet: Wallet,
  warning: TriangleAlert,
  water: Droplets,
  'washing-machine': WashingMachine,
  box: Box,
  'badge-percent': BadgePercent,
};

// Direction-bearing glyphs, mirrored in right-to-left layouts (Arabic) so
// "forward" still points the way the UI flows.
const DIRECTIONAL = new Set(['arrow-back', 'arrow-forward', 'chevron-back', 'chevron-forward']);

// Solid Ionicons names that should keep a filled look under Lucide.
const FILLED_BY_DEFAULT = new Set(['star', 'heart']);

export default function Icon({ name = '', size = 20, color = '#000', strokeWidth = 2, filled, style }) {
  const base = name.replace(/-(outline|sharp)$/, '');
  const Glyph = MAP[base];
  if (!Glyph) return <Ionicons name={name} size={size} color={color} style={style} />;
  const solid = filled ?? (FILLED_BY_DEFAULT.has(name) || false);
  const mirror = I18nManager.isRTL && DIRECTIONAL.has(base);
  return (
    <Glyph
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={solid ? color : 'none'}
      style={mirror ? StyleSheet.flatten([{ transform: [{ scaleX: -1 }] }, style]) : style}
    />
  );
}
