'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import ImageUploader from '@/components/generator/ImageUploader';
import {
  generateBuilderId,
  OUTPUT_TYPES,
  TEMPLATE_CATALOGUE,
} from '@/lib/generator/templateConfig';
import goaBackground from '../Reference/Gemini_Generated_Image_f5c3yaf5c3yaf5c3.png';
import styles from './page.module.css';

const benefits = [
  {
    title: '100% Private',
    detail: 'Your photos stay\non your device',
    tone: 'private',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
        <path d="m8.8 12 2.1 2.1 4.5-4.6" />
      </svg>
    ),
  },
  {
    title: 'Instant Preview',
    detail: 'See how it looks\nin real-time',
    tone: 'instant',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m13.4 2-7 11h5.2L10.7 22l7-11h-5.2L13.4 2Z" />
      </svg>
    ),
  },
  {
    title: 'Perfect Fit',
    detail: 'Smart cropping\n& adjustments',
    tone: 'fit',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
        <path d="m18.5 15 .8 2.7L22 18.5l-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8.8-2.7Z" />
      </svg>
    ),
  },
];

function ContinueButton({ disabled, onClick, children = 'Continue' }) {
  return (
    <button
      type="button"
      className={styles.continueButton}
      disabled={disabled}
      onClick={onClick}
    >
      {children} <span aria-hidden="true">→</span>
    </button>
  );
}

