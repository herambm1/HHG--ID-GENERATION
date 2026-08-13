/**
 * @deprecated BaseTemplate.jsx — DEAD CODE, DO NOT USE
 *
 * This component is an orphaned HTML/CSS recreation of the Base template card.
 * It is NOT rendered anywhere in the production user flow (app/page.js uses
 * PreviewCanvas.jsx via the Canvas renderer instead).
 *
 * Retained (not deleted) until the new Canvas renderer has been verified
 * across all five templates in production.
 *
 * When verified, this file and BaseTemplate.module.css will be removed.
 */
'use client';

import { useMemo } from 'react';
import styles from './BaseTemplate.module.css';

/**
 * BaseTemplate
 * Pure HTML/CSS version of the Classic Base design.
 */
export default function BaseTemplate({ userImageUrl, cropParams, userData, templateConfig }) {
  // Compute photo cropping style from cropParams
  const photoStyle = useMemo(() => {
    if (!userImageUrl || !cropParams) return {};
    const { centerX = 0.5, centerY = 0.5, zoom = 1 } = cropParams;
    return {
      objectPosition: `${centerX * 100}% ${centerY * 100}%`,
      transform: `scale(${zoom})`,
    };
  }, [userImageUrl, cropParams]);

  return (
    <div className={styles.templateContainer}>
      {/* Decorative Border Layer */}
      <div className={styles.innerBorder}></div>
      <div className={styles.cornerTopLeft}></div>
      <div className={styles.cornerTopRight}></div>
      <div className={styles.cornerBottomLeft}></div>
      <div className={styles.cornerBottomRight}></div>

      {/* Header Area */}
      <div className={styles.header}>
        <div className={styles.timeTag}>
          <span className={styles.timeTagHighlight}>2:47</span>PM<br/>
          STUDIO
        </div>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>HACKER <span className={styles.goaText}>गोवा</span> HOUSE</h1>
          <p className={styles.subtitle}>GOA, INDIA &bull; 28 - 31 OCT 2026</p>
        </div>
        <div className={styles.techIcon}>
          <div className={styles.techIconInner}>{'>_'}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.content}>
        {/* Photo Region */}
        <div className={styles.photoRegion}>
          <div className={styles.photoFrame}>
            {userImageUrl ? (
              <img 
                src={userImageUrl} 
                alt="User" 
                className={styles.userPhoto}
                style={photoStyle}
              />
            ) : (
              <div className={styles.photoPlaceholder}></div>
            )}
          </div>
        </div>

        {/* Input Fields Region */}
        <div className={styles.fieldsRegion}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldLabel}>
              <span className={styles.fieldLabelIcon}>👤</span>
              <span className={styles.fieldLabelText}>NAME</span>
            </div>
            <div className={styles.fieldValue}>{userData?.name?.toUpperCase() || ''}</div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLabel}>
              <span className={styles.fieldLabelIcon}>💼</span>
              <span className={styles.fieldLabelText}>ROLE / POST</span>
            </div>
            <div className={styles.fieldValue}>{userData?.role?.toUpperCase() || ''}</div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLabel}>
              <span className={styles.fieldLabelIcon}>👥</span>
              <span className={styles.fieldLabelText}>TEAM / STACK</span>
            </div>
            <div className={styles.fieldValue}>{userData?.team?.toUpperCase() || ''}</div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLabel}>
              <span className={styles.fieldLabelIcon}>#</span>
              <span className={styles.fieldLabelText}>BUILDER ID</span>
            </div>
            <div className={`${styles.fieldValue} ${styles.builderIdValue}`}>
              {userData?.builderId || ''}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className={styles.footer}>
        <div className={styles.footerBadge}>
          <span className={styles.est}>EST.</span>
          <div className={styles.footerBadgeText}>BUILDER</div>
          <span className={styles.year}>2026</span>
          <div className={styles.footerGoa}>गोवा</div>
        </div>
        <div className={styles.hashtag}>#FrameInGoa</div>
      </div>
    </div>
  );
}
