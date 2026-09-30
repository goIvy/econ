import type { Metadata } from "next";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { ShelfExperience, type ShelfCollege } from "@/features/shelf/shelf-experience";
import { getCollege } from "@/services/data";

export const metadata: Metadata = {
  title: "The Elite Shelf",
  description: "Seven elite universities as tactile volumes. Pull one from the shelf, open it, and see what that college path really costs.",
};

// Must match the order of the volumes in scripts/build-college-shelf.mjs.
const SHELF = ["yale", "princeton", "uchicago", "columbia", "harvard", "stanford", "mit"];

export default function ShelfPage() {
  const colleges: ShelfCollege[] = SHELF.flatMap((id) => {
    const c = getCollege(id);
    if (!c) return [];
    return [
      {
        id: c.id,
        name: c.name,
        shortName: c.shortName,
        place: `${c.city}, ${c.state}`,
        majorId: c.majorIds.includes("economics") ? "economics" : c.majorIds[0],
        earnings: c.medianEarnings.value,
        debt: c.medianDebt.value,
        gradRate: c.gradRate6.value,
        acceptance: c.acceptanceRate.value,
      },
    ];
  });
  return (
    <>
      <Nav />
      <main id="main">
        <ShelfExperience colleges={colleges} />
      </main>
      <Footer />
    </>
  );
}
