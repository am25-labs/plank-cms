import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { getSetting } from '../../lib/settings.js'
import type { MediaProvider, UploadOptions } from '../index.js'

async function getConfig() {
  const [accessKeyId, secretAccessKey, region, bucket, pathPrefix, publicUrl] =
    await Promise.all([
      getSetting('media', 's3.access_key_id'),
      getSetting('media', 's3.secret_access_key'),
      getSetting('media', 's3.region'),
      getSetting('media', 's3.bucket'),
      getSetting('media', 's3.path_prefix'),
      getSetting('media', 's3.public_url'),
    ])

  return { accessKeyId, secretAccessKey, region, bucket, pathPrefix, publicUrl }
}

function buildClient(cfg: Awaited<ReturnType<typeof getConfig>>) {
  if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.region) {
    throw new Error('S3 provider is not configured. Set access_key_id, secret_access_key, and region in Settings > Media.')
  }
  return new S3Client({
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  })
}

function buildKey(cfg: Awaited<ReturnType<typeof getConfig>>, filename: string, prefix?: string): string {
  const ext = extname(filename)
  const name = `${randomBytes(16).toString('hex')}${ext}`
  const parts = [cfg.pathPrefix?.replace(/\/$/, ''), prefix, name].filter(Boolean)
  return parts.join('/')
}

function withPathPrefix(cfg: Awaited<ReturnType<typeof getConfig>>, key: string): string {
  return [cfg.pathPrefix?.replace(/\/$/, ''), key.replace(/^\//, '')].filter(Boolean).join('/')
}

function buildStoredUrl(cfg: Awaited<ReturnType<typeof getConfig>>, key: string): string {
  return cfg.publicUrl
    ? `${cfg.publicUrl.replace(/\/$/, '')}/${key}`
    : `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`
}

export const s3Provider: MediaProvider = {
  async upload(file, options?: UploadOptions) {
    const cfg = await getConfig()
    const client = buildClient(cfg)

    const key = buildKey(cfg, file.originalname, options?.prefix)

    await client.send(new PutObjectCommand({
      Bucket: cfg.bucket!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }))

    return { url: buildStoredUrl(cfg, key), key }
  },

  async uploadRaw(buffer, key, mimeType) {
    const cfg = await getConfig()
    const client = buildClient(cfg)
    const fullKey = withPathPrefix(cfg, key)
    await client.send(new PutObjectCommand({
      Bucket: cfg.bucket!,
      Key: fullKey,
      Body: buffer,
      ContentType: mimeType,
    }))
    return { url: buildStoredUrl(cfg, fullKey), key: fullKey }
  },

  async delete(key) {
    const cfg = await getConfig()
    const client = buildClient(cfg)
    await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket!, Key: key }))
  },

  async deletePrefix(prefix) {
    const cfg = await getConfig()
    const client = buildClient(cfg)
    const fullPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`
    let continuationToken: string | undefined
    do {
      const list = await client.send(new ListObjectsV2Command({
        Bucket: cfg.bucket!,
        Prefix: fullPrefix,
        ContinuationToken: continuationToken,
      }))
      const objects = (list.Contents ?? [])
        .map((o) => (o.Key ? { Key: o.Key } : null))
        .filter((o): o is { Key: string } => o !== null)
      if (objects.length > 0) {
        await client.send(new DeleteObjectsCommand({
          Bucket: cfg.bucket!,
          Delete: { Objects: objects, Quiet: true },
        }))
      }
      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
    } while (continuationToken)
  },

  async getUrl(key) {
    const cfg = await getConfig()
    return buildStoredUrl(cfg, key)
  },

  async presign(filename, mimeType, options) {
    const cfg = await getConfig()
    const client = buildClient(cfg)
    const key = buildKey(cfg, filename, options?.prefix)
    const command = new PutObjectCommand({ Bucket: cfg.bucket!, Key: key, ContentType: mimeType })
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 })
    return { key, uploadUrl, publicUrl: buildStoredUrl(cfg, key) }
  },
}
