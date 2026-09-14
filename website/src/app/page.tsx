import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Gameplay from "@/components/sections/Gameplay";
import Competition from "@/components/sections/Competition";
import Streaks from "@/components/sections/Streaks";
import Download from "@/components/sections/Download";
import FAQ from "@/components/sections/FAQ";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Gameplay />
      <Competition />
      <Streaks />
      <Download />
      <FAQ />
    </>
  );
}
