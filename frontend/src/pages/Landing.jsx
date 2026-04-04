import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

/**
 * Landing page — ConnectMavai marketing/home page
 */
const Landing = () => {
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [counters, setCounters] = useState({ users: 0, messages: 0, uptime: 0 });
  const statsRef = useRef(null);
  const [statsAnimated, setStatsAnimated] = useState(false);

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate counters when stats section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsAnimated) {
          setStatsAnimated(true);
          animateCounters();
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [statsAnimated]);

  const animateCounters = () => {
    const targets = { users: 10000, messages: 500000, uptime: 99.9 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounters({
        users: Math.round(targets.users * eased),
        messages: Math.round(targets.messages * eased),
        uptime: Math.round(targets.uptime * eased * 10) / 10,
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
  };

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: 'Real-Time Messaging',
      description: 'Instant message delivery with Socket.IO — feel every conversation come alive with zero delay.',
      color: '#6C63FF',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      title: 'End-to-End Encryption',
      description: 'AES-256 encryption protects every message. Your conversations stay private, always.',
      color: '#3B82F6',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15.6 11.6L22 7v10l-6.4-4.6" />
          <rect x="2" y="7" width="14" height="10" rx="2" ry="2" />
        </svg>
      ),
      title: 'Video Calling',
      description: 'Face-to-face conversations with crystal-clear WebRTC video and audio calls.',
      color: '#06B6D4',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: 'Group Chats & Rooms',
      description: 'Create rooms, invite friends, and collaborate in real-time group conversations.',
      color: '#8B5CF6',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      title: 'File Sharing',
      description: 'Share images, documents, and voice messages seamlessly within any chat.',
      color: '#F59E0B',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      title: 'Dark & Light Themes',
      description: 'Switch between beautifully crafted dark and light modes — easy on your eyes, day or night.',
      color: '#EC4899',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up in seconds with just a username and password.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Find Friends',
      description: 'Browse users and send contact requests to start chatting.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Start Chatting',
      description: 'Send messages, share files, and make video calls instantly.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
    },
  ];

  const testimonials = [
    {
      name: 'Aisha Patel',
      role: 'Product Designer',
      text: 'ConnectMavai transformed how our remote team communicates. The real-time features are incredibly smooth!',
      avatar: 'AP',
    },
    {
      name: 'Ryan Chen',
      role: 'Software Engineer',
      text: 'The encryption gives me peace of mind. Plus, the dark mode is gorgeous — I never switch back!',
      avatar: 'RC',
    },
    {
      name: 'Sofia Martinez',
      role: 'Startup Founder',
      text: 'We ditched three other tools after switching to ConnectMavai. Everything we need in one place.',
      avatar: 'SM',
    },
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  };

  return (
    <div className="landing-page">
      {/* ====== NAVBAR ====== */}
      <nav className={`landing-nav ${isNavScrolled ? 'scrolled' : ''}`} id="landing-nav">
        <div className="nav-content">
          <Link to="/" className="nav-logo" id="nav-logo">
            <div className="nav-logo-icon">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="url(#nav-logo-grad)" />
                <path d="M14 18C14 15.2386 16.2386 13 19 13H29C31.7614 13 34 15.2386 34 18V26C34 28.7614 31.7614 31 29 31H26L20 36V31H19C16.2386 31 14 28.7614 14 26V18Z" fill="white" fillOpacity="0.9" />
                <circle cx="21" cy="22" r="2" fill="url(#nav-logo-grad)" />
                <circle cx="27" cy="22" r="2" fill="url(#nav-logo-grad)" />
                <defs>
                  <linearGradient id="nav-logo-grad" x1="0" y1="0" x2="48" y2="48">
                    <stop stopColor="#6C63FF" />
                    <stop offset="1" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span>ConnectMavai</span>
          </Link>

          <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`} id="nav-links">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <div className="nav-auth-mobile">
              <Link to="/login" className="nav-btn-login" id="nav-login-mobile">Sign In</Link>
              <Link to="/register" className="nav-btn-signup" id="nav-signup-mobile">Get Started</Link>
            </div>
          </div>

          <div className="nav-auth" id="nav-auth">
            <Link to="/login" className="nav-btn-login" id="nav-login">Sign In</Link>
            <Link to="/register" className="nav-btn-signup" id="nav-signup">Get Started</Link>
          </div>

          <button
            className={`nav-hamburger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            id="nav-hamburger"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* ====== HERO SECTION ====== */}
      <section className="hero-section" id="hero">
        <div className="hero-bg-effects">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-grid" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>Now with Video Calling & File Sharing</span>
          </div>

          <h1 className="hero-title">
            Connect. Chat.
            <br />
            <span className="hero-gradient-text">Communicate.</span>
          </h1>

          <p className="hero-subtitle">
            A beautifully crafted real-time messaging platform with end-to-end encryption,
            video calls, and seamless file sharing — all in one place.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="hero-btn-primary" id="hero-cta-primary">
              Start for Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#features" className="hero-btn-secondary" id="hero-cta-secondary">
              Explore Features
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </div>

          <div className="hero-social-proof">
            <div className="hero-avatars">
              {['AP', 'RC', 'SM', 'JK'].map((initials, i) => (
                <div
                  key={i}
                  className="hero-avatar-circle"
                  style={{ background: ['#6C63FF', '#3B82F6', '#06B6D4', '#8B5CF6'][i] }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p>
              <strong>10,000+</strong> people already connected
            </p>
          </div>
        </div>

        {/* Chat preview mockup */}
        <div className="hero-mockup">
          <div className="mockup-window">
            <div className="mockup-topbar">
              <div className="mockup-dots">
                <span /><span /><span />
              </div>
              <span className="mockup-title">ConnectMavai</span>
            </div>
            <div className="mockup-chat">
              <div className="mockup-msg received animate-msg-1">
                <div className="mockup-avatar" style={{ background: '#6C63FF' }}>A</div>
                <div className="mockup-bubble received">
                  Hey! Have you seen the new features? 🚀
                  <span className="mockup-time">2:34 PM</span>
                </div>
              </div>
              <div className="mockup-msg sent animate-msg-2">
                <div className="mockup-bubble sent">
                  Yes! The video calling is amazing 🔥
                  <span className="mockup-time">2:35 PM</span>
                </div>
              </div>
              <div className="mockup-msg received animate-msg-3">
                <div className="mockup-avatar" style={{ background: '#3B82F6' }}>B</div>
                <div className="mockup-bubble received">
                  And the encryption makes it so secure 🔒
                  <span className="mockup-time">2:36 PM</span>
                </div>
              </div>
              <div className="mockup-msg sent animate-msg-4">
                <div className="mockup-bubble sent">
                  Let's share some files too! 📎
                  <span className="mockup-time">2:37 PM</span>
                </div>
              </div>
              <div className="mockup-typing animate-msg-5">
                <div className="mockup-avatar" style={{ background: '#06B6D4' }}>C</div>
                <div className="mockup-typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== STATS SECTION ====== */}
      <section className="stats-section" ref={statsRef} id="stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{formatNumber(counters.users)}+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <div className="stat-number">{formatNumber(counters.messages)}+</div>
            <div className="stat-label">Messages Sent</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <div className="stat-number">{counters.uptime}%</div>
            <div className="stat-label">Uptime</div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES SECTION ====== */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2 className="section-title">Everything you need to stay connected</h2>
          <p className="section-subtitle">
            Packed with powerful features to make your communication effortless, secure, and enjoyable.
          </p>
        </div>

        <div className="features-showcase">
          <div className="features-list">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-item ${activeFeature === index ? 'active' : ''}`}
                onClick={() => setActiveFeature(index)}
                id={`feature-item-${index}`}
              >
                <div className="feature-icon" style={{ color: feature.color, background: `${feature.color}15` }}>
                  {feature.icon}
                </div>
                <div className="feature-text">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <div className="feature-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div className="features-preview">
            <div className="feature-preview-card" key={activeFeature}>
              <div
                className="feature-preview-icon"
                style={{ color: features[activeFeature].color }}
              >
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  {activeFeature === 0 && <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>}
                  {activeFeature === 1 && <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>}
                  {activeFeature === 2 && <><path d="M15.6 11.6L22 7v10l-6.4-4.6" /><rect x="2" y="7" width="14" height="10" rx="2" ry="2" /></>}
                  {activeFeature === 3 && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
                  {activeFeature === 4 && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
                  {activeFeature === 5 && <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>}
                </svg>
              </div>
              <h3 style={{ color: features[activeFeature].color }}>{features[activeFeature].title}</h3>
              <p>{features[activeFeature].description}</p>
              <div
                className="feature-preview-glow"
                style={{ background: `radial-gradient(circle, ${features[activeFeature].color}20 0%, transparent 70%)` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="how-section" id="how-it-works">
        <div className="section-header">
          <span className="section-tag">How It Works</span>
          <h2 className="section-title">Get started in 3 simple steps</h2>
          <p className="section-subtitle">
            No complicated setup. Create an account and start chatting in under a minute.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="step-card" id={`step-card-${index}`}>
              <div className="step-number">{step.number}</div>
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header">
          <span className="section-tag">Testimonials</span>
          <h2 className="section-title">Loved by thousands</h2>
          <p className="section-subtitle">
            See what our users say about their experience with ConnectMavai.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card" id={`testimonial-${index}`}>
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-author">
                <div
                  className="testimonial-avatar"
                  style={{ background: ['#6C63FF', '#3B82F6', '#06B6D4'][index] }}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="testimonial-name">{testimonial.name}</div>
                  <div className="testimonial-role">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== CTA SECTION ====== */}
      <section className="cta-section" id="cta">
        <div className="cta-bg-effects">
          <div className="cta-orb cta-orb-1" />
          <div className="cta-orb cta-orb-2" />
        </div>
        <div className="cta-content">
          <h2>Ready to connect?</h2>
          <p>Join thousands of users who already communicate better with ConnectMavai.</p>
          <div className="cta-actions">
            <Link to="/register" className="cta-btn-primary" id="cta-register">
              Create Free Account
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/login" className="cta-btn-secondary" id="cta-login">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="landing-footer" id="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="url(#footer-logo-grad)" />
                <path d="M14 18C14 15.2386 16.2386 13 19 13H29C31.7614 13 34 15.2386 34 18V26C34 28.7614 31.7614 31 29 31H26L20 36V31H19C16.2386 31 14 28.7614 14 26V18Z" fill="white" fillOpacity="0.9" />
                <defs>
                  <linearGradient id="footer-logo-grad" x1="0" y1="0" x2="48" y2="48">
                    <stop stopColor="#6C63FF" />
                    <stop offset="1" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
              <span>ConnectMavai</span>
            </div>
            <p>Real-time messaging, reimagined.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#testimonials">Reviews</a>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <Link to="/login">Sign In</Link>
              <Link to="/register">Sign Up</Link>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} ConnectMavai. Built with 💜 for real connections.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
