import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Clock,
  Calendar,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BlogCard } from "@/components/blog/BlogCard";
import { BLOG_ARTICLES } from "@/data/blogData";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return {
      title: "Article Not Found | Avatar Learning",
    };
  }

  return {
    title: `${article.metaTitle || article.title} | Avatar Learning`,
    description: article.metaDescription || article.hoverDescription,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.hoverDescription,
      images: [{ url: article.image }],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  // Related articles (the other 3 blogs)
  const otherArticles = BLOG_ARTICLES.filter((a) => a.slug !== slug);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* ── Standard Site Navbar ── */}
      <Navbar />

      <main className="flex-1 w-full pt-24 md:pt-28 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs & Back Link */}
          <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs md:text-sm font-bold tracking-wider text-slate-600 hover:text-brand-600 uppercase transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Stories</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Link href="/" className="hover:text-slate-600">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/blog" className="hover:text-slate-600">
                Blog
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-700 truncate max-w-[200px]">
                {article.tag}
              </span>
            </div>
          </div>

          {/* Article Header */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-50 text-brand-600 border border-brand-200">
                {article.hoverTag || article.tag}
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {article.date}
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              {article.title}
            </h1>

            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
              {article.hoverDescription}
            </p>
          </div>

          {/* Author Byline */}
          <div className="flex items-center gap-4 py-5 mb-8 border-y border-slate-200">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-300 shrink-0">
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {article.author.name}
              </p>
              <p className="text-xs text-slate-500">
                {article.author.role || "Career & Learning Insights Team"}
              </p>
            </div>
          </div>

          {/* Featured Hero Image (Curved diagonal corners matching signature aesthetic) */}
          <div className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] rounded-tl-[44px] md:rounded-tl-[54px] rounded-br-[44px] md:rounded-br-[54px] rounded-tr-md rounded-bl-md overflow-hidden border border-[#D3DCE6] shadow-md mb-10">
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* ── Article Prose (Rendered with ReactMarkdown to support all verbatim PDF hyperlinks & typography) ── */}
          <div className="text-slate-800 text-base md:text-lg leading-relaxed">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => {
                  const isInternal =
                    href && (href.startsWith("/") || href.startsWith("#"));
                  if (isInternal) {
                    return (
                      <Link
                        href={href}
                        className="font-semibold text-brand-600 underline decoration-brand-300 hover:text-brand-700 hover:decoration-brand-500 transition-colors"
                      >
                        {children}
                      </Link>
                    );
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-600 underline decoration-brand-300 hover:text-brand-700 hover:decoration-brand-500 transition-colors"
                    >
                      {children}
                    </a>
                  );
                },
                h2: ({ children }) => (
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight pt-10 pb-3 border-b border-slate-200 mb-6">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight pt-8 pb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-base md:text-lg text-slate-700 leading-relaxed my-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="my-5 space-y-2.5 pl-6 list-disc text-slate-700 text-base md:text-lg marker:text-brand-500">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-5 space-y-2.5 pl-6 list-decimal text-slate-700 text-base md:text-lg marker:font-bold marker:text-brand-600">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed pl-1">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-8 p-6 rounded-2xl bg-brand-50/70 border-l-4 border-brand-500 text-brand-950 font-semibold italic text-lg leading-relaxed shadow-xs">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-8 border-slate-200" />,
                strong: ({ children }) => (
                  <strong className="font-extrabold text-slate-900">
                    {children}
                  </strong>
                ),
              }}
            >
              {article.bodyMarkdown}
            </ReactMarkdown>
          </div>

          {/* ── Slick Recommended Next Steps Cards (Matches Blog Card Template, No AI slop / icons) ── */}
          {article.nextSteps && article.nextSteps.length > 0 && (
            <div className="mt-16 pt-10 border-t border-slate-200">
              <div className="mb-6">
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase block mb-1">
                  SUGGESTED INTERNAL PATHWAYS
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Recommended Next Steps
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {article.nextSteps.map((card, cIdx) => (
                  <Link
                    key={cIdx}
                    href={card.href}
                    className="group block p-6 rounded-2xl md:rounded-3xl border border-[#D3DCE6] bg-white hover:border-brand-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Pill Tag & Status */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 group-hover:bg-brand-50 group-hover:text-brand-600 border border-slate-200 transition-colors">
                          {card.tag}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 tracking-widest uppercase">
                          0{cIdx + 1}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-lg md:text-xl font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                        {card.title}
                      </h4>

                      {/* Description */}
                      <p className="text-xs md:text-sm text-slate-600 mt-2.5 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Bottom Bar: Action label + circular arrow button */}
                    <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-slate-900 transition-colors">
                        {card.actionLabel}
                      </span>
                      <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 group-hover:bg-brand-500 group-hover:border-brand-500 group-hover:text-white transition-all">
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Back Button & Brand Note */}
          <div className="mt-14 pt-6 border-t border-slate-200 flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 text-xs font-bold tracking-wider text-slate-800 uppercase hover:bg-slate-100 hover:border-slate-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all stories</span>
            </Link>

            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase hidden sm:inline-block">
              AVATAR INDIA EDITORIAL
            </span>
          </div>
        </article>

        {/* ── More Stories Section ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-12 border-t border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase block mb-1">
                EXPLORE MORE
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Other Editorial Perspectives
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-xs font-bold tracking-wider text-brand-600 hover:text-brand-700 uppercase"
            >
              View All ({BLOG_ARTICLES.length})
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherArticles.slice(0, 3).map((other, idx) => (
              <div key={other.id} className="h-[480px]">
                <BlogCard
                  article={other}
                  index={idx}
                  edgeType={idx % 2 === 0 ? "diagonal-left" : "diagonal-right"}
                  isBig={false}
                  forceImage={false}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Standard Site Footer ── */}
      <Footer />
    </div>
  );
}
