import * as Haptics from 'expo-haptics';
import { Pill } from './Pill';

interface TagChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
  fullWidth?: boolean;
}

export function TagChip({
  label,
  selected = false,
  onPress,
  compact = false,
  fullWidth = false,
}: TagChipProps) {
  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <Pill
      label={label}
      size={compact ? 'compact' : 'md'}
      variant={selected ? 'goldFilled' : 'default'}
      onPress={onPress ? handlePress : undefined}
      fullWidth={fullWidth}
    />
  );
}
