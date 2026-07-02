import { Heart, MessageCircle, Play } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/data/site";

// NOTE: This grid renders curated placeholder tiles so the layout looks
// production-ready without a live token. To pull your *real* latest posts:
//   1. Create a Meta developer app + Instagram Business/Creator account, or
//   2. Use a no-code embed such as SnapWidget / Elfsight / Behold.so and
//      swap the grid below for their embed snippet / API response.
// See README.md > "Connecting live social feeds" for step-by-step setup.
const posts = [
  { tone: "gold", icon: "Image", likes: "1.2k", comments: 34, reel: false },
  { tone: "forest", icon: "Sofa", likes: "890", comments: 21, reel: true },
  { tone: "terracotta", icon: "ChefHat", likes: "2.4k", comments: 58, reel: false },
  { tone: "ink", icon: "BedDouble", likes: "1.5k", comments: 40, reel: true },
  { tone: "sand", icon: "Lightbulb", likes: "760", comments: 12, reel: false },
  { tone: "gold", icon: "Building2", likes: "980", comments: 27, reel: false },
] as const;

export function InstagramFeed() {
  return (
    <section className="bg-cream py-20 sm:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Follow Along"
          title="Fresh from our Instagram"
          description="Real project reels, before/afters and design tips — updated weekly."
        />

        <Reveal delay={0.15}>
          <div className="mt-6 flex justify-center">
            <Button
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              icon={<FaInstagram className="h-4 w-4" />}
            >
              @avinainteriors
            </Button>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {posts.map((post, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-xl"
              >
                <PlaceholderImage
                  tone={post.tone}
                  icon={post.icon}
                  label=""
                  showLabel={false}
                  className="transition-transform duration-500 group-hover:scale-110"
                />
                {post.reel && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                    <Play className="h-3 w-3 fill-current" />
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="flex items-center gap-1 text-sm font-semibold text-white">
                    <Heart className="h-4 w-4 fill-current" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-white">
                    <MessageCircle className="h-4 w-4 fill-current" />{" "}
                    {post.comments}
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
