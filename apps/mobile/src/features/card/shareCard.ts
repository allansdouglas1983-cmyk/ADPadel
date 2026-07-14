import { makeImageFromView } from '@shopify/react-native-skia';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import type { MatchCardData } from './MatchCard';

/**
 * Render the match card off-screen to a PNG, save it to the gallery, and push
 * it to the OS share sheet. Entirely on-device — zero server media cost. Each
 * shared card carries the wordmark + a claim link, so it recruits new users.
 *
 * (The caller mounts an off-screen <MatchCard/> in a ref; here we snapshot it.)
 */
export async function shareMatchCard(_data: MatchCardData): Promise<void> {
  // In the screen this is wired to a ref-captured Skia view; kept thin here so
  // the flow (snapshot → encode → save → share) is the documented contract.
  const ref = getCardRef();
  if (!ref) return;
  const image = await makeImageFromView(ref);
  if (!image) return;

  const base64 = image.encodeToBase64();
  const uri = `${FileSystem.cacheDirectory}marque-card.png`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });

  const perm = await MediaLibrary.requestPermissionsAsync();
  if (perm.granted) await MediaLibrary.saveToLibraryAsync(uri);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your match' });
  }
}

// The off-screen card view ref is registered by the result screen.
let cardRef: Parameters<typeof makeImageFromView>[0] | null = null;
export function registerCardRef(ref: typeof cardRef): void {
  cardRef = ref;
}
function getCardRef(): typeof cardRef {
  return cardRef;
}
