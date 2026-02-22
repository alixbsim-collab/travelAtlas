import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { ArrowLeft, Calendar, MapPin, User, Edit } from 'lucide-react';

function AtlasFileViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [atlasFile, setAtlasFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchAtlasFile();
  }, [id]);

  const fetchAtlasFile = async () => {
    try {
      const { data, error } = await supabase
        .from('atlas_files')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAtlasFile(data);

      const { data: { user } } = await supabase.auth.getUser();
      if (user && data.user_id === user.id) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error('Error fetching atlas file:', error);
      navigate('/atlas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </PageContainer>
    );
  }

  if (!atlasFile) return null;

  const content = typeof atlasFile.content === 'string'
    ? JSON.parse(atlasFile.content)
    : atlasFile.content || {};

  const days = content.days || [];

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Back + Edit */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/atlas')}
            className="flex items-center gap-2 text-neutral-warm-gray hover:text-neutral-charcoal transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Atlas Files
          </button>
          {isOwner && (
            <Link to={`/atlas/edit/${id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit size={16} />
                Edit
              </Button>
            </Link>
          )}
        </div>

        {/* Cover Image */}
        {atlasFile.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 h-64 md:h-80">
            <img
              src={atlasFile.cover_image_url}
              alt={atlasFile.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title & Meta */}
        <h1 className="text-4xl font-heading font-bold text-neutral-charcoal mb-4">
          {atlasFile.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-neutral-warm-gray mb-6">
          {atlasFile.author_name && (
            <span className="flex items-center gap-1">
              <User size={16} />
              {atlasFile.author_name}
            </span>
          )}
          {atlasFile.destination && (
            <span className="flex items-center gap-1">
              <MapPin size={16} />
              {atlasFile.destination}
            </span>
          )}
          {atlasFile.trip_length && (
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              {atlasFile.trip_length} days
            </span>
          )}
        </div>

        {atlasFile.description && (
          <p className="text-lg text-neutral-warm-gray mb-8 leading-relaxed">
            {atlasFile.description}
          </p>
        )}

        <hr className="border-neutral-200 mb-8" />

        {/* Introduction */}
        {content.intro && (
          <div className="mb-10">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content.intro }}
            />
          </div>
        )}

        {/* Day Sections */}
        {days.map((day, index) => (
          <div key={index} className="mb-12">
            <h2 className="text-2xl font-heading font-bold text-neutral-charcoal mb-4 pb-2 border-b border-neutral-200">
              {day.title}
            </h2>

            {day.content && (
              <div
                className="prose prose-lg max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: day.content }}
              />
            )}

            {day.images && day.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {day.images.map((img, imgIdx) => (
                  <img
                    key={imgIdx}
                    src={img}
                    alt={`${day.title} photo ${imgIdx + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Tips */}
        {content.tips && (
          <div className="mb-12 bg-primary-50 rounded-xl p-6">
            <h2 className="text-2xl font-heading font-bold text-neutral-charcoal mb-4">
              Travel Tips
            </h2>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content.tips }}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default AtlasFileViewPage;
