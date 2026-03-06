import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import About from "../components/About";
import Services from "../components/Services";
import Properties from "../components/Properties";
import WhyUs from "../components/WhyUs";
import Team from "../components/Team";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import WhatsAppWidget from "../components/WhatsAppWidget";
import Navbar from "../components/Navbar";
import BlogSection from "../components/BlogSection";

/* Inject Google Fonts once */
if (!document.head.querySelector("[data-tjc-fonts]")) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.setAttribute("data-tjc-fonts", "1");
  link.href =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@400;500;600;700;800&family=Archivo+Narrow:wght@400;500;600&display=swap";
  document.head.appendChild(link);
}

const LandingPage = () => {
  return (
    <div className="font-body bg-white overflow-x-hidden">

      <Hero />
      <Marquee />
      <About />
      <Services />
      <Properties />
      <WhyUs />
      <Team />
      <BlogSection />
      <Contact />


      <WhatsAppWidget />
    </div>
  );
};
export default LandingPage;
