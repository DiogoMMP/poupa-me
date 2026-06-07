module.exports = {
  "/api": {
    "target": process.env.BACKEND_URL || "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "cookieDomainRewrite": "localhost",
    "cookiePathRewrite": "/"
  }
};
