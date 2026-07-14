import type { SkCanvas } from '@shopify/react-native-skia';
import { ImageFormat } from '@shopify/react-native-skia';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

/**
 * Snapshot an off-screen Skia canvas to a PNG, save it to the gallery, and push
 * it to the OS share sheet. Entirely on-device — zero server media cost. Each
 * shared card carries the wordmark + a claim QR, so it recruits new users.
 *
 * The caller renders an off-screen <MatchCard canvasRef={ref} /> and passes the
 * ref here once it has laid out.
 */
export async function shareCanvas(canvas: SkCanvas | null): Promise<boolean> {
  if (!canvas) return false;
  const image = canvas.makeImageSnapshot();
  const base64 = image.encodeToBase64(ImageFormat.PNG, 100);

  const uri = `${FileSystem.cacheDirectory}marque-card-${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });

  // Best-effort save to the camera roll (needs permission; never blocks sharing).
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (perm.granted) {
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
    } catch {
      /* saving is optional */
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your match' });
    return true;
  }
  return false;
}
