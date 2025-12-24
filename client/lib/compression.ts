import imageCompression from "browser-image-compression";
import {FFmpeg} from '@ffmpeg/ffmpeg';
import {fetchFile} from '@ffmpeg/util'
export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight?: number;
  useWebWorker?: Boolean;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  url: string;
}

// export async function compressImage(file: File, options: CompressionOptions): Promise<CompressionResult> {
//   const originalSize = file.size

//   return new Promise((resolve, reject) => {
//     const reader = new FileReader()
//     reader.readAsDataURL(file)
//     reader.onload = (e) => {
//       const img = new Image()
//       img.src = e.target?.result as string
//       img.onload = () => {
//         const canvas = document.createElement("canvas")
//         let { width, height } = img

//         // Apply max dimensions if specified
//         if (options.maxWidth && width > options.maxWidth) {
//           height = (height * options.maxWidth) / width
//           width = options.maxWidth
//         }
//         if (options.maxHeight && height > options.maxHeight) {
//           width = (width * options.maxHeight) / height
//           height = options.maxHeight
//         }

//         canvas.width = width
//         canvas.height = height

//         const ctx = canvas.getContext("2d")
//         if (!ctx) {
//           reject(new Error("Could not get canvas context"))
//           return
//         }

//         ctx.drawImage(img, 0, 0, width, height)

//         canvas.toBlob(
//           (blob) => {
//             if (!blob) {
//               reject(new Error("Compression failed"))
//               return
//             }

//             const compressedFile = new File([blob], file.name, {
//               type: file.type,
//               lastModified: Date.now(),
//             })

//             resolve({
//               file: compressedFile,
//               originalSize,
//               compressedSize: blob.size,
//               compressionRatio: Math.round((1 - blob.size / originalSize) * 100),
//               url: canvas.toDataURL(file.type, options.quality),
//             })
//           },
//           file.type,
//           options.quality,
//         )
//       }
//       img.onerror = () => reject(new Error("Failed to load image"))
//     }
//     reader.onerror = () => reject(new Error("Failed to read file"))
//   })
// }

export async function compressImage(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  const originalSize = file.size;
  console.log("originalSize", originalSize);

  try {
    const compressedFile = await imageCompression(file, options);
    console.log("compressedFile", compressedFile);
    // return compressedFile;
    return {
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      compressionRatio: Math.floor(
        ((originalSize - compressedFile.size) / originalSize) * 100
      ),
      url: "",
    };
  } catch (error) {
    console.log("error while compressing image");
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      url: "",
    };
  }
}

// export async function compressVideo(
//   file: File,
//   options: CompressionOptions,
//   onProgress?: (progress: number) => void
// ): Promise<CompressionResult> {
//   // For client-side video compression, we use a simplified approach
//   // In production, you'd want to use FFmpeg.wasm or a server-side solution
//   const originalSize = file.size;
//   const url = URL.createObjectURL(file);

//   // Simulate compression progress
//   if (onProgress) {
//     for (let i = 0; i <= 100; i += 10) {
//       await new Promise((resolve) => setTimeout(resolve, 200));
//       onProgress(i);
//     }
//   }

//   // Note: Actual video compression would require FFmpeg.wasm
//   // For now, we return the original file as a placeholder
//   return {
//     file,
//     originalSize,
//     compressedSize: Math.round(originalSize * (1 - options.quality * 0.3)),
//     compressionRatio: Math.round(options.quality * 30),
//     url,
//   };
// }


const ffmpeg = new FFmpeg();
export async function compressVideo(file: File){
    if(!ffmpeg.loaded){
      await ffmpeg.load({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm'
      })
    }

    await ffmpeg.writeFile("input.mp4" , await fetchFile(file));

    await ffmpeg.exec([
      "-i", "input.mp4",
      "-vcodec", "libx264",
      "-preset", "fast",
      "-crf", "26",
      "output.mp4"
    ]);

    const data = await ffmpeg.readFile("output.mp4");

    return new File([data.buffer] , "compressed.mp4" , {type: 'video/mp4'});
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${
    sizes[i]
  }`;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}
