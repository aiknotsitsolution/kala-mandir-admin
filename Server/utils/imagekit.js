const ImageKit = require("imagekit");

const getImageKit = () => {
  const requiredEnv = [
    "IMAGEKIT_PUBLIC_KEY",
    "IMAGEKIT_PRIVATE_KEY",
    "IMAGEKIT_URL_ENDPOINT",
  ];
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);
  if (missingEnv.length) {
    const error = new Error(
      `Missing required ImageKit configuration: ${missingEnv.join(", ")}`,
    );
    error.code = "IMAGEKIT_CONFIG_MISSING";
    throw error;
  }

  return new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
};

module.exports = getImageKit;