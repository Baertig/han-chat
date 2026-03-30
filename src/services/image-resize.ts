const MAX_SIZE_BYTES = 200 * 1024
const MAX_DIMENSION = 400

export async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down to max dimension while preserving aspect ratio
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context unavailable'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        // Try progressively lower quality until under size limit
        let quality = 0.9
        let dataUri = canvas.toDataURL('image/jpeg', quality)

        while (dataUri.length > MAX_SIZE_BYTES && quality > 0.1) {
          quality -= 0.1
          dataUri = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(dataUri)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
