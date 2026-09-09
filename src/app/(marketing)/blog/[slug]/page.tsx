import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { PageHero } from "@/components/shared/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";
import { blogPosts, getPostBySlug } from "@/data/blog";
import { siteConfig, whatsappLink } from "@/data/site";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const more = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Blog", url: `${siteConfig.url}/blog` },
          { name: post.title, url: `${siteConfig.url}/blog/${post.slug}` },
        ]}
      />
      <PageHero
        eyebrow={post.category}
        title={post.title}
        description={post.excerpt}
        crumb={post.title}
        icon="Newspaper"
        tone={post.tone}
      />

      <article className="bg-cream py-16 sm:py-20">
        <div className="container-px mx-auto max-w-3xl">
          <div className="flex items-center gap-5 text-sm text-ink-soft/50">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {post.readTime}
            </span>
          </div>

          <div className="mt-6 h-72 overflow-hidden rounded-2xl sm:h-96">
            <PlaceholderImage tone={post.tone} label={post.category} icon="Newspaper" />
          </div>

          <div className="prose-content mt-10 space-y-5">
            {post.content.map((paragraph, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <p className="text-base leading-relaxed text-ink-soft/85">
                  {paragraph}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-12 rounded-2xl border border-ink/10 bg-sand/50 p-8 text-center">
              <h3 className="font-display text-xl text-ink">
                Have a project in mind?
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft/70">
                Get a free, no-obligation consultation with our design team.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button
                  href="/contact"
                  icon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                >
                  Get Free Consultation
                </Button>
                <Button
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  icon={<FaWhatsapp className="h-4 w-4" />}
                >
                  WhatsApp Us
                </Button>
              </div>
            </div>
          </Reveal>

          {more.length > 0 && (
            <div className="mt-14">
              <h3 className="font-display text-xl text-ink">More articles</h3>
              <ul className="mt-4 space-y-3">
                {more.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="text-sm font-medium text-gold-deep hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
