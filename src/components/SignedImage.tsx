import { useEffect, useRef, useState } from "react";
import { getSignedPhotoUrl, refreshSignedPhotoUrl } from "@/lib/signedUrls";

interface SignedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  path: string;
}

/**
 * Renders an image stored in the private profiling-photos bucket by minting a
 * short-lived signed URL server-side.
 */
export default function SignedImage({ path, ...imgProps }: SignedImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const retried = useRef(false);

  useEffect(() => {
    let cancelled = false;
    retried.current = false;
    setUrl(null);
    getSignedPhotoUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url) return null;
  return (
    <img
      src={url}
      {...imgProps}
      onError={(e) => {
        if (!retried.current) {
          retried.current = true;
          refreshSignedPhotoUrl(path).then((u) => u && setUrl(u));
        }
        imgProps.onError?.(e);
      }}
    />
  );
}
