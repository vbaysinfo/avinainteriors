import { Play } from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/data/site";

// NOTE: Swap these tiles for real <iframe> YouTube embeds once you have
// project walkthrough videos uploaded — e.g.
// <iframe src={`https://www.youtube.com/embed/${videoId}`} ... />
const videos = [
  { tone: "gold", title: "Rushikonda Sea View Apartment — Full Walkthrough" },
  { tone: "forest", title: "MVP Colony Villa — Before & After" },
  { tone: "terracotta", title: "21-Day Modular Kitchen Transformation" },
] as const;

export function VideoShowcase() {
  return (
    <section className="bg-ink py-20 text-cream sm:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Watch"
          title="Project walkthroughs & design reels"
          description="Step inside our completed projects on YouTube and Instagram Reels."
          light
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {videos.map((video, i) => (
            <Reveal key={video.title} delay={i * 0.1}>
              <a
                href={siteConfig.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-video overflow-hidden rounded-2xl"
              >
                <PlaceholderImage
                  tone={video.tone}
                  icon="Video"
                  label=""
                  showLabel={false}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/45">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </span>
                </div>
                <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-medium text-cream">
                  {video.title}
                </p>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div className="mt-10 flex justify-center">
            <Button
              href={siteConfig.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              variant="ghost"
              icon={<FaYoutube className="h-4 w-4" />}
            >
              Subscribe on YouTube
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
