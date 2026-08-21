import Navbar from '@/components/navbar/Navbar'
import ContactFormPage from '@/components/pages/contacts/Contacts'
import FooterPage from '@/components/pages/Footerpage'
import React from 'react'

export default function page() {
  return (
   <>
   <Navbar/>
   <ContactFormPage/>
   <FooterPage/>
   </>
  )
}
