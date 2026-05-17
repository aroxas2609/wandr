import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '@/theme';
import { CountdownTimer } from './CountdownTimer';

const { height } = Dimensions.get('window');

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  children?: React.ReactNode;
}

export function HeroSection({
  title,
  subtitle,
  imageUrl,
  startDate,
  endDate,
  children,
}: HeroSectionProps) {
  return (
    <View style={styles.container}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(13,13,15,0.6)', colors.background]}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {startDate && endDate && (
          <View style={styles.countdown}>
            <CountdownTimer startDate={startDate} endDate={endDate} compact />
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height * 0.38,
    position: 'relative',
  },
  image: { ...StyleSheet.absoluteFillObject },
  gradient: { ...StyleSheet.absoluteFillObject },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 32,
  },
  title: {
    ...typography.display,
    fontSize: 32,
  },
  subtitle: {
    ...typography.body,
    marginTop: 4,
    marginBottom: 12,
  },
  countdown: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
