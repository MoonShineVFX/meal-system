const secrets = {
  /* Auth */
  AUTH_API_URL: process.env.AUTH_API_URL!,
  /* TWMP */
  TWMP_API_URL: process.env.TWMP_API_URL!,
  TWMP_ACQ_BANK: process.env.TWMP_ACQ_BANK!,
  TWMP_MERCHANT_ID: process.env.TWMP_MERCHANT_ID!,
  TWMP_TERMINAL_ID: process.env.TWMP_TERMINAL_ID!,
  TWMP_3DES_IV: process.env.TWMP_3DES_IV!,
  TWMP_3DES_KEY: process.env.TWMP_3DES_KEY!,
}

export default secrets
