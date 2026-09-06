import Navbar from '@/components/navbar/Navbar'
import ContactFormPage from '@/components/pages/contacts/Contacts'
import FooterPage from '@/components/pages/Footerpage'
import { getTeamMember } from '@/lib/team-data'
import React from 'react'

type ContactPageProps = {
  searchParams: Promise<{ agent?: string; subject?: string }>;
};

export default async function page({ searchParams }: ContactPageProps) {
  const query = await searchParams;
  const agent = query.agent ? await getTeamMember(query.agent) : null;
  const initialSubject = typeof query.subject === "string" ? query.subject.slice(0, 180) : "";

  return (
   <>
   <Navbar/>
   <ContactFormPage
     agent={agent ? { slug: agent.slug, name: agent.name, photo: agent.photo } : null}
     initialSubject={initialSubject}
   />
   <FooterPage/>
   </>
  )
}
