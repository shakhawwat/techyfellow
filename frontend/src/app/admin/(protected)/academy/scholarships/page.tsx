import {AcademySimpleScholarships} from '@/components/admin/academy-simple-scholarships';
import {AcademyAdminRecords} from '@/components/admin/academy-management';
export default function Page(){return <><AcademySimpleScholarships/><details><summary>Advanced records</summary><AcademyAdminRecords kind="redemptions"/><AcademyAdminRecords kind="audits"/></details></>;}
