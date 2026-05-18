import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SeoMeta from '@/components/SeoMeta';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/content/posts/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#b5852a]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-medium mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-8">The travel story you're looking for doesn't exist or was removed.</p>
        <Link to="/blog">
          <Button variant="outline">Back to Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <SeoMeta 
        title={`${post.title} | The Kashmir Curators`}
        description={post.excerpt}
        keywords={post.seoKeywords || 'kashmir travel, kashmir tourism'}
        image={post.imageUrl}
        schema={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "image": post.imageUrl,
          "author": {
            "@type": "Person",
            "name": post.author
          },
          "datePublished": post.createdAt,
          "dateModified": post.updatedAt,
          "description": post.excerpt
        }}
      />
      <Navbar />
      
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-32">
        <Link to="/blog" className="inline-flex items-center text-sm text-[#b5852a] hover:underline mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to all stories
        </Link>
        
        <article className="prose prose-slate dark:prose-invert max-w-none prose-img:rounded-xl">
          <h1 className="text-4xl md:text-5xl font-light text-slate-900 dark:text-white mb-6">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-10 pb-10 border-b">
            <span>By {post.author}</span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {post.imageUrl && (
            <div className="w-full aspect-video rounded-xl overflow-hidden mb-12 shadow-md">
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Render markdown/HTML content securely */}
          <div dangerouslySetInnerHTML={{ __html: post.content }} className="leading-relaxed text-lg text-slate-700 dark:text-slate-300" />
        </article>
      </main>

      <Footer />
    </div>
  );
}
