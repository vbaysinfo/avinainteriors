import { ArrowRight, Home } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80svh] items-center justify-center overflow-hidden bg-ink py-24 text-center">
      <div className="absolute inset-0 opacity-50">
        <PlaceholderImage tone="ink" label="" showLabel={false} icon="Compass" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/60" />
      <div className="container-px relative mx-auto max-w-xl">
        <p className="font-display text-7xl text-gold-light">404</p>
        <h1 className="mt-4 font-display text-3xl text-cream sm:text-4xl">
          This room hasn&apos;t been designed yet
        </h1>
        <p className="mt-4 text-cream/70">
          The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get
          you back to somewhere beautiful.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/" icon={<ArrowRight className="h-4 w-4" />}>
            <Home className="h-4 w-4" /> Back to Home
          </Button>
        </div>
      </div>
    </section>
  );
}
