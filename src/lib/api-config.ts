export const API_CONFIG = {
  baseUrl: process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3",
  model: "doubao-seedream-5-0-260128",
  size: "3K",
  timeout: 30000,
} as const;

export const API_ENDPOINTS = {
  images: "/images/generations",
} as const;
