"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUploadZone } from "@/components/file-upload-zone";
import { FileCard } from "@/components/file-card";
import { LoginModal } from "@/components/login-modal";
import { RegisterModal } from "@/components/register-modal";
import { Sparkles, Info, UploadIcon, LogOut, User } from "lucide-react";
import {
  compressImage,
  compressVideo,
  isImageFile,
  isVideoFile,
  formatFileSize,
} from "@/lib/compression";
import type { CompressionResult } from "@/lib/compression";

interface FileWithStatus {
  file: File;
  id: string;
  result?: CompressionResult;
  isCompressing?: boolean;
  progress?: number;
}

export default function Home() {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [quality, setQuality] = useState([75]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const currentUser = localStorage.getItem("currentUser");
        if (currentUser) {
          try {
            const user = JSON.parse(currentUser);
            setIsAuthenticated(true);
            setUserEmail(user.email);
          } catch (error) {
            console.error("Error parsing user data:", error);
            localStorage.removeItem("currentUser");
          }
        }
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setShowLoginModal(false);
  };

  const handleRegisterSuccess = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setShowRegisterModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setIsAuthenticated(false);
    setUserEmail(null);
    setFiles([]);
  };

  const handleFilesSelected = (newFiles: File[]) => {
    // Check authentication before allowing file upload
    // if (!isAuthenticated) {
    //   setShowLoginModal(true);
    //   return;
    // }

    const filesWithStatus: FileWithStatus[] = newFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));
    setFiles((prev) => [...prev, ...filesWithStatus]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCompressAll = async () => {
    setIsProcessing(true);
    const qualityValue = quality[0] / 100;

    for (let i = 0; i < files.length; i++) {
      const fileStatus = files[i];
      if (fileStatus.result) continue; // Skip already compressed files

      // Update status to compressing
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileStatus.id
            ? { ...f, isCompressing: true, progress: 0 }
            : f
        )
      );

      try {
        let result: CompressionResult;
        console.log("fileStatus.file", fileStatus.file);

        if (isImageFile(fileStatus.file)) {
          result = await compressImage(fileStatus.file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
          console.log("result", result);
          // Update immediately for images
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileStatus.id
                ? { ...f, result, isCompressing: false, progress: 100 }
                : f
            )
          );
        } else if (isVideoFile(fileStatus.file)) {
          console.log("fileStatus.file", fileStatus.file);
          result = await compressVideo(fileStatus.file);
          console.log("Video compression result", result);
          // Update status after video compression
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileStatus.id
                ? { ...f, result, isCompressing: false, progress: 100 }
                : f
            )
          );
        }
      } catch (error) {
        console.error("Compression error:", error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileStatus.id ? { ...f, isCompressing: false } : f
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleUploadAll = () => {
    // Placeholder for actual upload logic
    console.log(
      "[v0] Uploading compressed files...",
      files.filter((f) => f.result).map((f) => f.result)
    );
    alert("Upload functionality would be implemented here!");
  };

  const totalOriginalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const totalCompressedSize = files.reduce(
    (sum, f) => sum + (f.result?.compressedSize || f.file.size),
    0
  );
  const totalSavings =
    totalOriginalSize > 0
      ? Math.round((1 - totalCompressedSize / totalOriginalSize) * 100)
      : 0;

  const allCompressed = files.length > 0 && files.every((f) => f.result);
  const hasUncompressedFiles = files.some((f) => !f.result);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-balance">
              Asset Compressify
            </h1>
          </div>
          <p className="text-muted-foreground text-lg text-balance">
            Compress images and videos before uploading to save bandwidth and
            storage
          </p>
          {/* Auth Status */}
          <div className="mt-4 flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {userEmail}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLoginModal(true)}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                Login
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Upload Zone */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>
                  Select images or videos to compress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFilesSelected={handleFilesSelected}
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>

            {/* File List */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Files ({files.length})</CardTitle>
                  <CardDescription>
                    Review and manage your uploaded files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {files.map((fileStatus) => (
                    <FileCard
                      key={fileStatus.id}
                      file={fileStatus.file}
                      onRemove={() => handleRemoveFile(fileStatus.id)}
                      compressionResult={fileStatus.result}
                      isCompressing={fileStatus.isCompressing}
                      compressionProgress={fileStatus.progress}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {allCompressed && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  All files compressed! Total savings:{" "}
                  <strong className="text-primary">{totalSavings}%</strong> (
                  {formatFileSize(totalOriginalSize - totalCompressedSize)}{" "}
                  saved)
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Compression Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Compression Quality</CardTitle>
                <CardDescription>Adjust the quality level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Quality</Label>
                    <span className="text-sm font-mono font-semibold bg-muted px-2 py-1 rounded">
                      {quality[0]}%
                    </span>
                  </div>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    min={10}
                    max={100}
                    step={5}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower values = smaller files but lower quality
                  </p>
                </div> */}

                <Separator />

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCompressAll}
                    disabled={
                      files.length === 0 ||
                      isProcessing ||
                      !hasUncompressedFiles
                    }
                  >
                    <Sparkles className="w-4 h-4" />
                    {isProcessing ? "Compressing..." : "Compress All"}
                  </Button>

                  {allCompressed && (
                    <>
                      {isAuthenticated ? (
                        <Button
                          className="w-full bg-transparent"
                          size="lg"
                          variant="outline"
                          onClick={handleUploadAll}
                        >
                          <UploadIcon className="w-4 h-4" />
                          Upload to Server
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLoginModal(true)}
                          className="w-full bg-transparent"
                        >
                          <User className="w-4 h-4" />
                          Login to Upload
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Files</span>
                    <span className="font-semibold">{files.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Original Size</span>
                    <span className="font-semibold">
                      {formatFileSize(totalOriginalSize)}
                    </span>
                  </div>
                  {allCompressed && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Compressed Size
                        </span>
                        <span className="font-semibold">
                          {formatFileSize(totalCompressedSize)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Saved
                        </span>
                        <span className="font-semibold text-primary">
                          {totalSavings}%
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}
