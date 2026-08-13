/**
 * @deprecated renderEngine.js — SUPERSEDED
 *
 * This file has been superseded by the unified Canvas renderer at:
 *   lib/generator/renderer/canvasRenderer.js
 *
 * It is intentionally retained (not deleted) until the new renderer has been
 * verified across all five templates in production.
 *
 * DO NOT add new code here.
 * DO NOT import from this file in new code.
 *
 * When verified, this file will be deleted.
 * See: rendering_audit.md § 10 — Files to Create / Modify
 */

// Re-export from the new location so any lingering imports don't break at build time.
export { resolveImageSrc, renderCard, renderCardIntoCanvas } from './renderer/canvasRenderer.js';
