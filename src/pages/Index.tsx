import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, Phone, Mail, MapPin, ExternalLink, ArrowRight, 
  Layers, Landmark, FileText, CheckCircle2, ChevronRight, Award, 
  Activity, Send, Menu, X, Calendar, UserCheck, Star
} from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/sk-logo.png";
import agentPortrait from "@/assets/agent-portrait.jpg";
import agentAction from "@/assets/agent-action.jpg";
import SEO from "@/components/common/SEO";
import { addInquiry } from "@/lib/storage";
import { generateId } from "@/lib/utils";

// Custom styles for lightweight animations and hover effects
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
    transform: translateY(24px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .reveal-on-scroll.active {
    opacity: 1;
    transform: translateY(0);
  }
  
  /* Translucent glassmorphic navigation bar */
  .glass-header {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  }
  
  /* Premium Mesh Background system */
  .mesh-gradient-bg {
    background-color: #F8FAFC;
    background-image: 
      radial-gradient(at 0% 0%, rgba(238, 242, 255, 0.4) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(254, 249, 195, 0.25) 0px, transparent 50%),
      radial-gradient(at 50% 100%, rgba(255, 255, 255, 0.8) 0px, transparent 50%);
  }

  /* Interactive service cards shared styling */
  .service-card-premium {
    position: relative;
    background-color: #FFFFFF;
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 1rem; /* rounded-2xl */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .service-card-premium:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
  }
  .icon-container-premium {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s, color 0.3s;
  }
  .service-card-premium:hover .icon-container-premium {
    transform: scale(1.1);
  }
`;

export default function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dragRef = useRef<HTMLAnchorElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Inquiry Form state
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryMobile, setInquiryMobile] = useState("");
  const [inquiryService, setInquiryService] = useState("LIC Advisory");
  const [inquiryMessage, setInquiryMessage] = useState("");

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
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
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

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 10-digit mobile verification
    const cleanMobile = inquiryMobile.replace(/[^0-9]/g, "");
    if (cleanMobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    const newInquiry = {
      id: generateId(),
      name: inquiryName.trim(),
      mobile: cleanMobile,
      service: inquiryService,
      message: inquiryMessage.trim(),
      timestamp: new Date().toISOString(),
      resolved: false
    };

    try {
      addInquiry(newInquiry);
      toast.success("Thank you! Your inquiry has been submitted successfully.");
      
      // Clear form
      setInquiryName("");
      setInquiryMobile("");
      setInquiryMessage("");
    } catch (err) {
      toast.error("Failed to save your inquiry. Please try again.");
    }
  };

  const licOfferings = [
    {
      title: "Life Insurance Protection",
      desc: "Comprehensive financial security and family risk coverage.",
      themeColor: "#2563EB",
      iconBg: "bg-blue-50 text-[#2563EB] border border-blue-100/60",
      btnClass: "text-[#2563EB] hover:text-[#1D4ED8]"
    },
    {
      title: "Guaranteed Savings & Wealth",
      desc: "Structured maturity returns and systematic wealth creation plans.",
      themeColor: "#D97706",
      iconBg: "bg-amber-50 text-[#D97706] border border-amber-100/60",
      btnClass: "text-[#D97706] hover:text-[#B45309]"
    },
    {
      title: "Retirement & Pension Solutions",
      desc: "Guaranteed life-long pensions for complete post-retirement independence.",
      themeColor: "#6366F1",
      iconBg: "bg-indigo-50 text-[#6366F1] border border-indigo-100/60",
      btnClass: "text-[#6366F1] hover:text-[#4F46E5]"
    },
    {
      title: "Child Education & Future Shield",
      desc: "Targeted investment funds securing your child's higher education and marriage.",
      themeColor: "#0284C7",
      iconBg: "bg-sky-50 text-[#0284C7] border border-sky-100/60",
      btnClass: "text-[#0284C7] hover:text-[#0369A1]"
    },
    {
      title: "Health & Comprehensive Term Shield",
      desc: "High-value critical coverage and modern financial protection riders.",
      themeColor: "#059669",
      iconBg: "bg-emerald-50 text-[#059669] border border-emerald-100/60",
      btnClass: "text-[#059669] hover:text-[#047857]"
    }
  ];

  const coreServices = [
    {
      title: "Dual Bank CSP Banking Desk",
      tagline: "Bank of Baroda & Bank of India Authorized CSP",
      description: "Official branch banking, AEPS cash transactions, deposits, and new account openings.",
      icon: <Landmark className="w-5.5 h-5.5" />,
      badge: "BOB & BOI CSP",
      themeColor: "#1E3A8A",
      iconBg: "bg-blue-100/60 text-[#1E3A8A] border border-blue-200/50",
      btnClass: "text-[#1E3A8A] hover:text-[#172554]"
    },
    {
      title: "Taxation, GST & ITR Filing",
      tagline: "GST & Income Tax Returns Office",
      description: "End-to-end support for business GST registration, monthly returns, and personal ITR filing.",
      icon: <FileText className="w-5.5 h-5.5" />,
      badge: "GST & ITR",
      themeColor: "#E11D48",
      iconBg: "bg-rose-50 text-[#E11D48] border border-rose-100/60",
      btnClass: "text-[#E11D48] hover:text-[#BE123C]"
    },
    {
      title: "CSC & Government Citizen Desk",
      tagline: "Authorized Digital Government Services",
      description: "Authorized digital center for certificates, trade licenses, and government scheme applications.",
      icon: <Layers className="w-5.5 h-5.5" />,
      badge: "Digital India",
      themeColor: "#0D9488",
      iconBg: "bg-teal-50 text-[#0D9488] border border-teal-100/60",
      btnClass: "text-[#0D9488] hover:text-[#0F766E]"
    },
    {
      title: "Travel & Ticketing Portal",
      tagline: "Railway & Flight E-Bookings",
      description: "Instant booking desk for airline reservations and official IRCTC train e-ticketing.",
      icon: <Activity className="w-5.5 h-5.5" />,
      badge: "IRCTC Authorized",
      themeColor: "#EA580C",
      iconBg: "bg-orange-50 text-[#EA580C] border border-orange-100/60",
      btnClass: "text-[#EA580C] hover:text-[#C2410C]"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#334155] font-sans selection:bg-[#0056B3] selection:text-white relative overflow-hidden mesh-gradient-bg">
      <SEO 
        title="Alinur Sekh - Senior LIC Advisor & Multi-Service Hub" 
        description="Official portfolio of Alinur Sekh (Certified Senior LIC Advisor, License 16541-41A). Dual-banking BOB/BOI CSP services, GST/ITR filing, and CSC Tathya Mitra."
      />
      
      <style>{inlineStyles}</style>
      
      {/* Modern Light Glassmorphic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo + Brand Name */}
            <div className="flex items-center gap-3">
              <div className="relative group flex-shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#003366] to-[#0056B3] rounded-lg blur opacity-15 group-hover:opacity-30 transition duration-300"></div>
                <img 
                  src={logoImg} 
                  alt="SK ONLINE Logo" 
                  className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-contain bg-white p-0.5 border border-slate-200" 
                />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-[#0F172A] tracking-tight leading-none">SK ONLINE</h1>
                <p className="text-[10px] text-[#0056B3] font-bold tracking-wider uppercase mt-0.5 sm:mt-1">Multi-Service & LIC Hub</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#home" className="text-[#334155] hover:text-[#003366] text-xs sm:text-sm font-semibold transition-colors">Home</a>
              <a href="#about" className="text-[#334155] hover:text-[#003366] text-xs sm:text-sm font-semibold transition-colors">About Alinur</a>
              <a href="#lic-plans" className="text-[#334155] hover:text-[#003366] text-xs sm:text-sm font-semibold transition-colors">LIC Plans</a>
              <a href="#services" className="text-[#334155] hover:text-[#003366] text-xs sm:text-sm font-semibold transition-colors">Other Services</a>
              <a href="#contact" className="text-[#334155] hover:text-[#003366] text-xs sm:text-sm font-semibold transition-colors">Contact</a>
            </nav>

            {/* Login Action (Top-Right) */}
            <div className="hidden md:block">
              <Link 
                id="header-login-btn"
                to="/login" 
                className="inline-flex items-center justify-center px-4.5 py-2.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all duration-150 gap-2 border border-[#003366]/20"
              >
                <ShieldCheck className="w-4 h-4" />
                Login Portal
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#334155] hover:text-[#0F172A] focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 animate-fade-in-down">
            <div className="px-4 pt-2 pb-6 space-y-3 shadow-inner">
              <a 
                href="#home" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-semibold text-[#334155] hover:bg-slate-50 hover:text-[#003366] transition-colors"
              >
                Home
              </a>
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-semibold text-[#334155] hover:bg-slate-50 hover:text-[#003366] transition-colors"
              >
                About Alinur
              </a>
              <a 
                href="#lic-plans" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-semibold text-[#334155] hover:bg-slate-50 hover:text-[#003366] transition-colors"
              >
                LIC Plans
              </a>
              <a 
                href="#services" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-semibold text-[#334155] hover:bg-slate-50 hover:text-[#003366] transition-colors"
              >
                Other Services
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-semibold text-[#334155] hover:bg-slate-50 hover:text-[#003366] transition-colors"
              >
                Contact
              </a>
              <div className="pt-3 px-3">
                <Link 
                  to="/login"
                  className="w-full flex items-center justify-center py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-md font-bold text-xs uppercase tracking-wider gap-2 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Mesh background, 2-Column Split Layout */}
      <section id="home" className="relative pt-24 pb-16 sm:pt-36 sm:pb-24 border-b border-slate-200/60 overflow-hidden bg-gradient-to-b from-[#EEF2FF]/40 via-white to-[#FEF9C3]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0056B3]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline and Badges */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Authorized Pills Row */}
              <div className="flex flex-wrap items-center gap-3 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-150 text-blue-700">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold tracking-wide">Government Authorized Multi-Service Desk</span>
                </div>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#AA7C11]">
                  <span className="text-xs">⭐</span>
                  <span className="text-[11px] font-bold tracking-wide">LIC Agent License: 16541-41A</span>
                </div>
              </div>
              
              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.12] text-[#0F172A] reveal-on-scroll active">
                Secure Your Today,<br />
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#AA7C11] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm">Protect Your Tomorrow</span>
              </h2>
              
              <p className="text-[#475569] text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-xl reveal-on-scroll active">
                Authorized Financial Advisory & Dual-Bank CSP Banking Services Managed by Alinur Sekh.
              </p>

              {/* LIC Agent Trust Card */}
              <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 max-w-lg shadow-sm hover:shadow transition-shadow backdrop-blur-sm reveal-on-scroll active">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#003366] uppercase tracking-wider mb-2">
                  <Star className="w-3.5 h-3.5 fill-current text-[#D4AF37]" />
                  Authorized Senior Advisor Profile
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-extrabold text-[#0F172A]">Alinur Sekh</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">License: <span className="font-extrabold text-slate-800">16541-41A</span> &nbsp;|&nbsp; 10+ Years Experience</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 size={10} /> Active
                  </span>
                </div>
                <div className="text-xs italic text-slate-650 mt-3 font-medium border-t border-slate-100 pt-2.5">
                  "Your Trust. My Commitment. Securing Your Today, Protecting Your Tomorrow."
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 pt-2 reveal-on-scroll active">
                <a 
                  href="#lic-plans" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#0056B3] hover:bg-[#004494] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-150 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 gap-2"
                >
                  Explore LIC Plans
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="#contact" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 text-[#003366] font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-150 border border-slate-300 hover:border-slate-400 gap-2 shadow-sm"
                >
                  Get in Touch
                </a>
              </div>
            </div>

            {/* Right Column: Stylized Portrait Container */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end reveal-on-scroll active">
              <div className="relative max-w-sm w-full">
                {/* Visual back gold accent border offset */}
                <div className="absolute -inset-1.5 rounded-[26px] bg-gradient-to-tr from-[#D4AF37]/30 to-[#003366]/20 blur-sm -z-10" />
                
                {/* Image Card Container with rounded-2xl and custom shadow */}
                <div 
                  className="bg-white rounded-2xl p-2.5 border-2 border-[#D4AF37] overflow-hidden relative"
                  style={{ boxShadow: "0 20px 40px -15px rgba(0, 51, 102, 0.15)" }}
                >
                  <div className="rounded-xl overflow-hidden border border-[#D4AF37]/40 aspect-[4/5] w-full h-[420px]">
                    <img 
                      src={agentPortrait} 
                      alt="Alinur Sekh Portrait" 
                      className="w-full h-full object-cover object-top block" 
                    />
                  </div>
                  
                  {/* Floating verification badge */}
                  <div className="absolute bottom-5 left-5 right-5 bg-white/95 border border-slate-150 p-3 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">🏆</span>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#0F172A]">Alinur Sekh</div>
                      <div className="text-[10px] text-slate-500 font-bold tracking-wide uppercase">10+ Years of Professional Excellence</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* About Alinur Section - Crisp White Box Layout */}
      <section id="about" className="py-16 sm:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-center">
            
            {/* Visual Action Photo Column (Left) */}
            <div className="lg:col-span-5 relative reveal-on-scroll">
              <div className="absolute -top-3 -left-3 w-32 h-32 bg-blue-50 rounded-2xl -z-10 animate-pulse" />
              <div className="absolute -bottom-3 -right-3 w-32 h-32 bg-[#D4AF37]/5 rounded-2xl -z-10" />
              
              {/* Image Container Fix - aspect 4:3 or 16:10 with top framing */}
              <div className="bg-white rounded-[20px] p-2 border border-slate-250 shadow-xl overflow-hidden relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3]">
                <img 
                  src={agentAction} 
                  alt="Alinur Sekh with LIC plaque" 
                  className="w-full h-full object-cover object-top rounded-[14px]"
                />
                {/* Floating gold ribbon/badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md border border-[#D4AF37]">
                  🏆 10+ Years of Excellence
                </div>
              </div>
            </div>

            {/* Text Column (Right) */}
            <div className="lg:col-span-7 space-y-6 reveal-on-scroll">
              <div className="flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#0056B3]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#0056B3]">About the Advisor</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                Alinur Sekh — 10+ Years of Financial Integrity & Advisory
              </h2>
              
              <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
                As a registered and certified Life Insurance Corporation (LIC) Advisor (License: <code>16541-41A</code>), Alinur Sekh has spent over a decade delivering custom life insurance protection and savings strategies to thousands of families and businesses across Rampur Bazar, Sandeshkhali, and North 24 Parganas.
              </p>
              
              <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
                We believe that financial security is the base of building a prospering community. Beside LIC policy planning, our office coordinates banking inclusion solutions through authorized Customer Service Point (CSP) banking counters and assists citizens with essential compliance tools.
              </p>
              
              {/* Premium styled stats widgets */}
              <div className="grid grid-cols-2 gap-6 border-t border-slate-150 pt-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#003366] to-[#0056B3] bg-clip-text text-transparent">10+ Years</div>
                  <div className="text-[10px] text-[#475569] font-bold uppercase tracking-wide mt-1">Experience in Advisory</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent font-mono">16541-41A</div>
                  <div className="text-[10px] text-[#475569] font-bold uppercase tracking-wide mt-1">Verified LIC License</div>
                </div>
              </div>

              <div className="pt-2">
                <a 
                  href="#contact" 
                  className="inline-flex items-center text-sm sm:text-base font-bold text-[#0056B3] hover:text-[#003c80] gap-1.5 group"
                >
                  Schedule a private advisory session
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Primary Services - LIC Insurance Solutions Section */}
      <section id="lic-plans" className="py-16 sm:py-24 bg-[#F8FAFC]/50 border-t border-slate-200/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 reveal-on-scroll">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#003366]/5 border border-[#003366]/10 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#003366]">LIC Solutions</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Life Insurance Corporation (LIC) Spotlight
            </h2>
            <p className="text-[#475569] text-sm sm:text-lg mt-2">
              Protect your loved ones and achieve structured capital returns with official life insurance plans designed by Alinur Sekh.
            </p>
          </div>

          {/* LIC Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {licOfferings.map((plan, idx) => (
              <div 
                key={idx}
                className="service-card-premium p-8 relative overflow-hidden flex flex-col justify-between group"
              >
                {/* Top accent indicator line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: `linear-gradient(to right, ${plan.themeColor}, ${plan.themeColor}CC)` }}
                />
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors icon-container-premium ${plan.iconBg}`}>
                    {idx === 0 && <ShieldCheck className="w-5.5 h-5.5" />}
                    {idx === 1 && <Award className="w-5.5 h-5.5" />}
                    {idx === 2 && <Calendar className="w-5.5 h-5.5" />}
                    {idx === 3 && <UserCheck className="w-5.5 h-5.5" />}
                    {idx === 4 && <Activity className="w-5.5 h-5.5" />}
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0F172A] mb-3">{plan.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{plan.desc}</p>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#D4AF37]">LIC India Plans</span>
                  <a href="#contact" className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${plan.btnClass}`}>
                    Apply Now
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Services - Digital & Banking CSP Services Section */}
      <section id="services" className="py-16 sm:py-24 bg-white border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 reveal-on-scroll">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0056B3]/5 border border-[#0056B3]/10 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0056B3]">Secondary Services</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              CSP Banking & Digital Hub
            </h2>
            <p className="text-[#475569] text-sm sm:text-lg mt-2">
              Access secure banking kiosks, regulatory business taxation guidance, and official travel bookings.
            </p>
          </div>

          {/* Core Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coreServices.map((service, idx) => (
              <div 
                key={idx}
                className="service-card-premium p-8 relative overflow-hidden flex flex-col sm:flex-row gap-6 items-start justify-between group"
              >
                {/* Top accent indicator line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: `linear-gradient(to right, ${service.themeColor}, ${service.themeColor}CC)` }}
                />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 icon-container-premium ${service.iconBg}`}>
                  {service.icon}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#0056B3]">{service.badge}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0F172A]">{service.title}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{service.tagline}</p>
                  <p className="text-slate-500 text-xs leading-relaxed pt-1">{service.description}</p>
                  <div className="pt-3">
                    <a href="#contact" className={`inline-flex items-center text-xs font-bold gap-1.5 ${service.btnClass}`}>
                      Request Support
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture Form & Info Section */}
      <section id="contact" className="py-16 sm:py-24 bg-[#F8FAFC]/50 border-t border-slate-200/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Info Grid (Left) */}
            <div className="lg:col-span-5 space-y-6 reveal-on-scroll">
              <div className="flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#0056B3]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#0056B3]">Get in Touch</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                Secure Office Consultations
              </h2>
              
              <p className="text-slate-550 text-sm sm:text-base leading-relaxed">
                Connect with Alinur Sekh for custom life plans or request online support for taxes, certificates, and travel files.
              </p>

              <div className="space-y-6 pt-3">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    <MapPin className="w-5 h-5 text-[#003366]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Office Location</h4>
                    <p className="text-sm font-bold text-slate-800 mt-1 leading-relaxed">
                      Vill + PO: Rampur Bazar, PS: Sandeshkhali,<br />
                      Dist: North 24 Parganas, West Bengal
                    </p>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    <Phone className="w-5 h-5 text-[#003366]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Contact</h4>
                    <a 
                      href="tel:+919609080917" 
                      className="text-base font-bold text-slate-900 hover:text-[#0056B3] transition-colors mt-1 block"
                    >
                      +91 96090 80917
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    <Mail className="w-5 h-5 text-[#003366]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Inbox</h4>
                    <a 
                      href="mailto:alinursekh8437@gmail.com"
                      className="text-sm font-semibold text-slate-800 hover:text-[#0056B3] transition-colors mt-1 block"
                    >
                      alinursekh8437@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a 
                  href="tel:+919609080917"
                  className="inline-flex items-center justify-center px-5 py-3 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Directly
                </a>
                <a 
                  href="https://wa.me/919609080917"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-5 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send WhatsApp
                </a>
              </div>
            </div>

            {/* Quick Contact Form (Right) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-md reveal-on-scroll">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] mb-2">Schedule an Official Consultation</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">Complete the direct submission form below to forward your lead file directly to the operator console dashboard.</p>

              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      required 
                      value={inquiryName}
                      onChange={e => setInquiryName(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0056B3] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                    <input 
                      type="tel" 
                      placeholder="10-digit mobile" 
                      required 
                      value={inquiryMobile}
                      onChange={e => setInquiryMobile(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0056B3] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Service Category</label>
                  <select 
                    value={inquiryService}
                    onChange={e => setInquiryService(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0056B3] focus:bg-white transition-all"
                  >
                    <option value="LIC Advisory">LIC Life Insurance & Wealth Advisory</option>
                    <option value="Banking CSP">Bank of India / Bank of Baroda CSP Banking</option>
                    <option value="GST & ITR">GST Registration & ITR Filing</option>
                    <option value="CSC Services">CSC Digital Government Services</option>
                    <option value="Travel & Tickets">Flight & Train Ticket Bookings</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message / Inquiry Details</label>
                  <textarea 
                    rows={4} 
                    placeholder="Provide details about your inquiry..." 
                    required 
                    value={inquiryMessage}
                    onChange={e => setInquiryMessage(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0056B3] focus:bg-white transition-all"
                  />
                </div>

                <button 
                  type="submit" 
                  style={{ backgroundColor: '#1D4ED8' }}
                  className="w-full hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg shadow-md transition-all duration-150"
                >
                  Submit Official Inquiry
                </button>
              </form>
            </div>
            
          </div>
        </div>
      </section>

      {/* Global Corporate Footer */}
      <footer className="bg-[#0F172A] text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-slate-800 pb-8 mb-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="SK ONLINE" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
              <div>
                <div className="text-sm font-extrabold text-white tracking-tight">SK ONLINE</div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">CSP Banking & LIC India Hub</div>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-start md:justify-center gap-6">
              <a href="#home" className="text-xs font-medium hover:text-white transition-colors">Home</a>
              <a href="#about" className="text-xs font-medium hover:text-white transition-colors">About Alinur</a>
              <a href="#lic-plans" className="text-xs font-medium hover:text-white transition-colors">LIC Plans</a>
              <a href="#services" className="text-xs font-medium hover:text-white transition-colors">Services</a>
              <a href="#contact" className="text-xs font-medium hover:text-white transition-colors">Contact</a>
            </div>

            {/* Auth Link */}
            <div className="flex justify-start md:justify-end">
              <Link 
                to="/login" 
                className="text-xs font-bold text-[#0056B3] hover:text-[#003c80] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200"
              >
                Operator Login Portal
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
            <div>
              © 2026 SK ONLINE. All rights reserved.
            </div>
            <div className="flex items-center gap-1">
              Powered by{" "}
              <a 
                href="https://digitalsolution.biz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-350 hover:underline font-semibold"
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
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#22c55e] text-white rounded-full shadow-lg flex items-center justify-center cursor-move transition-transform active:scale-95 duration-105 select-none animate-float-whatsapp whatsapp-ripple ${
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
