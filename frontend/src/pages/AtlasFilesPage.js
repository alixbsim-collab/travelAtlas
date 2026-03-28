import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { listMyAtlasFiles, listPublishedAtlasFiles, deleteAtlasFile, forkAtlasFile } from '../api/atlas';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ScrollReveal from '../components/ui/ScrollReveal';
import { PlusCircle, Calendar, User, Edit, Trash2, GitFork, Copy, MoreVertical, Globe, Lock, Award } from 'lucide-react';
import { getSourceConfig } from '../constants/sourceTypeConfig';

function AtlasFileCard({ file, isOwner, onDelete, onDuplicate, onFork }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sourceConfig = getSourceConfig(file.source_type);
  const SourceIcon = sourceConfig.icon;

  return (
    <div className="relative group">
      <Link to={`/atlas/${file.id}`}>
        <Card hover className={`flex flex-col h-full p-0 overflow-hidden ${sourceConfig.cardAccent}`}>
          <div className="h-48 overflow-hidden">
            {file.cover_image_url ? (
              <motion.img
                src={file.cover_image_url}
                alt={file.title}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-columbia-200 to-coral-300 flex items-center justify-center">
                <span className="text-5xl">📖</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sourceConfig.badge.bg} ${sourceConfig.badge.text}`}>
                <SourceIcon size={10} />
                {sourceConfig.label}
              </span>
              {isOwner && (
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  file.published_at
                    ? 'bg-coral-100 text-coral-700'
                    : 'bg-platinum-100 text-platinum-600'
                }`}>
                  {file.published_at ? <Globe size={10} /> : <Lock size={10} />}
                  {file.published_at ? 'Public' : 'Draft'}
                </span>
              )}
            </div>
            {file.destination && (
              <p className="text-xs font-semibold uppercase tracking-wide text-platinum-500 mb-1">
                {file.destination}
              </p>
            )}
            <h3 className="text-xl font-semibold line-clamp-2 text-charcoal-500 mb-2">
              {file.title}
            </h3>
            {file.description && (
              <p className="text-sm text-platinum-600 mb-3 line-clamp-2">
                {file.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-platinum-600">
              {file.author && (
                <span className="flex items-center gap-1"><User size={14} />{file.author}</span>
              )}
              {file.trip_length && (
                <span className="flex items-center gap-1"><Calendar size={14} />{file.trip_length}d</span>
              )}
            </div>
          </div>
        </Card>
      </Link>

      {/* Actions menu */}
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
            <div className="absolute right-0 top-10 z-20 bg-white rounded-2xl shadow-elevated border border-platinum-100 py-1.5 w-44">
              {isOwner && (
                <Link
                  to={`/atlas/edit/${file.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Edit size={14} /> Edit
                </Link>
              )}
              {isOwner && (
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
              )}
              {!isOwner && onFork && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    onFork(file);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full"
                >
                  <GitFork size={14} /> Fork to My Trips
                </button>
              )}
              {isOwner && (
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
              )}
            </div>
          </>
        )}
      </div>
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    try {
      if (currentUser) {
        const [myData, publishedData] = await Promise.all([
          listMyAtlasFiles(),
          listPublishedAtlasFiles(),
        ]);

        setMyFiles(myData || []);

        // Explore: exclude stories already in "my files"
        const myIds = new Set((myData || []).map(f => f.id));
        setExploreFiles((publishedData || []).filter(f => !myIds.has(f.id)));
      } else {
        const publishedData = await listPublishedAtlasFiles();
        setExploreFiles(publishedData || []);
      }
    } catch (error) {
      console.error('Error fetching atlas files:', error);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await deleteAtlasFile(deleteTarget.id);
      setMyFiles(prev => prev.filter(f => f.id !== deleteTarget.id));
      setExploreFiles(prev => prev.filter(f => f.id !== deleteTarget.id));
    } catch (error) {
      console.error('Error deleting atlas file:', error);
      alert('Failed to delete');
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleFork = async (file) => {
    try {
      const result = await forkAtlasFile(file.id);
      navigate(`/itinerary/${result.itinerary_id}`);
    } catch (error) {
      console.error('Error forking atlas file:', error);
      alert('Failed to fork — make sure the file has a published version.');
    }
  };

  const handleDuplicate = async (file) => {
    // For owner's own files, use Supabase direct insert (legacy compat)
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
        source_type: 'traveler',
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
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl text-charcoal-500 mb-2">
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
          <section className="mb-14">
            <ScrollReveal>
              <h2 className="text-2xl text-charcoal-500 mb-8">
                My Travel Stories
              </h2>
            </ScrollReveal>

            {myFiles.length === 0 ? (
              <Card>
                <div className="text-center py-14">
                  <div className="text-5xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold mb-2 text-charcoal-500">
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
            <h2 className="text-2xl text-charcoal-500 mb-8">
              Explore
            </h2>
          </ScrollReveal>

          {exploreFiles.length === 0 ? (
            <Card>
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📚</div>
                <h2 className="text-2xl font-semibold mb-3 text-charcoal-500">
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
            <>
              {/* Curated by Travel Atlas */}
              {exploreFiles.some(f => f.source_type === 'curated') && (
                <div className="mb-10">
                  <ScrollReveal>
                    <h3 className="text-lg font-semibold text-charcoal-400 mb-5 flex items-center gap-2">
                      <Award size={18} className="text-columbia-500" />
                      Curated by Travel Atlas
                    </h3>
                  </ScrollReveal>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exploreFiles.filter(f => f.source_type === 'curated').map((file, index) => (
                      <ScrollReveal key={file.id} delay={index * 0.06}>
                        <AtlasFileCard
                          file={file}
                          isOwner={false}
                          onDelete={() => {}}
                          onDuplicate={() => {}}
                          onFork={user ? handleFork : null}
                        />
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              )}

              {/* From the Community */}
              {exploreFiles.some(f => f.source_type !== 'curated') && (
                <div>
                  <ScrollReveal>
                    <h3 className="text-lg font-semibold text-charcoal-400 mb-5 flex items-center gap-2">
                      <Globe size={18} className="text-naples-500" />
                      From the Community
                    </h3>
                  </ScrollReveal>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exploreFiles.filter(f => f.source_type !== 'curated').map((file, index) => (
                      <ScrollReveal key={file.id} delay={index * 0.06}>
                        <AtlasFileCard
                          file={file}
                          isOwner={false}
                          onDelete={() => {}}
                          onDuplicate={() => {}}
                          onFork={user ? handleFork : null}
                        />
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              )}
            </>
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
