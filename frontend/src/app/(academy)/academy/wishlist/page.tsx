import { AcademyWishlist } from '@/components/academy/wishlist';
import styles from '@/components/academy/academy-area.module.css';
export const metadata={title:'Browser-local wishlist | Techyfellow Academy',robots:{index:false,follow:false}};
export default function WishlistPage(){return <main id="public-main" tabIndex={-1} className={styles.page}><h1>Your wishlist</h1><AcademyWishlist/></main>;}
