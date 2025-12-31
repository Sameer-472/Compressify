"use client";

import imageCompression from "browser-image-compression";
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

export async function compressVideo(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  try {
    console.log(
      "Starting video compression for:",
      file.name,
      "Size:",
      originalSize
    );

    // Dynamically import FFmpeg to avoid "expression is too dynamic" error
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile } = await import("@ffmpeg/util");

    // Create FFmpeg instance inside the function
    const ffmpeg = new FFmpeg();

    // Add logging for FFmpeg operations
    ffmpeg.on("log", ({ message }) => {
      console.log("FFmpeg log:", message);
    });

    // Use jsdelivr CDN for FFmpeg core files (more reliable)
    // Using version 0.12.6 which is compatible with @ffmpeg/ffmpeg 0.12.x
    const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";

    console.log("Loading FFmpeg core...");
    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });
      console.log("FFmpeg core loaded successfully");
    }

    // Get file extension
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const inputFileName = `input_${Date.now()}.${fileExt}`;
    const outputFileName = `output_${Date.now()}.mp4`;

    console.log("Writing input file:", inputFileName);
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    console.log("Input file written");

    // Execute compression with better settings
    console.log("Starting FFmpeg compression...");
    // await ffmpeg.exec([
    //   "-i", inputFileName,
    //    "-vf", "scale=1280:-2",
    //   "-c:v", "libx264",
    //   "-preset", "ultrafast",
    //   "-crf", "30", // Higher CRF = more compression (18-28 is good range)
    //   "-c:a", "aac",
    //   "-b:a", "128k",
    //   "-movflags", "+faststart",
    //   outputFileName
    // ]);
    await ffmpeg.exec([
      "-i",
      inputFileName,
      "-vf",
      "scale=1280:-2",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "30",
      "-threads",
      "1",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      outputFileName,
    ]);
    console.log("FFmpeg compression completed");

    // Read compressed file
    console.log("Reading compressed file...");
    const data = await ffmpeg.readFile(outputFileName);
    console.log("Compressed file read, size:", data.length);

    // Clean up files
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (cleanupError) {
      console.warn("Error cleaning up files:", cleanupError);
    }

    // Create compressed File object
    const compressedFile = new File(
      [new Uint8Array(data as Uint8Array)],
      file.name.replace(/\.[^/.]+$/, "") + "_compressed.mp4",
      { type: "video/mp4" }
    );

    const compressedSize = compressedFile.size;
    const compressionRatio = Math.floor(
      ((originalSize - compressedSize) / originalSize) * 100
    );
    const url = URL.createObjectURL(compressedFile);

    const savedBytes = originalSize - compressedSize;
    console.log("Video compression result:", {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
      compressionRatio: `${compressionRatio}%`,
      saved: `${(savedBytes / 1024 / 1024).toFixed(2)} MB`,
    });

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      url,
    };
  } catch (error) {
    console.error("Error compressing video:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return original file if compression fails
    const url = URL.createObjectURL(file);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      url,
    };
  }
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
