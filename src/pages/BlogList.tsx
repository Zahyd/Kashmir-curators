import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SeoMeta from '@/components/SeoMeta';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function BlogList() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/content/posts`)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <SeoMeta 
        title="Kashmir Travel Blog | The Kashmir Curators"
        description="Read expert travel guides, tips, and inspiration for your luxury Kashmir holiday."
      />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-light text-[#b5852a] mb-6">Curated Travel Stories</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
            Discover the hidden gems, cultural insights, and expert itineraries for your perfect Kashmir vacation.
          </p>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#b5852a]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-lg">
              <p className="text-muted-foreground">Stories are being curated. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {posts.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="block group">
                  <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="aspect-video bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      {post.imageUrl && (
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <CardContent className="p-6">
                      <p className="text-xs text-[#b5852a] font-medium mb-2">
                        {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <h2 className="text-xl font-medium mb-3 group-hover:text-[#b5852a] transition-colors">{post.title}</h2>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-3 text-sm">
                        {post.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
