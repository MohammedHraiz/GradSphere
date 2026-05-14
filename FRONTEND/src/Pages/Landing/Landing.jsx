import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bauLogo from '../../assets/bau_logo.png';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <img src={bauLogo} alt="BAU Logo" className="bau-logo" />
            <div className="logo-text">
              <div className="university-name">AL-BALQA APPLIED UNIVERSITY</div>
              <div className="portal-name">Graduation Project Portal</div>
            </div>
          </div>

          <button
            className="hamburger-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
            <a href="#features" onClick={() => scrollToSection('features')} className="nav-link">
              Features
            </a>
            <a href="#how-it-works" onClick={() => scrollToSection('how-it-works')} className="nav-link">
              How It Works
            </a>
            <a href="#roles" onClick={() => scrollToSection('roles')} className="nav-link">
              Roles
            </a>
            <a href="#about" onClick={() => scrollToSection('about')} className="nav-link">
              About
            </a>
          </div>

          <div className="navbar-actions">
            <button
              className="nav-btn nav-btn-login"
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
            {/* <button
              className="nav-btn nav-btn-primary"
              onClick={() => navigate('/login')}
            >
              Enter Portal
            </button> */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Built for graduation projects.<br />
            <span className="hero-accent">Made for students, supervisors, and departments.</span>
          </h1>
          <p className="hero-subtitle">
            A unified portal for managing teams, proposals, supervisors, tasks, meetings, milestones, and project progress — all in one place.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Enter Portal
            </button>
            <button className="btn btn-secondary" onClick={() => scrollToSection('features')}>
              Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why use the Graduation Project Portal?</h2>
          <p className="section-subtitle">
            Everything needed to organize and track graduation projects from proposal to final delivery.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3 className="feature-title">Team Management</h3>
            <p className="feature-description">
              Students can create teams, invite members, and manage team status throughout the project lifecycle.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3 className="feature-title">Proposal Workflow</h3>
            <p className="feature-description">
              Submit project proposals and track approvals from supervisors and committees seamlessly.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3 className="feature-title">Tasks & Milestones</h3>
            <p className="feature-description">
              Plan work, assign tasks, track deadlines, and follow project milestones until completion.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3 className="feature-title">Role-Based Dashboards</h3>
            <p className="feature-description">
              Students, supervisors, deans, admins, and IT faculty each get the tools they need.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Create or Join a Team</h3>
            <p className="step-description">
              Start your graduation project team and invite classmates to collaborate.
            </p>
          </div>

          <div className="step-divider"></div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">Submit Your Proposal</h3>
            <p className="step-description">
              Send your project idea through the approval workflow for supervisors and committees.
            </p>
          </div>

          <div className="step-divider"></div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Track Progress</h3>
            <p className="step-description">
              Manage tasks, meetings, milestones, and project updates until completion.
            </p>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="roles-section">
        <div className="section-header">
          <h2 className="section-title">Designed for Every Role</h2>
          <p className="section-subtitle">
            Each role gets a dedicated workspace with the tools they need.
          </p>
        </div>
        <div className="roles-grid">
          <div className="role-card">
            <div className="role-icon">🎓</div>
            <h3 className="role-name">Students</h3>
            <p className="role-description">
              Create teams, submit proposals, manage tasks, track milestones, and attend meetings.
            </p>
          </div>

          <div className="role-card">
            <div className="role-icon">👨‍🏫</div>
            <h3 className="role-name">Supervisors</h3>
            <p className="role-description">
              Review projects, monitor assigned teams, manage feedback, and guide students.
            </p>
          </div>

          <div className="role-card">
            <div className="role-icon">👔</div>
            <h3 className="role-name">Dean</h3>
            <p className="role-description">
              Overview all projects, make decisions, generate reports, and manage supervisor requests.
            </p>
          </div>

          <div className="role-card">
            <div className="role-icon">⚙️</div>
            <h3 className="role-name">Admin</h3>
            <p className="role-description">
              Manage users, departments, system configuration, and data import/export.
            </p>
          </div>

          <div className="role-card">
            <div className="role-icon">🔧</div>
            <h3 className="role-name">IT Faculty</h3>
            <p className="role-description">
              Account management, student setup, technical support, and system maintenance.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-content">
          <h2 className="section-title">About the Portal</h2>
          <p className="about-text">
            The Graduation Project Portal helps Al-Balqa Applied University organize graduation project workflows in a clear, role-based, and centralized way. It reduces manual coordination and gives every role a dedicated workspace to collaborate, communicate, and achieve project goals efficiently.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to manage graduation projects smarter?</h2>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/login')}
          >
            Enter Portal
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p>&copy; 2026 Al-Balqa Applied University. Graduation Project Portal.</p>
          <p>Building better project workflows, one team at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
