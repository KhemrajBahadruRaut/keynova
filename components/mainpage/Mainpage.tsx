import ListingsPage from '@/app/listing/page'
import React from 'react'
import Hero from '../pages/Hero'
import GrandLivingPage from '../pages/GrandLivingpage'
import ExclusiveListingsPage from '../pages/Exclusivelistingpage'
import TeamPage from '../pages/Teampage'
import TestimonialsPage from '../pages/Testimonials'
import ActionCardsPage from '../pages/Actioncardspage'
import ContactFormPage from '../pages/ContactFormPage'
import FooterPage from '../pages/Footerpage'

const Mainpage = () => {
  return (
    <div>
      {/* <ListingsPage/> */}
      <Hero/>
      <GrandLivingPage/>
      <ExclusiveListingsPage/>
      <TeamPage/>
      <TestimonialsPage/>
      <ActionCardsPage/>
      <ContactFormPage/>
      <FooterPage/>
    </div>
  )
}

export default Mainpage