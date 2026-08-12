import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.footerBrand}>
          HACKER HOUSE <span className={styles.footerAccent}>GOA 2026</span>
        </span>

        <hr className={styles.footerDivider} />

        <span className={styles.footerMeta}>
          28 — 31 OCT 2026 · 2:47 PM STUDIO
        </span>
      </div>
    </footer>
  );
}
