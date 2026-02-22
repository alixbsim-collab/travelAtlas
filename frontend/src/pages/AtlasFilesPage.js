import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PlusCircle, MapPin, Calendar, User } from 'lucide-react';

function AtlasFilesPage() {
  const [atlasFiles, setAtlasFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    const { data, error } = await supabase
      .from('atlas_files')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching atlas files:', error);
    } else {
      setAtlasFiles(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-heading font-bold text-neutral-charcoal mb-2">
              Atlas Files
            </h1>
            <p className="text-lg text-neutral-warm-gray">
              Browse curated travel itineraries from our community
            </p>
          </div>
          {user && (
            <Link to="/atlas/new">
              <Button className="gap-2">
                <PlusCircle size={18} />
                Create Atlas File
              </Button>
            </Link>
          )}
        </div>

        {atlasFiles.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-heading font-bold mb-3">
                No Atlas Files Yet
              </h2>
              <p className="text-neutral-warm-gray max-w-md mx-auto mb-6">
                Be the first to share your travel story with the community!
              </p>
              {user && (
                <Link to="/atlas/new">
                  <Button className="gap-2">
                    <PlusCircle size={18} />
                    Create Atlas File
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {atlasFiles.map((file) => (
              <Link key={file.id} to={`/atlas/${file.id}`}>
                <Card hover className="flex flex-col h-full">
                  {/* Thumbnail */}
                  <div className="h-44 rounded-t-lg mb-4 overflow-hidden">
                    {file.cover_image_url ? (
                      <img
                        src={file.cover_image_url}
                        alt={file.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary-400 to-primary-500 flex items-center justify-center">
                        <span className="text-6xl">📖</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-2">
                    <h3 className="text-xl font-heading font-bold mb-2 line-clamp-2">
                      {file.title}
                    </h3>
                    {file.description && (
                      <p className="text-sm text-neutral-warm-gray mb-3 line-clamp-2">
                        {file.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-neutral-warm-gray">
                      {file.author_name && (
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {file.author_name}
                        </span>
                      )}
                      {file.destination && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {file.destination}
                        </span>
                      )}
                      {file.trip_length && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {file.trip_length}d
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default AtlasFilesPage;
