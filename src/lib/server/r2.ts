import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { settings } from '@/lib/common'

const S3 = new S3Client({
  region: 'auto',
  endpoint: settings.R2_ENDPOINT,
  credentials: {
    accessKeyId: settings.R2_ACCESS_KEY_ID,
    secretAccessKey: settings.R2_SECRET_ACCESS_KEY,
  },
})

export async function generateSignedUrl(key: string) {
  return await getSignedUrl(
    S3,
    new PutObjectCommand({
      Bucket: settings.R2_BUCKET_NAME,
      Key: `${settings.RESOURCE_FOLDER}/image/${settings.RESOURCE_UPLOAD_PATH}/${key}`,
    }),
    {
      expiresIn: 60 * 3,
    },
  )
}
