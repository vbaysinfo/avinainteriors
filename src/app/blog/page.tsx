import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Calendar, Clock } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Reveal } from "@/components/ui/Reveal";
import { blogPosts } from "@/data/blog";

export const metadata: Metadata = {
  title: "Interior Design Blog — Tips & Guides for Vizag Homes",
  description:
    "Practical interior design guides, cost breakdowns and trends for homeowners in Visakhapatnam, from the Avina Interiors design team.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Design tips, cost guides & trends"
        description="Practical advice from our design team to help you plan your next project with confidence."
        crumb="Blog"
        icon="Newspaper"
        tone="sand"
      />

      <section className="bg-cream py-20 sm:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading eyebrow="Latest Articles" title="From the design desk" />

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 3) * 0.08}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-52 overflow-hidden">
                    <PlaceholderImage tone={post.tone} label={post.category} icon="Newspaper" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-4 text-xs text-ink-soft/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {post.readTime}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-lg text-ink">
                      {post.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft/70">
                      {post.excerpt}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gold-deep">
                      Read Article
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
