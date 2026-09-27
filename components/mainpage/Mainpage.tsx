import Hero from '../pages/Hero'
import GrandLivingPage from '../pages/GrandLivingpage'
import ExclusiveListingsPage from '../pages/Exclusivelistingpage'
import TeamPage from '../pages/Teampage'
import TestimonialsPage from '../pages/Testimonials'
import ActionCardsPage from '../pages/Actioncardspage'
import ContactFormPage from '../pages/ContactFormPage'
import FooterPage from '../pages/Footerpage'
import { getHeroContent } from '@/lib/hero-content-data'
import { getHomepageActionContent } from '@/lib/homepage-action-content-data'

const Mainpage = async () => {
  const [heroContent, actionContent] = await Promise.all([
    getHeroContent(),
    getHomepageActionContent(),
  ])

  return (
    <div>
      <Hero content={heroContent}/>
      <GrandLivingPage/>
      <ExclusiveListingsPage/>
      <TeamPage/>
      <TestimonialsPage/>
      <ActionCardsPage content={actionContent}/>
      <ContactFormPage/>
      <FooterPage/>
    </div>
  )
}

export default Mainpage
