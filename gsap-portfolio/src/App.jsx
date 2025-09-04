import React, { useRef, useLayoutEffect } from "react";
import { gsap } from "https://esm.sh/gsap";
import { ScrollTrigger } from "https://esm.sh/gsap/ScrollTrigger";
import { ScrollToPlugin } from "https://esm.sh/gsap/ScrollToPlugin";
import { TextPlugin } from "https://esm.sh/gsap/TextPlugin";
import * as Tone from 'https://cdn.skypack.dev/tone';
import myPhoto from "./assets/myphoto.jpg";
import "./App.css";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, TextPlugin);

// --- Sound Effects Manager ---
const createSoundEffects = () => {
  let isInitialized = false;
  let synth, hoverSynth, clickSynth;

  const initialize = () => {
    if (isInitialized || Tone.context.state !== 'suspended') return;
    Tone.start();
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
    }).toDestination();
    
    hoverSynth = new Tone.MonoSynth({
      oscillator: { type: "fmsine" },
      envelope: { attack: 0.01, decay: 0.1, release: 0.2 },
    }).toDestination();
    
    clickSynth = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 4000,
      resonance: 0.7
    }).toDestination();
    
    isInitialized = true;
  };
  
  document.body.addEventListener('click', initialize, { once: true });

  const playHoverSound = () => {
    if (!isInitialized) return;
    hoverSynth.triggerAttackRelease("C5", "8n", Tone.now());
  };

  const playClickSound = () => {
    if (!isInitialized) return;
    clickSynth.triggerAttackRelease("G4", "8n", Tone.now());
  };

  return { playHoverSound, playClickSound };
};

const sounds = createSoundEffects();

// --- Reusable Magnetic Effect Hook ---
const useMagneticEffect = (ref) => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = el.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      gsap.to(el, { x: x * 0.4, y: y * 0.4, duration: 0.8, ease: "power3.out" });
    };

    const onMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);

    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [ref]);
};

// --- Components ---
const CustomCursor = () => {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);

  useLayoutEffect(() => {
    const moveCursor = (e) => {
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.1 });
      gsap.to(followerRef.current, { x: e.clientX, y: e.clientY, duration: 0.4, ease: "power2.out" });
    };

    const addHoverEffect = () => {
      gsap.to(followerRef.current, { scale: 3, duration: 0.3 });
      sounds.playHoverSound();
    };
    const removeHoverEffect = () => gsap.to(followerRef.current, { scale: 1, duration: 0.3 });
    
    window.addEventListener("mousemove", moveCursor);
    const interactiveElements = 'a, button, .project-card';
    document.querySelectorAll(interactiveElements).forEach(el => {
      el.addEventListener("mouseenter", addHoverEffect);
      el.addEventListener("mouseleave", removeHoverEffect);
      el.addEventListener("click", sounds.playClickSound);
    });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.querySelectorAll(interactiveElements).forEach(el => {
        el.removeEventListener("mouseenter", addHoverEffect);
        el.removeEventListener("mouseleave", removeHoverEffect);
        el.removeEventListener("click", sounds.playClickSound);
      });
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="custom-cursor fixed w-2 h-2 bg-cyan-300 rounded-full pointer-events-none z-[101] translate-x-[-50%] translate-y-[-50%] shadow-[0_0_10px_#0ff]"></div>
      <div ref={followerRef} className="cursor-follower fixed w-8 h-8 border border-cyan-300 rounded-full pointer-events-none z-[101] translate-x-[-50%] translate-y-[-50%]"></div>
    </>
  );
};

const MagneticLink = ({ children, ...props }) => {
  const ref = useRef(null);
  useMagneticEffect(ref);
  return React.cloneElement(children, { ref, ...props });
};

