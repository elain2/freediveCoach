import { useEffect, useRef } from 'react';

interface AdBannerProps {
  unitId: string;
  width?: number;
  height?: number;
}

declare global {
  interface Window {
    adfit?: {
      display: (unitId: string) => void;
      destroy: (unitId: string) => void;
    };
  }
}

export default function AdBanner({ unitId, width = 320, height = 100 }: AdBannerProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.adfit && insRef.current) {
        window.adfit.display(unitId);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (window.adfit) {
        window.adfit.destroy(unitId);
      }
    };
  }, [unitId]);

  return (
    <div className="flex justify-center">
      <ins
        ref={insRef}
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit={unitId}
        data-ad-width={width}
        data-ad-height={height}
      />
    </div>
  );
}
