import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { findPost, POSTS } from '@/lib/blog-content'

type Params = Promise<{ slug: string }>
export function generateStaticParams() { return POSTS.map((post) => ({ slug: post.slug })) }
export default async function BlogPostPage({ params }: { params: Params }) { const { slug } = await params; const post = findPost(slug); if (!post) notFound(); return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10"><Link href="/blog" className="flex items-center gap-1.5 text-sm font-bold text-brand"><ArrowLeft size={15} /> All guides</Link><p className="mt-8 text-xs font-bold uppercase tracking-wider text-muted">{new Date(post.date).toLocaleDateString('en-IN')} · {post.read}</p><h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-ink">{post.title}</h1><p className="mt-4 text-lg leading-8 text-body">{post.excerpt}</p><div className="mt-9 space-y-8">{post.sections.map(([heading, body]) => <section key={heading}><h2 className="font-display text-2xl font-bold text-ink">{heading}</h2><p className="mt-3 text-base leading-8 text-body">{body}</p></section>)}</div><div className="mt-10 rounded-2xl bg-sage p-5 text-sm leading-6 text-brand-dark">Crop conditions alag ho sakti hain. Product label aur local agronomist/KVK advice ko priority dein.</div></main> }
