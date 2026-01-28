/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Handle better-sqlite3 native module
    config.externals.push({
      'better-sqlite3': 'commonjs better-sqlite3',
    });
    return config;
  },
};

export default nextConfig;
