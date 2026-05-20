import { getApiUrl, toMessage } from './utils'

type AssetUploadHttpResponse = {
  url?: string
  Url?: string
}

type UploadBoardAssetOptions = {
  onUploadError?: (message: string) => void
  signal?: AbortSignal
}

function getStoredAssetUrl(response: AssetUploadHttpResponse) {
  return response.url ?? response.Url ?? null
}

async function readUploadFailureMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string; title?: string }
    return payload.detail ?? payload.title ?? `Upload failed with status ${response.status}.`
  } catch {
    return `Upload failed with status ${response.status}.`
  }
}

export async function uploadBoardAsset(file: File, options: UploadBoardAssetOptions = {}) {
  const formData = new FormData()
  formData.set('file', file, file.name)

  try {
    const response = await fetch(getApiUrl('/assets'), {
      method: 'POST',
      body: formData,
      signal: options.signal,
    })

    if (!response.ok) {
      throw new Error(await readUploadFailureMessage(response))
    }

    const storedAsset = (await response.json()) as AssetUploadHttpResponse
    const src = getStoredAssetUrl(storedAsset)
    if (!src) {
      throw new Error('Upload completed without a usable asset URL.')
    }

    return src
  } catch (error) {
    options.onUploadError?.(toMessage(error))
    throw error
  }
}
