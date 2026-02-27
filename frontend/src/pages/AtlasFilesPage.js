import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ScrollReveal from '../components/ui/ScrollReveal';
import { PlusCircle, MapPin, Calendar, User, Edit, Trash2, Copy, MoreVertical, Globe, Lock } from 'lucide-react';

function AtlasFileCard({ file, isOwner, onDelete, onDuplicate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative group">
      <Link to={`/atlas/${file.id}`}>
        <Card hover className="flex flex-col h-full p-0 overflow-hidden">
          <div className="h-44 overflow-hidden">
            {file.cover_image_url ? (
              <motion.img
                src={file.cover_image_url}
                alt={file.title}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-columbia-300 to-coral-400 flex items-center justify-center">
                <span className="text-6xl">📖</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-5">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-heading font-bold line-clamp-2 text-charcoal-500 flex-1">
                {file.title}
              </h3>
              {isOwner && (
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  file.published_at
                    ? 'bg-coral-100 text-coral-700'
                    : 'bg-platinum-100 text-platinum-600'
                }`}>
                  {file.published_at ? <Globe size={10} /> : <Lock size={10} />}
                  {file.published_at ? 'Public' : 'Draft'}
                </span>
              )}
            </div>
            {file.description && (
              <p className="text-sm text-platinum-600 mb-3 line-clamp-2">
                {file.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-platinum-600">
              {file.author && (
                <span className="flex items-center gap-1"><User size={14} />{file.author}</span>
              )}
              {file.destination && (
                <span className="flex items-center gap-1"><MapPin size={14} />{file.destination}</span>
              )}
              {file.trip_length && (
                <span className="flex items-center gap-1"><Calendar size={14} />{file.trip_length}d</span>
              )}
            </div>
          </div>
        </Card>
      </Link>

      {/* Owner actions menu */}
      {isOwner && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-charcoal-400 hover:text-charcoal-500 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-20 bg-white rounded-xl shadow-lg border border-platinum-200 py-1 w-40">
                <Link
                  to={`/atlas/edit/${file.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Edit size={14} /> Edit
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    onDuplicate(file);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full"
                >
                  <Copy size={14} /> Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    onDelete(file);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AtlasFilesPage() {
  const [myFiles, setMyFiles] = useState([]);
  const [exploreFiles, setExploreFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    if (currentUser) {
      const [myRes, exploreRes] = await Promise.all([
        supabase
          .from('atlas_files')
          .select('*')
          .eq('author_id', currentUser.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('atlas_files')
          .select('*')
          .not('published_at', 'is', null)
          .neq('author_id', currentUser.id)
          .order('published_at', { ascending: false }),
      ]);

      setMyFiles(myRes.data || []);
      setExploreFiles(exploreRes.data || []);
    } else {
      const { data } = await supabase
        .from('atlas_files')
        .select('*')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });
      setExploreFiles(data || []);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await supabase
      .from('atlas_files')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      console.error('Error deleting atlas file:', error);
      alert('Failed to delete');
    } else {
      setMyFiles(prev => prev.filter(f => f.id !== deleteTarget.id));
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleDuplicate = async (file) => {
    const { data: newFile, error } = await supabase
      .from('atlas_files')
      .insert({
        title: `Copy of ${file.title}`,
        description: file.description,
        destination: file.destination,
        trip_length: file.trip_length,
        cover_image_url: file.cover_image_url,
        content: file.content,
        author_id: user.id,
        author: file.author,
        published_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error duplicating atlas file:', error);
      alert('Failed to duplicate');
    } else {
      setMyFiles(prev => [newFile, ...prev]);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400 mx-auto"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-heading font-bold text-charcoal-500 mb-2">
                Atlas Files
              </h1>
              <p className="text-lg text-platinum-600">
                Travel stories and itineraries from our community
              </p>
            </div>
            {user && (
              <Link to="/atlas/new">
                <Button className="gap-2">
                  <PlusCircle size={18} />
                  Write a Travel Story
                </Button>
              </Link>
            )}
          </div>
        </ScrollReveal>

        {/* My Travel Stories (logged in only) */}
        {user && (
          <section className="mb-12">
            <ScrollReveal>
              <h2 className="text-2xl font-heading font-bold text-charcoal-500 mb-6">
                My Travel Stories
              </h2>
            </ScrollReveal>

            {myFiles.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📝</div>
                  <h3 className="text-xl font-heading font-bold mb-2 text-charcoal-500">
                    No stories yet
                  </h3>
                  <p className="text-platinum-600 max-w-md mx-auto mb-6">
                    Share your travel experiences with the community
                  </p>
                  <Link to="/atlas/new">
                    <Button className="gap-2">
                      <PlusCircle size={18} />
                      Write a Travel Story
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myFiles.map((file, index) => (
                  <ScrollReveal key={file.id} delay={index * 0.06}>
                    <AtlasFileCard
                      file={file}
                      isOwner
                      onDelete={setDeleteTarget}
                      onDuplicate={handleDuplicate}
                    />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Explore */}
        <section>
          <ScrollReveal>
            <h2 className="text-2xl font-heading font-bold text-charcoal-500 mb-6">
              Explore
            </h2>
          </ScrollReveal>

          {exploreFiles.length === 0 ? (
            <Card>
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-2xl font-heading font-bold mb-3 text-charcoal-500">
                  No Stories to Explore Yet
                </h2>
                <p className="text-platinum-600 max-w-md mx-auto mb-6">
                  Be the first to share your travel story with the community!
                </p>
                {user && (
                  <Link to="/atlas/new">
                    <Button className="gap-2">
                      <PlusCircle size={18} />
                      Write a Travel Story
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exploreFiles.map((file, index) => (
                <ScrollReveal key={file.id} delay={index * 0.06}>
                  <AtlasFileCard
                    file={file}
                    isOwner={false}
                    onDelete={() => {}}
                    onDuplicate={() => {}}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Atlas File"
        size="sm"
      >
        <p className="text-charcoal-400 mb-6">
          Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}

export default AtlasFilesPage;
