import React from 'react'
import Hero from '../pages/Hero'
import GrandLivingPage from '../pages/GrandLivingpage'
import ExclusiveListingsPage from '../pages/Exclusivelistingpage'
import TeamPage from '../pages/Teampage'
import TestimonialsPage from '../pages/Testimonials'
import ActionCardsPage from '../pages/Actioncardspage'
import ContactFormPage from '../pages/ContactFormPage'
import FooterPage from '../pages/Footerpage'
import { AboutPreview } from '../pages/about/AboutSection'

const Mainpage = () => {
  return (
    <div>
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
