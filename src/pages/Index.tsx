import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, Phone, Mail, MapPin, ExternalLink, ArrowRight, 
  Layers, Landmark, FileText, CheckCircle2, ChevronRight, Award, 
  TrendingUp, Activity, HelpCircle, Send, Menu, X
} from "lucide-react";
import logoImg from "@/assets/sk-logo.png";
import SEO from "@/components/common/SEO";

// Custom styles for 3D card tilt effect and scroll animations
const inlineStyles = `
  @keyframes float-breathing {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-6px) scale(1.05); }
  }
  @keyframes ripple {
    0% { transform: scale(0.95); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 0.3; }
    100% { transform: scale(1.4); opacity: 0; }
  }
  .animate-float-whatsapp {
    animation: float-breathing 3s ease-in-out infinite;
  }
  .whatsapp-ripple::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 9999px;
    border: 2px solid #22c55e;
    animation: ripple 2s linear infinite;
    pointer-events: none;
  }
  
  .reveal-on-scroll {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .reveal-on-scroll.active {
    opacity: 1;
    transform: translateY(0);
  }
  
  .tilt-card {
    transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.2s ease;
    transform-style: preserve-3d;
  }
  .tilt-card-inner {
    transform: translateZ(20px);
  }
  
  .glass-header {
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

export default function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dragRef = useRef<HTMLAnchorElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Scroll reveal IntersectionObserver setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // WhatsApp Draggable Logic
  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    let startX = 0, startY = 0;
    let dragStarted = false;

    const onDragStart = (e: MouseEvent | TouchEvent) => {
      dragStarted = false;
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startX = clientX - el.offsetLeft;
      startY = clientY - el.offsetTop;
      
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd);
    };

    const onDragMove = (e: MouseEvent | TouchEvent) => {
      dragStarted = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      let nextX = clientX - startX;
      let nextY = clientY - startY;

      // Restrict button from escaping viewport boundaries
      const padding = 12;
      const minX = padding;
      const minY = padding;
      const maxX = window.innerWidth - el.offsetWidth - padding;
      const maxY = window.innerHeight - el.offsetHeight - padding;

      nextX = Math.max(minX, Math.min(nextX, maxX));
      nextY = Math.max(minY, Math.min(nextY, maxY));

      el.style.left = `${nextX}px`;
      el.style.top = `${nextY}px`;
      el.style.bottom = 'auto';
      el.style.right = 'auto';
      
      if (e.cancelable) e.preventDefault();
    };

    const onDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend', onDragEnd);
    };

    const onClick = (e: MouseEvent) => {
      // Prevent click navigation if drag occurred
      if (dragStarted) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('mousedown', onDragStart);
    el.addEventListener('touchstart', onDragStart, { passive: true });
    el.addEventListener('click', onClick);

    return () => {
      el.removeEventListener('mousedown', onDragStart);
      el.removeEventListener('touchstart', onDragStart);
      el.removeEventListener('click', onClick);
    };
  }, []);

  // 3D Tilt Card Event Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    // Rotate parameters: tilt up to 8 degrees
    const rotateX = (yc - y) / 15;
    const rotateY = (x - xc) / 15;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    
    // Create radial highlight moving along with the cursor
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.style.borderColor = 'rgba(59, 130, 246, 0.4)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.borderColor = 'rgba(226, 232, 240, 0.8)';
  };

  const services = [
    {
      title: "LIC & Life Insurance Advisory",
      tagline: "Certified Agent Advisory",
      description: "Get comprehensive policy planning, hassle-free online premium payments, and personalized risk assessment to secure your family's future.",
      icon: <ShieldCheck className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />,
      bullets: ["Certified Advisory", "Premium Payment Gateway", "Claims & Surrender Support"],
      gradient: "from-blue-500/10 to-indigo-500/5",
      badge: "LIC Certified"
    },
    {
      title: "Dual Bank CSP Integration",
      tagline: "Authorized Service Point",
      description: "Direct customer banking desk for Bank of Baroda & Bank of India. Access AEPS cash withdrawals, instant savings accounts, and direct deposits.",
      icon: <Landmark className="w-8 h-8 text-blue-700 group-hover:scale-110 transition-transform duration-300" />,
      bullets: ["Aadhaar Enabled Payments (AEPS)", "Instant Zero-Balance Accounts", "Seamless Money Transfers"],
      gradient: "from-blue-600/10 to-slate-900/5",
      badge: "BOB & BOI Authorized"
    },
    {
      title: "Taxation & Compliance",
      tagline: "GST & Income Tax Return filing",
      description: "Hassle-free GST registrations, quarterly/monthly filings, and individual ITR processing with fast approval cycles.",
      icon: <FileText className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />,
      bullets: ["GST Return Filing & Reg", "ITR filing for Salaried & Business", "Pan Card & Digital Signatures"],
      gradient: "from-emerald-500/10 to-teal-500/5",
      badge: "100% Compliant"
    },
    {
      title: "CSC & Tathya Mitra Kendra",
      tagline: "Government E-Services Hub",
      description: "Your official local digital support center. Apply for birth/death certificates, voter cards, trade license applications, and government schemes.",
      icon: <Layers className="w-8 h-8 text-amber-600 group-hover:scale-110 transition-transform duration-300" />,
      bullets: ["Government Scheme Applications", "Certificate processing", "Digital Literacy Hub"],
      gradient: "from-amber-500/10 to-orange-500/5",
      badge: "Digital India"
    },
    {
      title: "Travel & Ticketing Services",
      tagline: "Quick Travel Reservations",
      description: "Instant flight ticket bookings, hotel reservations, and official IRCTC Indian Railways train e-ticketing.",
      icon: <Activity className="w-8 h-8 text-sky-600 group-hover:scale-110 transition-transform duration-300" />,
      bullets: ["IRCTC E-Ticketing", "Affordable Air Booking", "Instant Reschedule / Refund"],
      gradient: "from-sky-500/10 to-blue-500/5",
      badge: "Super Fast"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      <SEO 
        title="Professional Portfolio & Multi-Service Hub" 
        description="Explore professional Financial Advisory, Dual Bank CSP (BOB/BOI), Taxation/ITR, CSC Tathya Mitra, and travel booking services under one roof."
      />
      
      <style>{inlineStyles}</style>

      {/* Modern Glassmorphic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo + Brand Name */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                <img 
                  src={logoImg} 
                  alt="SK ONLINE Logo" 
                  className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-cover bg-white p-0.5 border border-white/10" 
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none">SK ONLINE</h1>
                <p className="text-[10px] text-blue-400 font-semibold tracking-wide uppercase mt-0.5 sm:mt-1">Multi-Service Center</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Home</a>
              <a href="#about" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">About</a>
              <a href="#services" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Services</a>
              <a href="#contact" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Contact</a>
            </nav>

            {/* Login Action (Top-Right) */}
            <div className="hidden md:block">
              <Link 
                id="header-login-btn"
                to="/login" 
                className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-150 gap-2 border border-blue-500/20"
              >
                <ShieldCheck className="w-4 h-4" />
                Login Portal
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 animate-fade-in-down">
            <div className="px-4 pt-2 pb-6 space-y-3 shadow-inner">
              <a 
                href="#home" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Home
              </a>
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                About
              </a>
              <a 
                href="#services" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Services
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Contact
              </a>
              <div className="pt-4 px-3">
                <Link 
                  to="/login"
                  className="w-full flex items-center justify-center py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-sm tracking-wide gap-2 shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-slate-950 text-white pt-28 pb-16 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Background Mesh Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(29,78,216,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
        
        {/* Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 sm:mb-8 animate-fade-in-up">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-blue-300">Authorized Digital Service Provider</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 sm:mb-8 reveal-on-scroll active">
              Premium Financial Advisory,<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-305 to-amber-300 bg-clip-text text-transparent">
                CSP Banking & Digital Services
              </span>
            </h2>
            
            <p className="text-slate-400 text-sm sm:text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 reveal-on-scroll active">
              One-stop hub managed by Abul, assisting citizens with Bank Customer Service Point (CSP) banking desk operations, LIC policies, tax submissions, and instant official ticketing.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 reveal-on-scroll active">
              <a 
                href="#services" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide rounded-lg transition-all duration-150 shadow-xl shadow-blue-500/15 gap-2 border border-blue-500/20"
              >
                Explore Services
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#contact" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 font-bold text-sm tracking-wide rounded-lg transition-all duration-150 border border-slate-800 gap-2"
              >
                Contact Now
              </a>
            </div>
          </div>
        </div>

        {/* Floating Accent Blob */}
        <div className="absolute right-0 top-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            {/* Visual Column */}
            <div className="relative reveal-on-scroll">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-100 rounded-3xl -z-10 animate-pulse" />
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-8 sm:p-12 text-white shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                <Award className="w-12 h-12 text-amber-400 mb-6" />
                <h3 className="text-xl sm:text-2xl font-extrabold mb-4">Trusted Multi-Service Expert</h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                  Providing compliant, reliable digital and financial support. Supporting government programs and direct electronic banking interfaces since inception to build local business confidence.
                </p>
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">100%</div>
                    <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wide">Secure Operations</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Dual</div>
                    <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wide">CSP Integrations</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Column */}
            <div className="reveal-on-scroll">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-0.5 bg-blue-600 rounded-full" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">The Professional</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                Your Trusted Partner in Financial and Digital Solutions
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                SK ONLINE is a professional business consultancy offering certified services directly to the residents of Rampur Bazar and surrounding regions in Sandeshkhali. We bring banking access, insurance protection, travel operations, and official taxation services under a single roof.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  "Dual Customer Service Point (CSP) for BOB & BOI",
                  "Licensed LIC Life Insurance policies & advisory desk",
                  "Official GST registrations, filing, & individual taxation guidance",
                  "Tathya Mitra government certificates & e-services"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-slate-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <a 
                href="#contact" 
                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base font-bold gap-2 group"
              >
                Get in touch for details
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 sm:py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 reveal-on-scroll">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200/50 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">What We Do</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Our Professional Core Offerings
            </h2>
            <p className="text-slate-600 text-sm sm:text-lg">
              Explore dynamic, certified business support designed to optimize digital safety and convenience for individuals and business entities.
            </p>
          </div>

          {/* Interactive Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div 
                key={idx}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="tilt-card bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-xl p-8 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between"
              >
                {/* Background Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 pointer-events-none" />
                
                {/* Top Details */}
                <div className="tilt-card-inner">
                  {/* Card Header (Icon & Badge) */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white shadow-sm border border-slate-100 transition-colors duration-300">
                      {service.icon}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-4">
                    {service.tagline}
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>

                  <div className="space-y-2 border-t border-slate-100 pt-5 mb-6">
                    {service.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs text-slate-700 font-medium">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <div className="tilt-card-inner pt-2">
                  <a 
                    href="#contact" 
                    className="inline-flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700 gap-1.5 transition-colors"
                  >
                    Request Service
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Info Grid (Left) */}
            <div className="lg:col-span-5 reveal-on-scroll">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-0.5 bg-blue-600 rounded-full" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Find Us</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                Get in Touch or Visit Our Office
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
                Have an inquiry about an insurance plan, taxation status, or CSP desk hours? Contact us directly or drop by our location.
              </p>

              <div className="space-y-6 mb-8">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Office Address</h4>
                    <p className="text-sm font-semibold text-slate-800 mt-1 leading-relaxed">
                      Vill + PO: Rampur Bazar, PS: Sandeshkhali,<br />
                      Dist: North 24 Parganas, West Bengal
                    </p>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Call Support</h4>
                    <a 
                      href="tel:+919609080917" 
                      className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors mt-1 block"
                    >
                      +91 96090 80917
                    </a>
                  </div>
                </div>

                {/* General Support */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Inquiry</h4>
                    <p className="text-sm font-semibold text-slate-800 mt-1 block">
                      support@skonline.in
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Buttons */}
              <div className="flex flex-wrap gap-4">
                <a 
                  href="tel:+919609080917"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md hover:shadow-blue-500/10 transition-all gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Directly
                </a>
                <a 
                  href="https://wa.me/919609080917"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md hover:shadow-emerald-500/10 transition-all gap-2"
                >
                  <Send className="w-4 h-4" />
                  WhatsApp Chat
                </a>
              </div>
            </div>

            {/* Quick Contact Form (Right) */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-10 reveal-on-scroll">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2">Send a Quick Message</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-6">Fill out the quick form below and our team will get back to you within 24 hours.</p>

              <form onSubmit={(e) => { e.preventDefault(); alert("Thank you! Your inquiry was submitted."); }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      required 
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Mobile Number</label>
                    <input 
                      type="tel" 
                      placeholder="10-digit Mobile" 
                      required 
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Select Service Interest</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  >
                    <option>LIC / Insurance Advisory</option>
                    <option>CSP BOB/BOI Banking</option>
                    <option>GST & Taxation Return Filing</option>
                    <option>Tathya Mitra / CSC Certificates</option>
                    <option>Travel / Ticketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Message Description</label>
                  <textarea 
                    rows={4} 
                    placeholder="Enter your message details here..." 
                    required 
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg shadow-md hover:shadow-blue-500/10 transition-all"
                >
                  Submit Inquiry
                </button>
              </form>
            </div>
            
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-slate-900 pb-8 mb-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="SK ONLINE" className="w-8 h-8 rounded-lg object-cover" />
              <div>
                <div className="text-sm font-extrabold text-white tracking-tight">SK ONLINE</div>
                <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">CSP Banking & Multi-Service Hub</div>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-start md:justify-center gap-6">
              <a href="#home" className="text-xs hover:text-white transition-colors">Home</a>
              <a href="#about" className="text-xs hover:text-white transition-colors">About</a>
              <a href="#services" className="text-xs hover:text-white transition-colors">Services</a>
              <a href="#contact" className="text-xs hover:text-white transition-colors">Contact</a>
            </div>

            {/* Auth Link */}
            <div className="flex justify-start md:justify-end">
              <Link 
                to="/login" 
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
              >
                Operator Login Portal
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
            <div>
              &copy; {new Date().getFullYear()} SK ONLINE. All rights reserved.
            </div>
            <div className="flex items-center gap-1">
              Powered by{" "}
              <a 
                href="https://digitalsolution.biz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 hover:underline font-semibold"
              >
                Digital Solution
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Draggable WhatsApp Breathing Button */}
      <a
        ref={dragRef}
        href="https://wa.me/919609080917"
        target="_blank"
        rel="noopener noreferrer"
        title="Chat on WhatsApp"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#22c55e] text-white rounded-full shadow-lg flex items-center justify-center cursor-move transition-transform active:scale-95 duration-100 select-none animate-float-whatsapp whatsapp-ripple ${
          isDragging ? 'shadow-2xl scale-105 rotate-6 border border-white/20' : ''
        }`}
        style={{ touchAction: 'none' }}
      >
        <svg 
          className="w-8 h-8 fill-current select-none pointer-events-none" 
          viewBox="0 0 24 24"
        >
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.92 9.92 0 0 0 4.808 1.238h.005c5.507 0 9.99-4.478 9.99-9.985 0-2.667-1.037-5.176-2.922-7.062A9.913 9.913 0 0 0 12.012 2zm5.792 13.917c-.318.896-1.848 1.644-2.544 1.745-.558.082-1.127.14-3.082-.67-2.607-1.077-4.225-3.79-4.354-3.963-.131-.173-1.06-1.409-1.06-2.69 0-1.282.671-1.913.908-2.17.237-.258.519-.323.69-.323.173 0 .346.002.497.008.156.007.366-.06.574.453.214.53.731 1.785.794 1.916.064.13.107.283.02.455-.085.173-.129.28-.258.432-.13.153-.271.341-.388.458-.13.13-.264.27-.113.528.15.259.667 1.102 1.43 1.78.983.876 1.808 1.146 2.066 1.275.258.13.409.108.56-.065.152-.173.647-.754.82-1.013.173-.259.346-.216.582-.13.237.086 1.503.708 1.762.838.259.13.431.194.496.302.064.108.064.625-.254 1.521z" />
        </svg>
      </a>
    </div>
  );
}
