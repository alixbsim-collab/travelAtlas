import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import ScrollReveal from '../components/ui/ScrollReveal';
import Button from '../components/ui/Button';
import { ArrowLeft, Calendar, MapPin, User, Edit } from 'lucide-react';

function AtlasFileViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [atlasFile, setAtlasFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const coverRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: coverRef,
    offset: ['start start', 'end start'],
  });
  const coverY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const coverOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400"></div>
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
    <div>
      {/* Full-viewport cover with parallax */}
      {atlasFile.cover_image_url ? (
        <div ref={coverRef} className="relative h-[60vh] md:h-[70vh] overflow-hidden">
          <motion.img
            src={atlasFile.cover_image_url}
            alt={atlasFile.title}
            className="w-full h-full object-cover"
            style={{ y: coverY, opacity: coverOpacity }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-500/70 via-charcoal-500/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="container mx-auto max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-heading font-bold text-white mb-4"
              >
                {atlasFile.title}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-4 text-sm text-white/80"
              >
                {atlasFile.author_name && (
                  <span className="flex items-center gap-1"><User size={16} />{atlasFile.author_name}</span>
                )}
                {atlasFile.destination && (
                  <span className="flex items-center gap-1"><MapPin size={16} />{atlasFile.destination}</span>
                )}
                {atlasFile.trip_length && (
                  <span className="flex items-center gap-1"><Calendar size={16} />{atlasFile.trip_length} days</span>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      ) : (
        /* No cover — fallback header */
        <div className="bg-charcoal-500 py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">{atlasFile.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-white/70">
              {atlasFile.author_name && <span className="flex items-center gap-1"><User size={16} />{atlasFile.author_name}</span>}
              {atlasFile.destination && <span className="flex items-center gap-1"><MapPin size={16} />{atlasFile.destination}</span>}
              {atlasFile.trip_length && <span className="flex items-center gap-1"><Calendar size={16} />{atlasFile.trip_length} days</span>}
            </div>
          </div>
        </div>
      )}

      <PageContainer>
        <div className="max-w-4xl mx-auto">
          {/* Back + Edit */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/atlas')}
              className="flex items-center gap-2 text-platinum-600 hover:text-charcoal-500 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Atlas Files
            </button>
            {isOwner && (
              <Link to={`/atlas/edit/${id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit size={16} /> Edit
                </Button>
              </Link>
            )}
          </div>

          {atlasFile.description && (
            <ScrollReveal>
              <p className="text-lg text-platinum-700 mb-8 leading-relaxed">
                {atlasFile.description}
              </p>
            </ScrollReveal>
          )}

          <hr className="border-platinum-200 mb-8" />

          {/* Introduction */}
          {content.intro && (
            <ScrollReveal>
              <div className="mb-10">
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: content.intro }}
                />
              </div>
            </ScrollReveal>
          )}

          {/* Day Sections */}
          {days.map((day, index) => (
            <ScrollReveal key={index} delay={index * 0.05}>
              <div className="mb-14">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center font-heading font-bold text-lg flex-shrink-0">
                    {index + 1}
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-charcoal-500 pb-2 border-b border-platinum-200 flex-1">
                    {day.title}
                  </h2>
                </div>

                {day.content && (
                  <div
                    className="prose prose-lg max-w-none mb-4 pl-16"
                    dangerouslySetInnerHTML={{ __html: day.content }}
                  />
                )}

                {day.images && day.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pl-16">
                    {day.images.map((img, imgIdx) => (
                      <motion.img
                        key={imgIdx}
                        src={img}
                        alt={`${day.title} photo ${imgIdx + 1}`}
                        className="w-full h-48 object-cover rounded-xl"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}

          {/* Tips */}
          {content.tips && (
            <ScrollReveal>
              <div className="mb-12 bg-naples-50 rounded-2xl p-6 border border-naples-200">
                <h2 className="text-2xl font-heading font-bold text-charcoal-500 mb-4">
                  Travel Tips
                </h2>
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: content.tips }}
                />
              </div>
            </ScrollReveal>
          )}
        </div>
      </PageContainer>
    </div>
  );
}

export default AtlasFileViewPage;
