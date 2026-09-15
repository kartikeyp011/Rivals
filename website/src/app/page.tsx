import Hero from "@/components/sections/Hero";
import DailyLoop from "@/components/sections/DailyLoop";
import Rounds from "@/components/sections/Rounds";
import Friends from "@/components/sections/Friends";
import Streaks from "@/components/sections/Streaks";
import Download from "@/components/sections/Download";
import FAQ from "@/components/sections/FAQ";

export default function HomePage() {
  return (
    <>
      <Hero />
      <DailyLoop />
      <Rounds />
      <Friends />
      <Streaks />
      <Download />
      <FAQ />
    </>
  );
}
