/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: [
      "better-sqlite3",
      "crawlee",
      "playwright",
      "cheerio",
    ],
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({
      "better-sqlite3": "commonjs better-sqlite3",
    });
    return config;
  },
};

export default nextConfig;