export default function HomePage() {
  const [step, setStep] = useState(1);
  const [generator, setGenerator] = useState(() => ({
    photo: null,
    outputType: null,
    template: null,
    name: '',
    role: '',
    team: '',
    builderId: generateBuilderId(),
  }));
  const [futureNotice, setFutureNotice] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);

  const maxSteps = generator.outputType === 'pfp' ? 3 : 4;

  const templates = useMemo(
    () => TEMPLATE_CATALOGUE.filter((template) => template.outputType === generator.outputType),
    [generator.outputType]
  );

  const setPhoto = (photo) => {
    setGenerator((prev) => ({ ...prev, photo, outputType: null, template: null }));
    setFutureNotice(false);
  };

  const setOutputType = (outputType) => {
    setGenerator((current) => ({
      ...current,
      outputType,
      template: current.outputType === outputType ? current.template : null,
    }));
    setFutureNotice(false);
    setActiveSlide(0);
  };

  const setTemplate = (templateId) => {
    setGenerator((current) => ({ ...current, template: templateId }));
    setFutureNotice(false);
  };

  const handleInputChange = (field, value) => {
    setGenerator((prev) => ({ ...prev, [field]: value }));
    setFutureNotice(false);
  };

  // Carousel scroll handling for mobile Step 3
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollPosition = container.scrollLeft;
    const slideWidth = container.clientWidth;
    if (slideWidth > 0) {
      const index = Math.round(scrollPosition / slideWidth);
      if (index >= 0 && index < templates.length) {
        setActiveSlide(index);
      }
    }
  };

  const scrollToSlide = (index) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: index * slideWidth,
      behavior: 'smooth',
    });
    setActiveSlide(index);
  };

  const isDetailsValid =
    generator.name.trim().length > 0 && generator.role.trim().length > 0;

  const selectionScreen = step > 1;

  return (
    <div className={`${styles.uploadPage} ${selectionScreen ? styles.selectionFlow : ''}`}>
      <Image
        src={goaBackground}
        alt=""
        priority
        fill
        sizes="100vw"
        className={styles.backgroundArt}
      />
      <div className={styles.backdrop} aria-hidden="true" />

      {/* STEP 1: UPLOAD PHOTO */}
      {step === 1 && (
        <div className={styles.content}>
          <section className={styles.uploadSection} aria-labelledby="upload-title">
            <div className={styles.pageHeader}>
              <p className={styles.stepLabel}>Step 1 of 4</p>
              <h1 id="upload-title" className={styles.pageTitle}>
                Upload your <span>photo</span>
              </h1>
              <p className={styles.pageDesc}>
                Choose a clear photo of yourself. JPG, PNG, and WEBP are supported. HEIC support is coming soon for iPhone photos.
              </p>
            </div>

            <ImageUploader
              value={generator.photo}
              onImageReady={setPhoto}
              onImageCleared={() => setPhoto(null)}
            />

            {generator.photo && (
              <p className={styles.nextHint}>Photo ready &middot; Your selection stays with you</p>
            )}
            <div className={styles.uploadContinue}>
              <ContinueButton disabled={!generator.photo} onClick={() => setStep(2)} />
            </div>
          </section>

          <section className={styles.benefits} aria-label="Upload benefits">
            {benefits.map((benefit) => (
              <article className={styles.benefit} key={benefit.title}>
                <span className={`${styles.benefitIcon} ${styles[benefit.tone]}`}>
                  {benefit.icon}
                </span>
                <div>
                  <h2>{benefit.title}</h2>
                  <p>{benefit.detail}</p>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}

      {/* STEP 2: WHAT ARE YOU CREATING? */}
      {step === 2 && (
        <main className={styles.stepScreen} aria-labelledby="output-title">
          <div className={styles.stepIntro}>
            <p className={styles.stepLabel}>Step 2 of {maxSteps}</p>
            <h1 id="output-title" className={styles.pageTitle}>
              What are you <span>creating?</span>
            </h1>
            <p className={styles.pageDesc}>
              Choose the format you want to make with your photo.
            </p>
          </div>

          <div className={styles.outputChoices} role="radiogroup" aria-label="Output type">
            {OUTPUT_TYPES.map((output) => {
              const selected = generator.outputType === output.id;
              return (
                <button
                  key={output.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`${styles.outputCard} ${selected ? styles.selected : ''}`}
                  onClick={() => setOutputType(output.id)}
                >
                  <div className={styles.outputCardTop}>
                    <span className={styles.outputMarker}>{output.marker}</span>
                    <span className={styles.selectIndicator} aria-hidden="true">
                      {selected ? '✓' : ''}
                    </span>
                  </div>
                  <div className={styles.outputCopy}>
                    <strong>{output.title}</strong>
                    <small>{output.description}</small>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={styles.stepActions}>
            <button type="button" className={styles.backButton} onClick={() => setStep(1)}>
              ← Back
            </button>
            <ContinueButton
              disabled={!generator.outputType}
              onClick={() => setStep(3)}
            />
          </div>
        </main>
      )}

      {/* STEP 3: TEMPLATE SELECTION */}
      {step === 3 && (
        <main className={styles.stepScreen} aria-labelledby="template-title">
          <div className={styles.stepIntro}>
            <p className={styles.stepLabel}>Step 3 of {maxSteps}</p>
            <h1 id="template-title" className={styles.pageTitle}>
              Choose your <span>template</span>
            </h1>
            <p className={styles.pageDesc}>
              Select one {generator.outputType === 'builder' ? 'Builder ID' : 'PFP'} design to continue.
            </p>
          </div>

          {/* DESKTOP LAYOUT (>= 768px): Single horizontal row for ALL cards */}
          <div className={styles.desktopTemplateLayout} role="radiogroup" aria-label="Template selection desktop">
            <div
              className={
                generator.outputType === 'builder'
                  ? styles.builderDesktopGrid
                  : styles.pfpDesktopGrid
              }
            >
              {templates.map((template) => {
                const selected = generator.template === template.id;
                const isLandscape = template.orientation === 'landscape';
                return (
                  <button
                    key={template.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`${styles.templateCard} ${
                      isLandscape ? styles.landscapeCard : styles.portraitCard
                    } ${selected ? styles.selected : ''}`}
                    onClick={() => setTemplate(template.id)}
                  >
                    <span
                      className={styles.templatePreview}
                      style={{ aspectRatio: template.aspectRatio }}
                    >
                      <Image
                        src={template.image}
                        alt={`${template.title} template preview`}
                        sizes="(max-width: 1200px) 33vw, 360px"
                      />
                    </span>
                    <span className={styles.templateInfo}>
                      <span className={styles.templateLabel}>{template.title}</span>
                      <span className={styles.templateSubtitle}>{template.subtitle}</span>
                    </span>
                    <span className={styles.templateCheck} aria-hidden="true">
                      {selected ? '✓ Selected' : 'Select Template'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MOBILE CAROUSEL LAYOUT (< 768px) */}
          <div className={styles.mobileCarouselWrapper}>
            {/* 1. Mobile Back / Continue Actions in Normal Page Flow (ABOVE indicator & cards) */}
            <div className={styles.mobileActions}>
              <button type="button" className={styles.backButton} onClick={() => setStep(2)}>
                ← Back
              </button>
              <ContinueButton
                disabled={!generator.template}
                onClick={() => {
                  if (generator.outputType === 'pfp') {
                    setFutureNotice(true);
                  } else {
                    setStep(4);
                  }
                }}
              >
                {generator.outputType === 'pfp' ? 'Complete PFP' : 'Continue'}
              </ContinueButton>
            </div>

            {/* 2. Pagination & Swipe Discoverability Indicator ABOVE Template Cards */}
            <div className={styles.carouselPagination} aria-label="Carousel page indicator">
              <div className={styles.carouselPaginationHeader}>
                <div className={styles.carouselDots}>
                  {templates.map((t, idx) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`${styles.dot} ${idx === activeSlide ? styles.activeDot : ''}`}
                      onClick={() => scrollToSlide(idx)}
                      aria-label={`View template ${idx + 1}: ${t.title}`}
                    />
                  ))}
                </div>
                <span className={styles.carouselCounter}>
                  {activeSlide + 1} / {templates.length}
                </span>
              </div>
              <span className={styles.swipeHint}>↔ SWIPE TO EXPLORE</span>
            </div>

            {/* 3. Template Cards Carousel */}
            <div
              ref={carouselRef}
              className={styles.mobileCarousel}
              onScroll={handleCarouselScroll}
              role="radiogroup"
              aria-label="Template selection mobile carousel"
            >
              {templates.map((template, index) => {
                const selected = generator.template === template.id;
                return (
                  <div key={template.id} className={styles.carouselSlide}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`${styles.templateCard} ${selected ? styles.selected : ''}`}
                      onClick={() => {
                        setTemplate(template.id);
                        scrollToSlide(index);
                      }}
                    >
                      <span className={styles.templatePreview} style={{ aspectRatio: template.aspectRatio }}>
                        <Image
                          src={template.image}
                          alt={`${template.title} template preview`}
                          sizes="85vw"
                        />
                      </span>
                      <span className={styles.templateInfo}>
                        <span className={styles.templateLabel}>{template.title}</span>
                        <span className={styles.templateSubtitle}>{template.subtitle}</span>
                      </span>
                      <span className={styles.templateCheck} aria-hidden="true">
                        {selected ? '✓ Selected' : 'Select Template'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DESKTOP ACTIONS ONLY (Hidden on mobile) */}
          <div className={`${styles.stepActions} ${styles.desktopOnlyActions}`}>
            <button type="button" className={styles.backButton} onClick={() => setStep(2)}>
              ← Back
            </button>
            <ContinueButton
              disabled={!generator.template}
              onClick={() => {
                if (generator.outputType === 'pfp') {
                  setFutureNotice(true);
                } else {
                  setStep(4);
                }
              }}
            >
              {generator.outputType === 'pfp' ? 'Complete PFP' : 'Continue'}
            </ContinueButton>
          </div>

          {futureNotice && generator.outputType === 'pfp' && (
            <p className={styles.futureNotice} role="status">
              ✓ PFP Frame selection complete! Next technical phase: Canvas rendering &amp; photo cropping.
            </p>
          )}
        </main>
      )}

      {/* STEP 4: BUILDER DETAILS (BUILDER ID FLOW ONLY) */}
      {step === 4 && generator.outputType === 'builder' && (
        <main className={styles.stepScreen} aria-labelledby="details-title">
          <div className={styles.stepIntro}>
            <p className={styles.stepLabel}>Step 4 of 4</p>
            <h1 id="details-title" className={styles.pageTitle}>
              Builder <span>details</span>
            </h1>
            <p className={styles.pageDesc}>
              Enter your information to auto-populate your Hacker House Goa Builder ID badge.
            </p>
          </div>

          <div className={styles.detailsFormCard}>
            <form onSubmit={(e) => e.preventDefault()} className={styles.detailsForm}>
              {/* NAME */}
              <div className={styles.fieldGroup}>
                <label htmlFor="builder-name" className={styles.fieldLabel}>
                  NAME <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  id="builder-name"
                  type="text"
                  className={styles.fieldInput}
                  placeholder="e.g. Satoshi Nakamoto"
                  value={generator.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              {/* ROLE / POST */}
              <div className={styles.fieldGroup}>
                <label htmlFor="builder-role" className={styles.fieldLabel}>
                  ROLE / POST <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  id="builder-role"
                  type="text"
                  className={styles.fieldInput}
                  placeholder="e.g. Smart Contract Engineer"
                  value={generator.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  required
                />
              </div>

              {/* TEAM / STACK */}
              <div className={styles.fieldGroup}>
                <label htmlFor="builder-team" className={styles.fieldLabel}>
                  TEAM / STACK <span className={styles.optionalTag}>(OPTIONAL)</span>
                </label>
                <input
                  id="builder-team"
                  type="text"
                  className={styles.fieldInput}
                  placeholder="e.g. Rust / Solana / Anchor"
                  value={generator.team}
                  onChange={(e) => handleInputChange('team', e.target.value)}
                />
              </div>

              {/* BUILDER ID (AUTO-GENERATED, READ-ONLY) */}
              <div className={styles.fieldGroup}>
                <label htmlFor="builder-id" className={styles.fieldLabel}>
                  BUILDER ID <span className={styles.autoGeneratedTag}>(AUTO-GENERATED)</span>
                </label>
                <div className={styles.readOnlyInputWrap}>
                  <input
                    id="builder-id"
                    type="text"
                    className={`${styles.fieldInput} ${styles.readOnlyInput}`}
                    value={generator.builderId}
                    readOnly
                    tabIndex={-1}
                  />
                  <span className={styles.lockBadge} title="Auto-generated read-only ID">
                    🔒
                  </span>
                </div>
              </div>
            </form>
          </div>

          <div className={styles.stepActions}>
            <button type="button" className={styles.backButton} onClick={() => setStep(3)}>
              ← Back
            </button>
            <ContinueButton
              disabled={!isDetailsValid}
              onClick={() => setFutureNotice(true)}
            >
              Complete Builder ID
            </ContinueButton>
          </div>

          {futureNotice && (
            <p className={styles.futureNotice} role="status">
              ✓ Builder ID details saved! Next technical phase: Canvas rendering &amp; photo cropping.
            </p>
          )}
        </main>
      )}

      <div className={styles.paperEdge} aria-hidden="true">
        <svg viewBox="0 0 1440 54" preserveAspectRatio="none">
          <path d="M0 14c37-12 68 17 111 9 45-8 73 17 119 8 42-8 76 15 123 7 47-8 74 14 122 7 44-6 78 12 123 4 47-9 77 14 123 5 43-8 73 14 118 5 46-9 79 13 123 4 45-8 75 15 123 6 46-9 76 14 120 5 42-8 75 14 122 5 43-9 70 7 111-2v30H0V14Z" />
        </svg>
      </div>
    </div>
  );
}
