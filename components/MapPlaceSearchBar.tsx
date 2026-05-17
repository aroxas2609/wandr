import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  searchPlaces,
  formatPlaceLabel,
  resolvePlaceForSave,
  type PlaceSearchResult,
} from '@/services/geocoding/geocodingService';
import { colors, typography, spacing, radius } from '@/theme';

export interface MapPlaceSearchBarProps {
  placeholder?: string;
  initialQuery?: string;
  onSelectPlace: (place: PlaceSearchResult) => void;
  onQueryChange?: (query: string) => void;
}

export function MapPlaceSearchBar({
  placeholder = 'Search for a place…',
  initialQuery = '',
  onSelectPlace,
  onQueryChange,
}: MapPlaceSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const runSearch = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchPlaces(text, 8);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    onQueryChange?.(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(text), 350);
  };

  const pick = (place: PlaceSearchResult) => {
    void (async () => {
      setSearching(true);
      try {
        const resolved = await resolvePlaceForSave(place);
        setQuery(formatPlaceLabel(resolved));
        setSuggestions([]);
        onSelectPlace(resolved);
      } finally {
        setSearching(false);
      }
    })();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => void runSearch(query)}
        />
        {searching ? <ActivityIndicator size="small" color={colors.gold} /> : null}
      </View>
      {suggestions.length > 0 ? (
        <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {suggestions.map((place) => (
            <Pressable key={place.id} style={styles.resultRow} onPress={() => pick(place)}>
              <Ionicons name="location-outline" size={18} color={colors.gold} />
              <Text style={styles.resultText} numberOfLines={2}>
                {formatPlaceLabel(place)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.primary,
    paddingVertical: 2,
  },
  results: {
    maxHeight: 160,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.card,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  resultText: { ...typography.body, color: colors.primary, flex: 1 },
});
