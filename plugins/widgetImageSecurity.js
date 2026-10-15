const crypto = require('node:crypto');
const ORIGINAL_SHA256 = '03cee3e46cd3ef416558dff5d198759873798634717f60ece9ac2766881e0b3b';
const PATCHED_SHA256 = 'a049db9d03aa162a28e4a236e978abe9338afedf1e6e4f63711aa5646a05b6c8';
const MARKER = '// AndroidMetro: authenticate widget image URIs.';

// A narrow, reproducible patch for 0.20.1. The exported provider is required by
// RemoteViews collection hosts. A per-file capability authenticates image reads
// without depending on launcher permissions that differ across Android versions.
function secureWidgetImageProvider(input) {
  const source = input.replace(/\r\n/g, '\n');
  const hash = crypto.createHash('sha256').update(source).digest('hex');
  if (hash === PATCHED_SHA256) return source;
  if (hash !== ORIGINAL_SHA256) throw new Error('Widget image provider changed; review the security patch before building.');
  return source
    .replace('import java.util.Objects;', `import java.util.Objects;
import java.security.SecureRandom;
import java.security.MessageDigest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import android.util.Base64;`)
    .replace('        File folder = getFolderWithImages(getContext());', `        ${MARKER}
        fileName = fileName.replaceAll("\\\\?.*", "");
        String supplied = uri.getQueryParameter("am_token");
        if (supplied == null || supplied.length() != 64 || !MessageDigest.isEqual(
                imageToken(getContext(), fileName).getBytes(java.nio.charset.StandardCharsets.UTF_8),
                supplied.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            throw new FileNotFoundException("Image access denied.");
        }
        File folder = getFolderWithImages(getContext());`)
    .replace('file.getCanonicalPath().startsWith(folder.getCanonicalPath())', 'folder.getCanonicalFile().equals(file.getCanonicalFile().getParentFile())')
    .replace('deleteImages(context, "widget_" + widgetId);', 'deleteImages(context, "widget_" + widgetId + "_");')
    .replace('            .build();\n    }\n\n    private static File getFolderWithImages', `            .appendQueryParameter("am_token", imageToken(context, fileName))
            .build();
    }

    private static synchronized String imageToken(Context context, String fileName) {
        android.content.SharedPreferences preferences = context.getSharedPreferences("androidmetro_image_access_v1", Context.MODE_PRIVATE);
        String encoded = preferences.getString("secret", null);
        if (encoded == null) {
            byte[] random = new byte[32];
            new SecureRandom().nextBytes(random);
            encoded = Base64.encodeToString(random, Base64.NO_WRAP);
            if (!preferences.edit().putString("secret", encoded).commit()) {
                throw new IllegalStateException("Cannot initialize widget image access.");
            }
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(Base64.decode(encoded, Base64.NO_WRAP), "HmacSHA256"));
            byte[] signature = mac.doFinal(fileName.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder token = new StringBuilder(64);
            for (byte value : signature) token.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
            return token.toString();
        } catch (java.security.GeneralSecurityException error) {
            throw new IllegalStateException("Cannot authenticate widget image.");
        }
    }

    private static File getFolderWithImages`);
}
module.exports = { secureWidgetImageProvider };
