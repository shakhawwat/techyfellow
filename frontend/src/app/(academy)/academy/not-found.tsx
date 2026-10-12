import Link from 'next/link';
import styles from '@/components/academy/academy-area.module.css';
export default function AcademyNotFound(){return <main id="public-main" tabIndex={-1} className={styles.page}><h1>Course information not found</h1><p>This course or illustrative preview is not currently available.</p><div className={styles.actions}><Link className={styles.button} href="/academy">Explore Academy</Link></div></main>;}
