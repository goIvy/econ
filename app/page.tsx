import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/features/home/hero";
import { collegeOptions, majorOptions } from "@/services/data";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero colleges={collegeOptions()} majors={majorOptions()} />
      </main>
      <Footer />
    </>
  );
}
