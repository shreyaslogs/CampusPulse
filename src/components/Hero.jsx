function Hero() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-content">
        <p className="eyebrow">Discover. Connect. Participate.</p>

        <h1>
          Stay connected with
          <span> everything happening on campus.</span>
        </h1>

        <p className="hero-description">
          Discover events, announcements, clubs, opportunities, and
          everything else your campus community has to offer.
        </p>

        <div className="hero-actions">
          <a href="#events" className="primary-button">
            Explore Events
          </a>

          <a href="#announcements" className="secondary-button">
            View Announcements
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero
