import {AcademyCourseEditor} from "@/components/admin/academy-course-editor";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AcademyCourseEditor id={id}/>;}
