import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface PickedDocumentImage {
  uri: string;
  mimeType: string;
}

const imagePickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.85,
  allowsEditing: Platform.OS !== 'web',
};

function assetToPicked(asset: ImagePicker.ImagePickerAsset): PickedDocumentImage {
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

export async function pickImageFromLibrary(): Promise<PickedDocumentImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Photo library', 'Allow access to attach document photos.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
  if (result.canceled || !result.assets[0]) return null;
  return assetToPicked(result.assets[0]);
}

export async function takeDocumentPhoto(): Promise<PickedDocumentImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Camera', 'Allow camera access to photograph documents.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync(imagePickerOptions);
  if (result.canceled || !result.assets[0]) return null;
  return assetToPicked(result.assets[0]);
}

export function promptDocumentImageSource(
  onPick: (image: PickedDocumentImage) => void
): void {
  const chooseLibrary = () => {
    void pickImageFromLibrary().then((image) => {
      if (image) onPick(image);
    });
  };

  const chooseCamera = () => {
    void takeDocumentPhoto().then((image) => {
      if (image) onPick(image);
    });
  };

  Alert.alert('Add document', 'Choose a source', [
    { text: 'Take photo', onPress: chooseCamera },
    { text: 'Photo library', onPress: chooseLibrary },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
