import { TextStyle } from 'react-native';
import { colors } from './tokens';

export const typography = {
  display: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 40,
    lineHeight: 48,
    color: colors.primary,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  h1: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
    color: colors.primary,
  } satisfies TextStyle,
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.primary,
  } satisfies TextStyle,
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 26,
    color: colors.primary,
  } satisfies TextStyle,
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.secondary,
  } satisfies TextStyle,
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  } satisfies TextStyle,
  overline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondary,
  } satisfies TextStyle,
} as const;