const Portfolio = () => {
  const containerRef = useRef(null);
  const projectHoverTimeout = useRef(null);

  const handleProjectMouseEnter = (url) => {
    // Set a timer to open the URL after 2 seconds
    projectHoverTimeout.current = setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }, 2000); // 2000 milliseconds = 2 seconds
  };

  const handleProjectMouseLeave = () => {
    // If the mouse leaves before 2 seconds, cancel the timer
    clearTimeout(projectHoverTimeout.current);
  };
  const handleNavClick = (e, id) => {
    e.preventDefault();
    const section = document.getElementById(id);
    if (section) {
      gsap.to(window, { duration: 1.5, scrollTo: { y: section, offsetY: 70 }, ease: "power3.inOut" });
    }
  };

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      document.body.style.overflow = "hidden";

      // Loader Timeline
      const loaderTimeline = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = "auto";
        }
      });

      loaderTimeline
        .to(".loader-text-item", {
          opacity: 1,
          duration: 0.5,
          stagger: { each: 1.5 },
          onStart: function() { sounds.playHoverSound(); }
         })
        .to(".loader-text-item", { opacity: 0, duration: 0.5, stagger: { each: 1.5, from: "end" } }, 1)
        .to(".loader", { yPercent: -100, duration: 1.2, ease: "power4.inOut" });

      // Navbar Animation
      gsap.from(".nav-item", {
        y: -50,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power2.out",
        delay: loaderTimeline.duration() - 0.5
      });

      // Hero Title Glitch
      gsap.from(".hero-title", {
        duration: 2,
        text: {
          value: "Initiating Protocol...",
          scrambleText: {
            text: "CREATIVE MODERN PORTFOLIO",
            chars: "01"
          }
        },
        ease: "none",
        delay: loaderTimeline.duration()
      });

      gsap.from(".hero-subtitle", { x: -100, opacity: 0, duration: 1, delay: loaderTimeline.duration() + 0.5 });
      gsap.from(".cta-button", { scale: 0, opacity: 0, delay: loaderTimeline.duration() + 0.8, duration: 0.5 });
      gsap.from(".profile-picture-container", {
          scrollTrigger: { trigger: "#about", start: "top 80%" },
          opacity: 0,
          scale: 0.5,
          duration: 1,
          ease: 'power3.out'
      });
      gsap.to(".hexagon", {
          rotation: 360,
          duration: 30,
          repeat: -1,
          ease: "none"
      });
      gsap.from(".about-text-content > *", {
          scrollTrigger: { trigger: "#about", start: "top 75%" },
          opacity: 0,
          y: 50,
          stagger: 0.2,
          duration: 1,
          ease: 'power3.out'
      });
      gsap.utils.toArray(".project-card").forEach(card => {
          gsap.from(card, {
              scrollTrigger: { trigger: card, start: "top 80%", toggleActions: "play none none reverse" },
              y: 50,
              opacity: 0,
              duration: 0.8,
              ease: "power2.out"
          });
      });
      gsap.utils.toArray(".skill-bar").forEach(bar => {
          gsap.fromTo(bar, { width: "0%" }, {
              width: bar.dataset.progress,
              scrollTrigger: { trigger: bar, start: "top 85%", toggleActions: "play none none reverse" },
              duration: 1.5,
              ease: "power3.out"
          });
      });
            // --- TOOLS & TECHNOLOGIES FLOATING ANIMATION ---
      gsap.utils.toArray(".tool-icon").forEach((icon, i) => {
        gsap.to(icon, {
          y: i % 2 === 0 ? -10 : 10, // alternate up/down
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          duration: 2 + Math.random() * 1.5, // randomize speed a bit
          delay: i * 0.1 // staggered start
        });
      });


      const timelineSVG = document.querySelector('.timeline-svg');
      if (timelineSVG) {
          gsap.fromTo(timelineSVG.querySelector('path'), 
              { strokeDasharray: 1000, strokeDashoffset: 1000 },
              {
                  strokeDashoffset: 0,
                  scrollTrigger: {
                      trigger: ".timeline",
                      start: "top 50%",
                      end: "bottom 80%",
                      scrub: 1
                  }
              }
          );
      }
      gsap.utils.toArray(".timeline-item").forEach((item, i) => {
          gsap.from(item, {
              scrollTrigger: { trigger: item, start: "top 85%", toggleActions: "play none none reverse" },
              x: i % 2 === 0 ? -100 : 100,
              opacity: 0,
              duration: 0.7,
              ease: "power2.out",
          });
      });

      // Add transparent hover zones at the top of each major section
      const sectionIds = ["about", "projects", "skills", "experience", "contact"];
      sectionIds.forEach(id => {
        const section = document.getElementById(id);
        if (!section) return;
        const topZone = section.querySelector(".top-hover-zone");
        if (!topZone) return;
        const onMouseEnter = () => {
          gsap.to(window, { duration: 1.2, scrollTo: { y: section, offsetY: 70 }, ease: "power3.out" });
        };
        topZone.addEventListener("mouseenter", onMouseEnter);
        topZone._onMouseEnter = onMouseEnter;
      });

      return () => {
        sectionIds.forEach(id => {
          const section = document.getElementById(id);
          const topZone = section && section.querySelector(".top-hover-zone");
          if (topZone && topZone._onMouseEnter) {
            topZone.removeEventListener("mouseenter", topZone._onMouseEnter);
            delete topZone._onMouseEnter;
          }
        });
      };
    }, containerRef);

    return () => {
      if (ctx) ctx.revert();
      document.body.style.overflow = "auto";
    };
  }, []);
  

  return (
    <div ref={containerRef} className="font-mono text-cyan-200 bg-[#0A192F] min-h-screen selection:bg-cyan-500 selection:text-slate-900 md:cursor-none">
      <CustomCursor />

      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-grid"></div>
{/* --- LOADER --- */}
<div className="loader fixed top-0 left-0 h-screen w-full bg-[#0A192F] z-[101] flex justify-center items-center overflow-hidden">
  {/* Sci-fi background effect */}
  <div className="absolute inset-0 jarvis-bg"></div>
  
  <div className="text-2xl font-bold text-cyan-300 w-96 text-center h-8 z-10">
    <div className="loader-text-item relative w-full opacity-0">Initializing J.A.R.V.I.S. Protocol...</div>
    <div className="loader-text-item relative w-full opacity-0">Calibrating Arc Reactor...</div>
    <div className="loader-text-item absolute w-full opacity-0">Welcome, Siddharth</div>
  </div>
</div>


      <nav className="fixed top-0 left-0 right-0 bg-[#0A192F]/70 backdrop-blur-lg z-50 flex justify-center space-x-4 md:space-x-10 py-4 border-b border-cyan-300/20">
        <MagneticLink><a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="nav-item cursor-pointer hover:text-cyan-300 transition-colors p-2 text-sm md:text-base">Identity</a></MagneticLink>
        <MagneticLink><a href="#projects" onClick={(e) => handleNavClick(e, 'projects')} className="nav-item cursor-pointer hover:text-cyan-300 transition-colors p-2 text-sm md:text-base">Armor Bay</a></MagneticLink>
        <MagneticLink><a href="#skills" onClick={(e) => handleNavClick(e, 'skills')} className="nav-item cursor-pointer hover:text-cyan-300 transition-colors p-2 text-sm md:text-base">Tech Specs</a></MagneticLink>
        <MagneticLink><a href="#experience" onClick={(e) => handleNavClick(e, 'experience')} className="nav-item cursor-pointer hover:text-cyan-300 transition-colors p-2 text-sm md:text-base">Mission Logs</a></MagneticLink>
        <MagneticLink><a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="nav-item cursor-pointer hover:text-cyan-300 transition-colors p-2 text-sm md:text-base">Contact</a></MagneticLink>
      </nav>

      <section id="about" className="max-w-5xl mx-auto px-8 py-24 relative">
        <div className="top-hover-zone absolute top-0 left-0 w-full h-[70px] z-20 cursor-pointer"></div>
        <div className="grid md:grid-cols-5 gap-16 items-center">
          <div className="md:col-span-2 profile-picture-container relative w-full aspect-square flex items-center justify-center">
            <svg className="hexagon absolute w-full h-full" viewBox="0 0 100 100">
              <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" stroke="#0ff" strokeWidth="1" fill="none" />
            </svg>
            <svg className="hexagon absolute w-full h-full scale-75" viewBox="0 0 100 100">
              <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" stroke="#0ff" strokeWidth="0.5" fill="none" />
            </svg>
            <div className="w-2/3 aspect-square rounded-full overflow-hidden shadow-2xl z-10">
              <img src={myPhoto} alt="Profile" className="w-full h-full object-cover"/>
            </div>
          </div>
          <div className="md:col-span-3 about-text-content">
            <h2 className="text-4xl font-semibold mb-6 text-cyan-300">Siddharth Singh Baghel</h2>
            <p className="text-lg text-cyan-200/80 leading-relaxed">Passionate web developer and Data Engineer skilled in modern technologies like  react.js , Next.js ,Snowflake and ADF. I focus on building beautiful, intuitive, and high-performance web applications that leave a lasting impression.</p>
          </div>
        </div>
      </section>

  {/* --- REPLACEMENT FOR PROJECTS SECTION --- */}
      <section id="projects" className="max-w-5xl mx-auto px-8 py-24 space-y-8 relative">
        <div className="top-hover-zone absolute top-0 left-0 w-full h-[70px] z-20 cursor-pointer"></div>
        <h2 className="text-4xl font-semibold mb-8 text-cyan-300">Projects</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Project MARK I', description: 'Ride Hailing Application - Sawari', url: 'https://sawari-ui.onrender.com' },
            { title: 'Project MARK II', description: 'Video Conferencing Application - InstaMeet', url: 'https://zoomyfrontend.onrender.com' },
            { title: 'Project MARK III', description: 'Swiggy Revenue Generator Dashboard by Streamlit', url: '#' },
            { title: 'Project MARK IV', description: 'Random GIF generator - RGG', url: 'https://random-gif-generator-ui.onrender.com' },
            { title: 'Project MARK V', description: 'AI-Finance Platform - ArthiQ', url: 'http://finance-5zsxx2vn0-siddharth-singh-baghels-projects.vercel.app' }
          ].map((project) => (
            <div
              key={project.title}
              className="project-card bg-[#112240] p-6 rounded-lg shadow-lg cursor-pointer border border-cyan-300/20 hover:border-cyan-300 transition-all relative overflow-hidden"
              onMouseEnter={() => handleProjectMouseEnter(project.url)}
              onMouseLeave={handleProjectMouseLeave}
            >
              <div className="scanline"></div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-300">{project.title}</h3>
              <p className="text-cyan-200/80">{project.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="skills" className="max-w-5xl mx-auto px-8 py-24 relative">
        <div className="top-hover-zone absolute top-0 left-0 w-full h-[70px] z-20 cursor-pointer"></div>
        <h2 className="text-4xl font-semibold mb-8 text-cyan-300">Skills</h2>
        <div className="space-y-6">
          <div>
            <h4 className="mb-2 font-medium">HTML</h4>
            <div className="skill-bar-bg w-full h-4 rounded-full bg-cyan-900/50 border border-cyan-300/30">
              <div className="skill-bar h-full rounded-full bg-cyan-400" data-progress="90%" style={{boxShadow: '0 0 10px #0ff'}}></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Tailwind CSS Framework</h4>
            <div className="skill-bar-bg w-full h-4 rounded-full bg-cyan-900/50 border border-cyan-300/30">
              <div className="skill-bar h-full rounded-full bg-cyan-400" data-progress="85%" style={{boxShadow: '0 0 10px #0ff'}}></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium">React</h4>
            <div className="skill-bar-bg w-full h-4 rounded-full bg-cyan-900/50 border border-cyan-300/30">
              <div className="skill-bar h-full rounded-full bg-cyan-400" data-progress="90%" style={{boxShadow: '0 0 10px #0ff'}}></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Next.js</h4>
            <div className="skill-bar-bg w-full h-4 rounded-full bg-cyan-900/50 border border-cyan-300/30">
              <div className="skill-bar h-full rounded-full bg-cyan-400" data-progress="50%" style={{boxShadow: '0 0 10px #0ff'}}></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Express js</h4>
            <div className="skill-bar-bg w-full h-4 rounded-full bg-cyan-900/50 border border-cyan-300/30">
              <div className="skill-bar h-full rounded-full bg-cyan-400" data-progress="82%" style={{boxShadow: '0 0 10px #0ff'}}></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Node.js</h4>
            <div className="skill-bar-bg w-full h-4 rounded-full bg-cyan-900/50 border border-cyan-300/30">
              <div className="skill-bar h-full rounded-full bg-cyan-400" data-progress="80%" style={{boxShadow: '0 0 10px #0ff'}}></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium">SQL</h4>
            <div className="skill-bar-bg w-full h-4 rounded-full bg-cyan-900/50 border border-cyan-300/30">
              <div className="skill-bar h-full rounded-full bg-cyan-400" data-progress="88%" style={{boxShadow: '0 0 10px #0ff'}}></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Snowflake</h4>
            <div className="skill-bar-bg w-full h-4 rounded-full bg-cyan-900/50 border border-cyan-300/30">
              <div className="skill-bar h-full rounded-full bg-cyan-400" data-progress="75%" style={{boxShadow: '0 0 10px #0ff'}}></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Azure Data Factory</h4>
            <div className="skill-bar-bg w-full h-4 rounded-full bg-cyan-900/50 border border-cyan-300/30">
              <div className="skill-bar h-full rounded-full bg-cyan-400" data-progress="70%" style={{boxShadow: '0 0 10px #0ff'}}></div>
            </div>
          </div>
        </div>
      </section>
                 {/* --- TOOLS & TECHNOLOGIES --- */}
      <section id="tools" className="max-w-5xl mx-auto px-8 py-24 relative">
  <h2 className="text-4xl font-semibold mb-12 text-cyan-300">Tools & Technologies</h2>
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-8 text-cyan-300 text-5xl justify-items-center">
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-html5-plain"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-css3-plain"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-javascript-plain"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-tailwindcss-plain"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-react-original"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-nextjs-original"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-express-original"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-nodejs-plain"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-mysql-plain"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-mongodb-plain"></i></div>
    <div className="tool-icon hover:text-cyan-400 transition-colors"><i className="devicon-azure-plain"></i></div>
  </div>
</section>




      <section id="experience" className="max-w-5xl mx-auto px-8 py-24 relative">
        <div className="top-hover-zone absolute top-0 left-0 w-full h-[70px] z-20 cursor-pointer"></div>
        <h2 className="text-4xl font-semibold mb-12 text-center text-cyan-300">Mission Logs</h2>
        <div className="timeline w-full relative flex justify-center">
          <svg className="timeline-svg absolute top-0 left-1/2 w-1 h-full -translate-x-1/2" preserveAspectRatio="none" viewBox="0 0 2 1000">
            <path d="M 1 0 V 1000" stroke="#0ff" strokeWidth="2" fill="none" style={{boxShadow: '0 0 10px #0ff'}}/>
          </svg>
          <div className="w-full relative space-y-16">
            <div className="timeline-item w-11/12 md:w-5/12 p-6 rounded-lg bg-[#112240] shadow-lg border border-cyan-300/20">
              <h3 className="text-2xl font-semibold mb-2 text-cyan-300">Full Stack Developer</h3>
              <span className="text-cyan-400 font-medium">T.H.I.R.D Y.E.A.R - 2024 to Present</span>
              <p className="text-cyan-200/80 mt-2">Developed scalable React apps and full stack applications.</p>
            </div>
            <div className="timeline-item w-11/12 md:w-5/12 p-6 rounded-lg bg-[#112240] shadow-lg border border-cyan-300/20 ml-auto">
              <h3 className="text-2xl font-semibold mb-2 text-cyan-300">Data Engineer</h3>
              <span className="text-cyan-400 font-medium">F.I.N.A.L Y.E.A.R - 2025</span>
              <p className="text-cyan-200/80 mt-2">Created Data Pipelines ,handle ETL process and handle Data Management </p>
            </div>
            <div className="timeline-item w-11/12 md:w-5/12 p-6 rounded-lg bg-[#112240] shadow-lg border border-cyan-300/20">
              <h3 className="text-2xl font-semibold mb-2 text-cyan-300">Deloitte Virtual Internship</h3>
              <span className="text-cyan-400 font-medium">F.I.N.A.L Y.E.A.R - 2025</span>
              <p className="text-cyan-200/80 mt-2">Gained hands-on experience in coding and software development by solving real-world simulation tasks used at Deloitte via Forage</p>
            </div>
            
          </div>
        </div>
      </section>

      {/* --- CONNECT / SOCIALS SECTION --- */}
<section id="connect" className="max-w-5xl mx-auto px-8 py-24 relative">
  <h2 className="text-4xl font-semibold mb-12 text-cyan-300 text-center">Connect With Me</h2>
  <div className="flex flex-wrap justify-center gap-10 text-cyan-300 text-5xl">
    
    {/* LinkedIn */}
    <a href="https://www.linkedin.com/in/siddharth-singh-b9a921259/" 
       target="_blank" rel="noopener noreferrer"
       className="tool-icon hover:text-cyan-400 transition-colors">
      <i className="devicon-linkedin-plain"></i>
    </a>
    
    {/* GitHub */}
    <a href="https://github.com/siddharthsinghbaghel"
       target="_blank" rel="noopener noreferrer"
       className="tool-icon hover:text-cyan-400 transition-colors">
      <i className="devicon-github-original"></i>
    </a>
    
    {/* LeetCode (no devicon, use custom svg or img) */}
    <a href="https://leetcode.com/u/siddharthsinghbaghel/"
       target="_blank" rel="noopener noreferrer"
       className="tool-icon hover:scale-110 transition-transform">
      <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" 
           alt="LeetCode" 
           className="w-12 h-12" />
    </a>
    
    {/* Email */}
    <a href="mailto:siddharthsingh910989@gmail.com"
       className="tool-icon hover:text-cyan-400 transition-colors">
      📧
    </a>
    
    {/* Phone */}
    <a href="tel:9109897014"
       className="tool-icon hover:text-cyan-400 transition-colors">
      📱
    </a>
    
  </div>
</section>


      <section id="contact" className="max-w-5xl mx-auto px-8 py-24 relative">
        <div className="top-hover-zone absolute top-0 left-0 w-full h-[70px] z-20 cursor-pointer"></div>
        <h2 className="text-4xl font-semibold mb-8 text-cyan-300">Contact</h2>
        <form className="max-w-md space-y-5">
          <input type="text" placeholder="Name" className="contact-input w-full p-3 rounded bg-cyan-900/30 border border-cyan-300/30 focus:outline-none focus:border-cyan-300 transition-colors" />
          <input type="email" placeholder="Email" className="contact-input w-full p-3 rounded bg-cyan-900/30 border border-cyan-300/30 focus:outline-none focus:border-cyan-300 transition-colors" />
          <textarea placeholder="Message" rows="4" className="contact-input w-full p-3 rounded bg-cyan-900/30 border-cyan-300/30 focus:outline-none focus:border-cyan-300 transition-colors"></textarea>
          <MagneticLink><button type="submit" className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-300 transition-colors rounded-lg px-8 py-3 font-semibold">Send Transmission</button></MagneticLink>
        </form>
      </section>

      <style>{`
        .bg-grid {
            background-image: linear-gradient(to right, #00ffff1a 1px, transparent 1px), linear-gradient(to bottom, #00ffff1a 1px, transparent 1px);
            background-size: 3rem 3rem;
        }
        .scanline {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: #0ff;
            opacity: 0;
            pointer-events: none;
            box-shadow: 0 0 15px #0ff;
            animation: scan 3s linear infinite;
        }
        .project-card:hover .scanline { opacity: 1; }
        @keyframes scan {
            0% { transform: translateY(0); }
            100% { transform: translateY(150px); }
        }
        .top-hover-zone {
          /* Transparent, covers top 70px, cursor pointer */
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 70px;
          z-index: 20;
          cursor: pointer;
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default Portfolio;


// import React, { useRef, useLayoutEffect } from "react";
// import { gsap } from "https://esm.sh/gsap";
// import { ScrollTrigger } from "https://esm.sh/gsap/ScrollTrigger";

// gsap.registerPlugin(ScrollTrigger);

// // --- Reusable Magnetic Effect Hook ---
// const useMagneticEffect = (ref) => {
//   useLayoutEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     const onMouseMove = (e) => {
//       const { clientX, clientY } = e;
//       const { height, width, left, top } = el.getBoundingClientRect();
//       const x = clientX - (left + width / 2);
//       const y = clientY - (top + height / 2);
//       gsap.to(el, { x: x * 0.4, y: y * 0.4, duration: 0.8, ease: "power3.out" });
//     };
//     const onMouseLeave = () => {
//       gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
//     };
//     el.addEventListener("mousemove", onMouseMove);
//     el.addEventListener("mouseleave", onMouseLeave);
//     return () => {
//       el.removeEventListener("mousemove", onMouseMove);
//       el.removeEventListener("mouseleave", onMouseLeave);
//     };
//   }, [ref]);
// };

// // --- Components ---
// const CustomCursor = () => {
//   const cursorRef = useRef(null);
//   const followerRef = useRef(null);
//   useLayoutEffect(() => {
//     const moveCursor = (e) => {
//       gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.1 });
//       gsap.to(followerRef.current, { x: e.clientX, y: e.clientY, duration: 0.4, ease: "power2.out" });
//     };
//     const addHoverEffect = () => gsap.to(followerRef.current, { scale: 3, duration: 0.3 });
//     const removeHoverEffect = () => gsap.to(followerRef.current, { scale: 1, duration: 0.3 });
//     window.addEventListener("mousemove", moveCursor);
//     document.querySelectorAll('a, button, .project-card').forEach(el => {
//       el.addEventListener("mouseenter", addHoverEffect);
//       el.addEventListener("mouseleave", removeHoverEffect);
//     });
//     return () => window.removeEventListener("mousemove", moveCursor);
//   }, []);
//   return (
//     <>
//       <div ref={cursorRef} className="custom-cursor fixed w-2 h-2 bg-white rounded-full pointer-events-none z-[101] translate-x-[-50%] translate-y-[-50%]"></div>
//       <div ref={followerRef} className="cursor-follower fixed w-8 h-8 border border-white rounded-full pointer-events-none z-[101] translate-x-[-50%] translate-y-[-50%]"></div>
//     </>
//   );
// };

// const MagneticLink = ({ children, ...props }) => {
//   const ref = useRef(null);
//   useMagneticEffect(ref);
//   return React.cloneElement(children, { ref, ...props });
// };

// const Portfolio = () => {
//   const containerRef = useRef(null);

//   const handleHoverScroll = (id) => {
//     const section = document.getElementById(id);
//     if (section) {
//       section.scrollIntoView({ behavior: "smooth" });
//     }
//   };

//   useLayoutEffect(() => {
//     let ctx = gsap.context(() => {
//       document.body.style.overflow = "hidden";

//       // --- LOADER ANIMATION ---
//       const loaderTimeline = gsap.timeline({
//         onComplete: () => {
//           document.body.style.overflow = "auto";
//         }
//       });
//       loaderTimeline
//         .from(".loader-text-item", { y: 100, stagger: 0.2, duration: 1, ease: "power3.out" })
//         .to(".loader-text-item", { y: -100, stagger: 0.2, duration: 1, ease: "power3.in" }, "+=0.5")
//         .to(".loader", { yPercent: -100, duration: 1.2, ease: "power4.inOut" });

//       // --- NAVBAR ANIMATION ---
//       gsap.from(".nav-item", {
//         y: -50,
//         opacity: 0,
//         stagger: 0.1,
//         duration: 1,
//         ease: "power2.out",
//         delay: loaderTimeline.duration() - 0.5
//       });

//       // --- HERO TEXT ANIMATION (Word by word) ---
//       const heroTitle = ".hero-title";
//       const text = document.querySelector(heroTitle)?.textContent || "";
//       if (document.querySelector(heroTitle)) {
//         document.querySelector(heroTitle).innerHTML = text.split(" ").map(word => `<span><span class="inline-block">${word}</span></span>`).join(" ");
//         gsap.from(".hero-title span span", {
//           y: 100,
//           opacity: 0,
//           stagger: 0.1,
//           duration: 1,
//           ease: "power3.out",
//           delay: loaderTimeline.duration() - 0.8
//         });
//       }
//       gsap.from(".hero-subtitle", { x: -100, opacity: 0, duration: 1, delay: loaderTimeline.duration() - 0.5 });
//       gsap.from(".cta-button", { scale: 0, opacity: 0, delay: loaderTimeline.duration() - 0.2, duration: 0.5 });

//       // --- PROJECTS (3D Hover Effect) ---
//       gsap.utils.toArray(".project-card").forEach(card => {
//         gsap.from(card, {
//           scrollTrigger: { trigger: card, start: "top 80%", toggleActions: "play none none reverse" },
//           y: 50,
//           opacity: 0,
//           duration: 0.8,
//           ease: "power2.out"
//         });
//         card.addEventListener("mousemove", (e) => {
//           const { left, top, width, height } = card.getBoundingClientRect();
//           const x = ((e.clientX - left) / width) - 0.5;
//           const y = ((e.clientY - top) / height) - 0.5;
//           gsap.to(card, { rotateY: x * 20, rotateX: y * -20, scale: 1.05, duration: 0.5, ease: "power2.out" });
//         });
//         card.addEventListener("mouseleave", () => {
//           gsap.to(card, { rotateY: 0, rotateX: 0, scale: 1, duration: 1, ease: "elastic.out(1, 0.3)" });
//         });
//       });

//       // --- SKILLS PROGRESS BARS ---
//       gsap.utils.toArray(".skill-bar").forEach(bar => {
//         gsap.fromTo(bar, { width: "0%" }, {
//           width: bar.dataset.progress,
//           scrollTrigger: { trigger: bar, start: "top 85%", toggleActions: "play none none reverse" },
//           duration: 1,
//           ease: "power2.out"
//         });
//       });

//       // --- EXPERIENCE TIMELINE SVG DRAW ---
//       const timelineSVG = document.querySelector('.timeline-svg');
//       if (timelineSVG) {
//         gsap.fromTo(timelineSVG.querySelector('path'),
//           { strokeDasharray: 1000, strokeDashoffset: 1000 },
//           {
//             strokeDashoffset: 0,
//             scrollTrigger: {
//               trigger: ".timeline",
//               start: "top 50%",
//               end: "bottom 80%",
//               scrub: 1
//             }
//           }
//         );
//       }
//       gsap.utils.toArray(".timeline-item").forEach((item, i) => {
//         gsap.from(item, {
//           scrollTrigger: { trigger: item, start: "top 85%", toggleActions: "play none none reverse" },
//           x: i % 2 === 0 ? -100 : 100,
//           opacity: 0,
//           duration: 0.7,
//           ease: "power2.out",
//         });
//       });

//       // --- CONTACT FORM ---
//       const inputs = gsap.utils.toArray(".contact-input");
//       inputs.forEach(input => {
//         input.addEventListener("focus", () => gsap.to(input, { borderColor: "#6366f1", duration: 0.3 }));
//         input.addEventListener("blur", () => gsap.to(input, { borderColor: "#4b5563", duration: 0.3 }));
//       });
//     }, containerRef);
//     return () => {
//       ctx.revert();
//       document.body.style.overflow = "auto";
//     };
//   }, []);

//   return (
//     <div ref={containerRef} className="font-sans text-gray-200 bg-gray-900 min-h-screen selection:bg-indigo-500 selection:text-white md:cursor-none">
//       <CustomCursor />
//       {/* --- LOADER --- */}
//       <div className="loader fixed top-0 left-0 h-screen w-full bg-gray-900 z-[101] flex justify-center items-center">
//         <div className="text-4xl font-bold text-white overflow-hidden h-12">
//           <div className="flex flex-col items-center">
//             <div className="loader-text-item">Develop.</div>
//             <div className="loader-text-item">Design.</div>
//             <div className="loader-text-item">Create.</div>
//           </div>
//         </div>
//       </div>

//       <nav className="fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm z-50 flex justify-center space-x-4 md:space-x-10 py-4">
//         <MagneticLink><a href="#about" className="nav-item cursor-pointer hover:text-indigo-400 transition-colors p-2 text-sm md:text-base" onMouseEnter={() => handleHoverScroll("about")}>About</a></MagneticLink>
//         <MagneticLink><a href="#projects" className="nav-item cursor-pointer hover:text-indigo-400 transition-colors p-2 text-sm md:text-base" onMouseEnter={() => handleHoverScroll("projects")}>Projects</a></MagneticLink>
//         <MagneticLink><a href="#skills" className="nav-item cursor-pointer hover:text-indigo-400 transition-colors p-2 text-sm md:text-base" onMouseEnter={() => handleHoverScroll("skills")}>Skills</a></MagneticLink>
//         <MagneticLink><a href="#experience" className="nav-item cursor-pointer hover:text-indigo-400 transition-colors p-2 text-sm md:text-base" onMouseEnter={() => handleHoverScroll("experience")}>Experience</a></MagneticLink>
//         <MagneticLink><a href="#contact" className="nav-item cursor-pointer hover:text-indigo-400 transition-colors p-2 text-sm md:text-base" onMouseEnter={() => handleHoverScroll("contact")}>Contact</a></MagneticLink>
//       </nav>

//       {/* --- ABOUT SECTION with profile picture --- */}
//       <section id="about" className="max-w-5xl mx-auto px-8 py-24 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-12">
//         <img
//           src="/path/to/profile-pic.jpg" // Replace with actual image path or URL
//           alt="Profile Picture"
//           className="w-40 h-40 rounded-full object-cover shadow-lg"
//         />
//         <div>
//           <h2 className="text-4xl font-semibold mb-8">About Me</h2>
//           <p className="text-lg max-w-3xl leading-relaxed">Passionate web developer skilled in React, GSAP, and modern front-end technologies.</p>
//         </div>
//       </section>

//       {/* --- PROJECTS SECTION --- */}
//       <section id="projects" className="max-w-5xl mx-auto px-8 py-24 space-y-8" style={{ perspective: "1000px" }}>
//         <h2 className="text-4xl font-semibold mb-8">Projects</h2>
//         <div className="grid md:grid-cols-3 gap-8">
//           <div className="project-card bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer">
//             <h3 className="text-xl font-semibold mb-3">Project One</h3>
//             <p className="text-gray-400">React portfolio with advanced animations and smooth scrolling.</p>
//           </div>
//           <div className="project-card bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer">
//             <h3 className="text-xl font-semibold mb-3">Project Two</h3>
//             <p className="text-gray-400">Interactive dashboard using GSAP and React hooks.</p>
//           </div>
//           <div className="project-card bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer">
//             <h3 className="text-xl font-semibold mb-3">Project Three</h3>
//             <p className="text-gray-400">3D animated website created with Three.js and React.</p>
//           </div>
//         </div>
//       </section>

//       {/* --- SKILLS SECTION --- */}
//       <section id="skills" className="max-w-5xl mx-auto px-8 py-24">
//         <h2 className="text-4xl font-semibold mb-8">Skills</h2>
//         <div className="space-y-6">
//           <div>
//             <h4 className="mb-1">React</h4>
//             <div className="skill-bar-bg w-full h-4 rounded bg-gray-700">
//               <div className="skill-bar h-4 rounded bg-indigo-500" data-progress="90%"></div>
//             </div>
//           </div>
//           <div>
//             <h4 className="mb-1">GSAP Animations</h4>
//             <div className="skill-bar-bg w-full h-4 rounded bg-gray-700">
//               <div className="skill-bar h-4 rounded bg-indigo-500" data-progress="85%"></div>
//             </div>
//           </div>
//           <div>
//             <h4 className="mb-1">Tailwind CSS</h4>
//             <div className="skill-bar-bg w-full h-4 rounded bg-gray-700">
//               <div className="skill-bar h-4 rounded bg-indigo-500" data-progress="80%"></div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* --- EXPERIENCE SECTION --- */}
//       <section id="experience" className="max-w-5xl mx-auto px-8 py-24 relative">
//         <h2 className="text-4xl font-semibold mb-10 text-center">Work Experience</h2>
//         <div className="timeline w-full relative flex justify-center">
//           <svg className="timeline-svg absolute top-0 left-1/2 w-1 h-full -translate-x-1/2" preserveAspectRatio="none" viewBox="0 0 2 1000">
//             <path d="M 1 0 V 1000" stroke="white" strokeWidth="2" fill="none" />
//           </svg>
//           <div className="w-full relative space-y-16">
//             <div className="timeline-item w-11/12 md:w-5/12 p-6 rounded-lg bg-gray-800 shadow-lg">
//               <h3 className="text-2xl font-semibold mb-2">Frontend Developer</h3>
//               <span className="text-indigo-300">Company A - 2023 to Present</span>
//               <p className="text-gray-400 mt-2">Developed scalable React apps with smooth GSAP animations.</p>
//             </div>
//             <div className="timeline-item w-11/12 md:w-5/12 p-6 rounded-lg bg-gray-800 shadow-lg ml-auto">
//               <h3 className="text-2xl font-semibold mb-2">UI Engineer</h3>
//               <span className="text-indigo-300">Company B - 2021 to 2023</span>
//               <p className="text-gray-400 mt-2">Implemented reusable UI components and interactive animations.</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* --- CONTACT SECTION --- */}
//       <section id="contact" className="max-w-5xl mx-auto px-8 py-24">
//         <h2 className="text-4xl font-semibold mb-8">Contact Me</h2>
//         <form className="max-w-md space-y-5">
//           <input type="text" placeholder="Name" className="contact-input w-full p-3 rounded bg-gray-800 border border-gray-600 focus:outline-none transition-colors" />
//           <input type="email" placeholder="Email" className="contact-input w-full p-3 rounded bg-gray-800 border border-gray-600 focus:outline-none transition-colors" />
//           <textarea placeholder="Message" rows="4" className="contact-input w-full p-3 rounded bg-gray-800 border border-gray-600 focus:outline-none transition-colors"></textarea>
//           <MagneticLink><button type="submit" className="bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-full px-8 py-3 text-white font-semibold">Send</button></MagneticLink>
//         </form>
//       </section>
//     </div>
//   );
// };

// export default Portfolio;
