'use client';

import { useCallback, useRef, useState } from 'react';
import { ACCEPTED_EXTENSIONS, UPLOAD_STATUS } from '@/lib/upload/constants';
import { normalizeUploadedFile, revokePreviewUrl } from '@/lib/upload/imageUtils';
import styles from './ImageUploader.module.css';

/**
 * ImageUploader
 *
 * Responsibilities:
 * - Click/tap to browse files
 * - Drag-and-drop on desktop
 * - File validation (type + size)
 * - Image decodability check (with HEIC detection)
 * - Preview with file metadata
 * - Replace / remove image
 * - Object URL lifecycle management (no memory leaks)
 *
 * Props:
 * @param {function} onImageReady  - Called with a NormalizedImage when an image is successfully loaded.
 * @param {function} onImageCleared - Called when the image is removed.
 * @param {NormalizedImage|null} value - Controlled current image (optional).
 */
export default function ImageUploader({ onImageReady, onImageCleared, value }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(UPLOAD_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [heicNote, setHeicNote] = useState(false);

  // Internal image state — only used when uncontrolled (value prop not provided)
  const [internalImage, setInternalImage] = useState(null);
  const image = value !== undefined ? value : internalImage;

  /** Process a File through the upload pipeline */
  const processFile = useCallback(
    async (file) => {
      setStatus(UPLOAD_STATUS.LOADING);
      setError(null);
      setHeicNote(false);

      // Revoke previous URL if we have one internally
      if (image?.previewUrl) {
        revokePreviewUrl(image.previewUrl);
      }

      // Check if this is a HEIC file — show conversion note in UI
      const ext = file.name?.split('.').pop()?.toLowerCase();
      const isHeic = ext === 'heic' || ext === 'heif' ||
        file.type === 'image/heic' || file.type === 'image/heif';
      if (isHeic) {
        setHeicNote(true);
      }

      const { image: normalized, error: uploadError } = await normalizeUploadedFile(file);

      if (uploadError) {
        setStatus(UPLOAD_STATUS.ERROR);
        setError(uploadError);
        setHeicNote(false);
        setInternalImage(null);
        onImageCleared?.();
        return;
      }

      setHeicNote(false);
      setInternalImage(normalized);
      setStatus(UPLOAD_STATUS.SELECTED);
      onImageReady?.(normalized);
    },
    [image, onImageReady, onImageCleared]
  );

  /** Handle file input change */
  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input so the same file can be re-selected after removal
      e.target.value = '';
    },
    [processFile]
  );

  /** Remove the selected image */
  const handleRemove = useCallback(() => {
    if (image?.previewUrl) {
      revokePreviewUrl(image.previewUrl);
    }
    setInternalImage(null);
    setStatus(UPLOAD_STATUS.IDLE);
    setError(null);
    setHeicNote(false);
    onImageCleared?.();
  }, [image, onImageCleared]);

  /** Trigger file picker via hidden input */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // --- Drag-and-drop handlers ---
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear dragging if leaving the dropzone itself (not a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  /** Allow keyboard activation of the dropzone (Enter / Space) */
  const handleDropzoneKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFilePicker();
      }
    },
    [openFilePicker]
  );

  // Format helpers
  const formatBytes = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDimensions = (img) => {
    if (img?.width && img?.height) return `${img.width} × ${img.height} px`;
    return null;
  };

  // ---- RENDER ----

  // Loading state
  if (status === UPLOAD_STATUS.LOADING) {
    return (
      <div className={styles.uploaderWrapper}>
        <div className={styles.loadingState} aria-live="polite" aria-label="Processing image">
          <div className={styles.spinner} role="status" />
          <span className={styles.loadingText}>
            {heicNote ? 'Converting iPhone photo\u2026' : 'Reading image\u2026'}
          </span>
        </div>
      </div>
    );
  }

  // Preview state
  if ((status === UPLOAD_STATUS.SELECTED || image) && image) {
    return (
      <div className={styles.uploaderWrapper}>
        <div className={styles.previewWrapper}>
          <div className={styles.previewCard}>
            {/* Preview bar */}
            <div className={styles.previewBar}>
              <span className={styles.previewBarLabel}>&gt;_ image loaded</span>
              <span className={styles.previewBarStatus}>✓ READY</span>
            </div>

            {/* Image */}
            <div className={styles.previewImageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl}
                alt="Your uploaded photo preview"
                className={styles.previewImage}
              />
            </div>

            {/* File meta */}
            <div className={styles.previewMeta}>
              <span className={styles.previewFileName} title={image.file.name}>
                {image.file.name}
              </span>
              <span className={styles.previewFileMeta}>
                {formatBytes(image.file.size)}
                {formatDimensions(image) ? ` · ${formatDimensions(image)}` : ''}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.previewActions}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={openFilePicker}
              aria-label="Replace image"
            >
              ↺ Replace
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleRemove}
              aria-label="Remove image"
            >
              ✕ Remove
            </button>
          </div>

          {/* Hidden input for replace */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleInputChange}
            className={styles.fileInput}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>
    );
  }

  // Idle / Error state — show dropzone
  return (
    <div className={styles.uploaderWrapper}>
      {/* Drop zone */}
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload a photo. Click or drag and drop an image file here."
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={handleDropzoneKeyDown}
        onClick={openFilePicker}
      >
        {/* Hidden native file input (accessible, receives real file selection) */}
        <input
          ref={fileInputRef}
          id="photo-upload-input"
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleInputChange}
          className={styles.fileInput}
          aria-label="Select a photo file"
          // Stop click from bubbling to the parent div and triggering openFilePicker again
          onClick={(e) => e.stopPropagation()}
        />

        {/* Icon */}
        <div className={styles.dropzoneIcon} aria-hidden="true">
          <span>↑</span>
        </div>

        {isDragging ? (
          <p className={styles.dropzoneDragging}>Drop your photo here</p>
        ) : (
          <>
            <p className={styles.dropzoneTitle}>Upload your photo</p>
            <p className={styles.dropzoneSub}>
              <span className={styles.dropzoneHighlight}>Click to browse</span>{' '}
              or drag &amp; drop a file here
            </p>
          </>
        )}

        <p className={styles.formatsLabel}>
          <span>JPG</span><b>•</b><span>PNG</span><b>•</b><span>WEBP</span><b>•</b><span>HEIC</span>
        </p>
      </div>

      {/* Error message */}
      {error && !heicNote && (
        <div
          className={styles.errorBox}
          role="alert"
          aria-live="assertive"
        >
          <span className={styles.errorIcon} aria-hidden="true">!</span>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {/* HEIC-specific informational note */}
      {heicNote && (
        <div className={styles.heicNote} role="alert" aria-live="polite">
          <p className={styles.heicNoteText}>
            <strong>HEIC image detected.</strong>{' '}
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
