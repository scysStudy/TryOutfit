"use client";

import { useCallback, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUploader } from "@/components/ImageUploader";
import { CategorySelector } from "@/components/CategorySelector";
import { GenerateButton } from "@/components/GenerateButton";
import { ResultDisplay } from "@/components/ResultDisplay";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { HistoryPanel } from "@/components/HistoryPanel";
import type { ClothingCategory, HistoryItem, ClothingImage, PersonImage } from "@/types";

export default function HomePage() {
  const {
    state,
    setPersonImage,
    setClothingImage,
    clearCurrent,
    generateTryOn,
    removeFromHistory,
  } = useGame();
  
  const { user, isAuthenticated, logout } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCloudUrl, setUploadCloudUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const handlePersonUpload = useCallback(
    (image: typeof state.personImage) => {
      setPersonImage(image);
      setUploadCloudUrl(null);
      setUploadError(null);
    },
    [setPersonImage]
  );

  const handlePersonRemove = useCallback(() => {
    setPersonImage(null);
    setUploadCloudUrl(null);
    setUploadError(null);
  }, [setPersonImage]);

  const handleClothingUpload = useCallback(
    (image: PersonImage | ClothingImage | null) => {
      if (!image) return;
      setClothingImage(image as ClothingImage);
      if ("category" in image && !selectedCategory) {
        setSelectedCategory("tops");
      }
    },
    [setClothingImage, selectedCategory]
  );

  const handleClothingRemove = useCallback(() => {
    setClothingImage(null);
    setSelectedCategory(null);
    clearCurrent();
  }, [setClothingImage, clearCurrent]);

  const handleCategorySelect = useCallback((category: ClothingCategory) => {
    setSelectedCategory(category);
    if (state.clothingImage) {
      const updatedImage = { ...state.clothingImage, category } as ClothingImage;
      setClothingImage(updatedImage);
    }
  }, [state.clothingImage, setClothingImage]);

  const handleGenerate = useCallback(() => {
    if (!selectedCategory) return;
    generateTryOn();
  }, [selectedCategory, generateTryOn]);

  const handleDownload = useCallback(() => {
    if (!state.currentResult) return;
    const link = document.createElement("a");
    link.href = state.currentResult.resultUrl;
    link.download = `tryon-${Date.now()}.png`;
    link.click();
  }, [state.currentResult]);

  const handleShare = useCallback(() => {
    if (!state.currentResult) return;
    if (navigator.share) {
      navigator.share({
        title: "我的试穿结果",
        text: "看看我的虚拟试穿效果！",
        url: state.currentResult.resultUrl,
      });
    } else {
      navigator.clipboard.writeText(state.currentResult.resultUrl);
      alert("链接已复制到剪贴板！");
    }
  }, [state.currentResult]);

  const handleHistoryItemClick = useCallback((item: HistoryItem) => {
    setPersonImage(item.personImage);
    setClothingImage(item.clothingImage);
    setSelectedCategory(item.clothingImage.category);
  }, [setPersonImage, setClothingImage]);

  const handleDeleteHistoryItem = useCallback(
    (id: string) => {
      removeFromHistory(id);
    },
    [removeFromHistory]
  );

  const handleSubscribe = useCallback(() => {
    alert("订阅功能即将上线！");
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleSendEmail = useCallback(async () => {
    setIsSendingEmail(true);
    setEmailStatus(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || '发送邮件失败');
      }

      setEmailStatus('邮件发送成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      setEmailStatus(`邮件发送失败：${message}`);
    } finally {
      setIsSendingEmail(false);
    }
  }, []);

  const handleUploadToCloud = useCallback(async () => {
    if (!state.personImage) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageDataUrl: state.personImage.url }),
      });

      const data = await response.json();

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Upload failed');
      }

      const cloudUrl = data.url as string;

      setPersonImage({
        ...state.personImage,
        url: cloudUrl,
      });
      setUploadCloudUrl(cloudUrl);
    } catch (error) {
      console.error('上传到云失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [state.personImage, setPersonImage]);

  const canGenerate =
    state.personImage && state.clothingImage && selectedCategory && !state.isGenerating;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                衣服试穿
              </h1>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSendingEmail ? '发送中...' : '发送邮件'}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <CreditsDisplay credits={state.credits} onSubscribe={handleSubscribe} />
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    登出
                  </button>
                </div>
              ) : (
                <a
                  href="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  登录
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {emailStatus && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            {emailStatus}
          </div>
        )}
        {state.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <section className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  上传你的照片
                </h2>
                <button 
                  className="px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                  onClick={handleUploadToCloud}
                  disabled={!state.personImage || isUploading}
                  style={{
                    backgroundColor: state.personImage && !isUploading ? '#2563eb' : '#94a3b8',
                    color: '#ffffff',
                    cursor: (state.personImage && !isUploading) ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => {
                    if (state.personImage && !isUploading) {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (state.personImage && !isUploading) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }
                  }}
                >
                  {isUploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      上传中...
                    </>
                  ) : (
                    '上传到云'
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                上传一张清晰的个人照片，系统将以此为基础生成虚拟试穿效果。
              </p>
              <ImageUploader
                type="person"
                image={state.personImage}
                onImageUpload={handlePersonUpload}
                onImageRemove={handlePersonRemove}
                disabled={state.isGenerating}
              />
              {uploadCloudUrl && (
                <p className="text-xs text-blue-600 mt-2">
                  已上传到云端：
                  <a
                    href={uploadCloudUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline ml-1 break-all"
                  >
                    查看链接
                  </a>
                </p>
              )}
              {uploadError && (
                <p className="text-xs text-red-600 mt-2">
                  上传到云失败：{uploadError}
                </p>
              )}
              {state.personImage && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  照片上传成功
                </p>
              )}
            </section>

            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                上传服装图片
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                上传你想试穿的服装图片，可以来自任何电商平台或自己的照片。
              </p>
              <ImageUploader
                type="clothing"
                image={state.clothingImage}
                onImageUpload={handleClothingUpload}
                onImageRemove={handleClothingRemove}
                disabled={state.isGenerating}
              />
              {state.clothingImage && (
                <>
                  <div className="mt-4">
                    <CategorySelector
                      selected={selectedCategory}
                      onSelect={handleCategorySelect}
                      disabled={state.isGenerating}
                    />
                  </div>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    服装图片上传成功
                  </p>
                </>
              )}
            </section>

            <GenerateButton
              onClick={handleGenerate}
              disabled={!canGenerate}
              isLoading={state.isGenerating}
              creditsRemaining={state.credits.remaining}
            />
          </div>

          <div className="flex flex-col gap-6">
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                试穿预览
              </h2>
              <ResultDisplay
                result={state.currentResult}
                onDownload={handleDownload}
                onShare={handleShare}
                onRegenerate={handleClothingRemove}
                isLoading={state.isGenerating}
              />
            </section>

            <section className="bg-white rounded-xl shadow-sm p-6">
              <HistoryPanel
                items={state.history}
                onItemClick={handleHistoryItemClick}
                onDeleteItem={handleDeleteHistoryItem}
              />
            </section>
          </div>
        </div>

        <section className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            使用流程
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">
                1
              </div>
              <h3 className="font-medium text-gray-900 mb-1">上传照片</h3>
              <p className="text-sm text-gray-500">
                任意日常照片即可，无需特殊姿势或高质量要求。
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold mb-3">
                2
              </div>
              <h3 className="font-medium text-gray-900 mb-1">选择服装</h3>
              <p className="text-sm text-gray-500">
                上传任意服装图片并选择对应的类别。
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mb-3">
                3
              </div>
              <h3 className="font-medium text-gray-900 mb-1">生成预览</h3>
              <p className="text-sm text-gray-500">
                10-20秒内获得AI生成的试穿预览图。
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold mb-3">
                4
              </div>
              <h3 className="font-medium text-gray-900 mb-1">辅助决策</h3>
              <p className="text-sm text-gray-500">
                将预览图作为购买前的参考依据。
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            TryOutfit - 虚拟试衣工具，购前参考
          </p>
          <p className="text-center text-xs text-gray-400 mt-1">
            预览图仅供参考，实际效果可能有所不同。
          </p>
        </div>
      </footer>
    </div>
  );
}
