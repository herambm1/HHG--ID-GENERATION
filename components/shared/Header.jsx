import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.brandArea}>
          <span className={styles.studioMark}>2:47 PM STUDIO</span>
          <Link href="/" className={styles.brand} aria-label="Hacker House Goa home">
            <span className={styles.brandIcon}>&gt;_</span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>Hacker House</span>
              <span className={styles.brandAccent} lang="mr">गोवा</span>
            </span>
          </Link>
        </div>

        <span className={styles.headerTag}>
          <span>#FrameInGoa</span>
          <span className={styles.tagPalm} aria-hidden="true">{'🌴'}</span>
        </span>
      </div>
    </header>
  );
}
