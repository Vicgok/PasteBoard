type DeviceInfo = {
  platform: string; // OS (Windows, macOS, Android…)
  browser: string; // Chrome, Firefox, Safari…
  version: string; // browser version
};

export const getDeviceInfo = (): DeviceInfo => {
  //   const nav = navigator as Navigator & {
  //     userAgentData?: {
  //       platform: string;
  //       brands?: { brand: string; version: string }[];
  //     };
  //   };

  //   // ✅ Chrome/Edge/Opera (User-Agent Client Hints)
  //   if (nav.userAgentData) {
  //     const brandEntry =
  //       nav.userAgentData.brands?.find(
  //         (b) => b.brand !== "Not A(Brand)" && b.brand !== "Chromium"
  //       ) || nav.userAgentData.brands?.[0];

  //     return {
  //       platform: nav.userAgentData.platform || "Unknown",
  //       browser: brandEntry?.brand || "Unknown",
  //       version: brandEntry?.version || "Unknown",
  //     };
  //   }

  // ✅ Fallback for Firefox & Safari
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let version = "Unknown";

  if (/firefox/i.test(ua)) {
    browser = "Firefox";
    version = ua.match(/Firefox\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/chrome|chromium|crios/i.test(ua)) {
    browser = "Chrome";
    version = ua.match(/Chrome\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/safari/i.test(ua)) {
    browser = "Safari";
    version = ua.match(/Version\/([\d.]+)/)?.[1] || "Unknown";
  }

  return {
    platform: navigator.platform,
    browser,
    version,
  };
};
