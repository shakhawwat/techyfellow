import type {ReactNode} from 'react';
import {PublicNavbar} from '@/components/layout/public-navbar';
import {PublicFooter} from '@/components/layout/public-footer';
import {AccountSessionProvider} from '@/components/account/session';
import {LoginHelp} from '@/components/account/login-help';
export default function PublicLayout({children}:{children:ReactNode}){return <AccountSessionProvider><a className='skip-link' href='#public-main'>Skip to content</a><PublicNavbar/>{children}<PublicFooter/><LoginHelp/></AccountSessionProvider>;}
