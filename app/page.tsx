import Heading from "./Heading";
import { Copy, ContentImage, ContentLink } from "./Content";
import LandingHero from "./LandingHero";
export default function Home() {
    return (<main id="main" className="experience bottle-art-page">
      <LandingHero />
      <section id="welcome" className="manifesto gold-section">
        <Heading as="h2" data-reveal><Copy field="experience.page.text1"/></Heading>
        <div className="manifesto-bottom" data-reveal>
          <p><Copy field="experience.page.text2"/></p>
          <ContentLink className="pill" field="experience.page.link1"><Copy field="experience.page.text3"/></ContentLink>
        </div>
      </section>
      <section id="coffee" className="split-scene">
        <figure className="split-photo">
          <ContentImage field="experience.page.image4" loading="lazy" sizes="(max-width: 600px) 100vw, 50vw"/>
        </figure>
        <div className="split-copy">
          <Heading as="h2" data-reveal><Copy field="experience.page.text5"/></Heading>
          <p data-reveal><Copy field="experience.page.text6"/></p>
          <ContentLink data-reveal className="pill" field="experience.page.link2"><Copy field="experience.page.text7"/></ContentLink>
        </div>
      </section>
      <section id="wine" className="scene wine-scene" aria-labelledby="wine-title">
        <ContentImage field="experience.page.image8" className="scene-photo" loading="lazy" sizes="100vw"/>
        <div className="scene-shade"/>
        <div className="scene-content">
          <Heading as="h2" id="wine-title" data-reveal><Copy field="experience.page.text9"/></Heading>
          <p data-reveal><Copy field="experience.page.text10"/></p>
          <ContentLink data-reveal className="pill" field="experience.page.link3"><Copy field="experience.page.text11"/></ContentLink>
        </div>
      </section>
      <section id="table" className="split-scene food-scene gold-section">
        <div className="split-copy">
          <Heading as="h2" data-reveal><Copy field="experience.page.text12"/></Heading>
          <p data-reveal><Copy field="experience.page.text13"/></p>
          <ContentLink data-reveal className="pill" field="experience.page.link4"><Copy field="experience.page.text14"/></ContentLink>
        </div>
        <figure className="split-photo">
          <ContentImage field="experience.page.image15" loading="lazy" sizes="(max-width: 600px) 100vw, 50vw"/>
        </figure>
      </section>
      <section className="photo-story" aria-label="Musik og stemning på Apoteket">
        <figure><ContentImage field="experience.page.image16" loading="lazy" sizes="(max-width: 600px) 100vw, 50vw"/></figure>
        <figure><ContentImage field="experience.page.image17" loading="lazy" sizes="(max-width: 600px) 100vw, 50vw"/></figure>
      </section>
      <section className="brand-world">
        <div className="world-heading">
          <Heading as="h2" data-reveal><Copy field="experience.page.text18"/></Heading>
          <p data-reveal><Copy field="experience.page.text19"/></p>
        </div>
        <div className="collection-photos">
          <figure className="collection-wide"><ContentImage field="experience.collection.cups-scattered" loading="lazy" sizes="100vw"/></figure>
          <figure><ContentImage field="experience.collection.cups-stacked" loading="lazy" sizes="(max-width: 600px) 100vw, 50vw"/></figure>
          <figure><ContentImage field="experience.collection.takeaway-bag" loading="lazy" sizes="(max-width: 600px) 100vw, 50vw"/></figure>
        </div>
      </section>
      <section id="neighbourhood" className="scene visit-scene">
        <ContentImage field="experience.page.image22" className="scene-photo" loading="lazy" sizes="100vw"/>
        <div className="scene-shade"/>
        <div className="scene-content">
          <Heading as="h2" data-reveal><Copy field="experience.page.text23"/></Heading>
          <p data-reveal><Copy field="experience.page.text24"/></p>
          <ContentLink data-reveal className="pill" field="experience.page.link5"><Copy field="experience.page.text25"/></ContentLink>
        </div>
      </section>
    </main>);
}
