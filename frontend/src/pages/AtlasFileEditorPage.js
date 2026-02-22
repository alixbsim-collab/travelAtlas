import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import RichTextEditor from '../components/editor/RichTextEditor';
import Button from '../components/ui/Button';
import { ArrowLeft, Plus, Trash2, Save, Eye, Image } from 'lucide-react';

function AtlasFileEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromItinerary = searchParams.get('fromItinerary');

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id || !!fromItinerary);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    trip_length: 1,
    cover_image_url: '',
  });
  const [intro, setIntro] = useState('');
  const [tips, setTips] = useState('');
  const [days, setDays] = useState([
    { dayNumber: 1, title: 'Day 1', content: '', images: [] }
  ]);

  useEffect(() => {
    if (id) {
      fetchAtlasFile();
    } else if (fromItinerary) {
      importFromItinerary();
    }
  }, [id, fromItinerary]);

  const fetchAtlasFile = async () => {
    try {
      const { data, error } = await supabase
        .from('atlas_files')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || '',
        description: data.description || '',
        destination: data.destination || '',
        trip_length: data.trip_length || 1,
        cover_image_url: data.cover_image_url || '',
      });

      if (data.content) {
        const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        setIntro(content.intro || '');
        setTips(content.tips || '');
        setDays(content.days || [{ dayNumber: 1, title: 'Day 1', content: '', images: [] }]);
      }
    } catch (error) {
      console.error('Error fetching atlas file:', error);
      alert('Failed to load atlas file');
      navigate('/atlas');
    } finally {
      setLoading(false);
    }
  };

  const importFromItinerary = async () => {
    try {
      const { data: itinerary, error: itErr } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', fromItinerary)
        .single();

      if (itErr) throw itErr;

      const { data: activities, error: actErr } = await supabase
        .from('activities')
        .select('*')
        .eq('itinerary_id', fromItinerary)
        .order('day_number', { ascending: true })
        .order('position', { ascending: true });

      if (actErr) throw actErr;

      setFormData({
        title: itinerary.title || '',
        description: `A ${itinerary.trip_length}-day trip to ${itinerary.destination}`,
        destination: itinerary.destination || '',
        trip_length: itinerary.trip_length || 1,
        cover_image_url: itinerary.thumbnail_url || '',
      });

      const dayGroups = {};
      (activities || []).forEach(act => {
        const d = act.day_number || 1;
        if (!dayGroups[d]) dayGroups[d] = [];
        dayGroups[d].push(act);
      });

      const importedDays = Array.from({ length: itinerary.trip_length }, (_, i) => {
        const dayNum = i + 1;
        const dayActs = dayGroups[dayNum] || [];
        const cityName = dayActs[0]?.city_name;
        const dayTitle = cityName ? `Day ${dayNum} — ${cityName}` : `Day ${dayNum}`;
        const content = dayActs.map(a => {
          let html = `<h3>${a.title}</h3>`;
          if (a.description) html += `<p>${a.description}</p>`;
          if (a.location) html += `<p><strong>Location:</strong> ${a.location}</p>`;
          if (a.duration_minutes) html += `<p><strong>Duration:</strong> ${Math.floor(a.duration_minutes / 60)}h ${a.duration_minutes % 60}m</p>`;
          return html;
        }).join('');

        return { dayNumber: dayNum, title: dayTitle, content, images: [] };
      });

      setDays(importedDays);
    } catch (error) {
      console.error('Error importing itinerary:', error);
      alert('Failed to import itinerary');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayChange = (index, field, value) => {
    setDays(prev => prev.map((day, i) => i === index ? { ...day, [field]: value } : day));
  };

  const addDay = () => {
    const newDayNum = days.length + 1;
    setDays(prev => [...prev, { dayNumber: newDayNum, title: `Day ${newDayNum}`, content: '', images: [] }]);
    setFormData(prev => ({ ...prev, trip_length: newDayNum }));
  };

  const removeDay = (index) => {
    if (days.length <= 1) return;
    const updated = days.filter((_, i) => i !== index).map((day, i) => ({ ...day, dayNumber: i + 1 }));
    setDays(updated);
    setFormData(prev => ({ ...prev, trip_length: updated.length }));
  };

  const addDayImage = (dayIndex) => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      setDays(prev => prev.map((day, i) =>
        i === dayIndex ? { ...day, images: [...day.images, url] } : day
      ));
    }
  };

  const removeDayImage = (dayIndex, imgIndex) => {
    setDays(prev => prev.map((day, i) =>
      i === dayIndex ? { ...day, images: day.images.filter((_, j) => j !== imgIndex) } : day
    ));
  };

  const handleSave = async (publish = false) => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to save');
        navigate('/login');
        return;
      }

      const content = { intro, days, tips };

      const atlasData = {
        title: formData.title,
        description: formData.description,
        destination: formData.destination,
        trip_length: formData.trip_length,
        cover_image_url: formData.cover_image_url || null,
        content,
        user_id: user.id,
        author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        published_at: publish ? new Date().toISOString() : null,
      };

      if (id) {
        const { error } = await supabase
          .from('atlas_files')
          .update(atlasData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('atlas_files')
          .insert(atlasData)
          .select()
          .single();
        if (error) throw error;
        navigate(`/atlas/edit/${data.id}`, { replace: true });
      }

      alert(publish ? 'Atlas File published!' : 'Draft saved!');
    } catch (error) {
      console.error('Error saving atlas file:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
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

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/designer')}
            className="flex items-center gap-2 text-neutral-warm-gray hover:text-neutral-charcoal transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving} className="gap-2">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button size="sm" onClick={() => handleSave(true)} disabled={saving} className="gap-2">
              <Eye size={16} />
              Publish
            </Button>
          </div>
        </div>

        <h1 className="text-3xl font-heading font-bold text-neutral-charcoal mb-8">
          {id ? 'Edit Atlas File' : 'Create Atlas File'}
        </h1>

        {/* Meta Fields */}
        <div className="space-y-6 mb-10">
          <div>
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g., 7 Days in Japan"
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="A short summary of your trip..."
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-charcoal mb-1">Destination</label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => handleFieldChange('destination', e.target.value)}
                placeholder="e.g., Tokyo, Japan"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-charcoal mb-1">Trip Length (days)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.trip_length}
                onChange={(e) => handleFieldChange('trip_length', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">Cover Image URL</label>
            <input
              type="url"
              value={formData.cover_image_url}
              onChange={(e) => handleFieldChange('cover_image_url', e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {formData.cover_image_url && (
              <img src={formData.cover_image_url} alt="Cover preview" className="mt-2 h-40 w-full object-cover rounded-lg border border-neutral-200" />
            )}
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-10">
          <h2 className="text-xl font-heading font-bold text-neutral-charcoal mb-3">Introduction</h2>
          <RichTextEditor
            content={intro}
            onChange={setIntro}
            placeholder="Write an introduction to your trip..."
          />
        </div>

        {/* Day-by-Day Sections */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold text-neutral-charcoal">Day-by-Day</h2>
            <Button variant="outline" size="sm" onClick={addDay} className="gap-2">
              <Plus size={16} />
              Add Day
            </Button>
          </div>

          <div className="space-y-8">
            {days.map((day, index) => (
              <div key={index} className="border border-neutral-200 rounded-xl p-6 bg-neutral-50">
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={day.title}
                    onChange={(e) => handleDayChange(index, 'title', e.target.value)}
                    className="text-lg font-heading font-bold bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-500 focus:outline-none px-1 py-0.5 flex-1"
                  />
                  {days.length > 1 && (
                    <button
                      onClick={() => removeDay(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                      title="Remove day"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <RichTextEditor
                  content={day.content}
                  onChange={(val) => handleDayChange(index, 'content', val)}
                  placeholder={`Write about Day ${day.dayNumber}...`}
                />

                {/* Day Images */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Image size={16} className="text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-600">Photos</span>
                    <button
                      type="button"
                      onClick={() => addDayImage(index)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add image URL
                    </button>
                  </div>
                  {day.images.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {day.images.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative flex-shrink-0 group">
                          <img src={img} alt="" className="h-24 w-36 object-cover rounded-lg border border-neutral-200" />
                          <button
                            onClick={() => removeDayImage(index, imgIdx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mb-10">
          <h2 className="text-xl font-heading font-bold text-neutral-charcoal mb-3">Travel Tips</h2>
          <RichTextEditor
            content={tips}
            onChange={setTips}
            placeholder="Share your tips, recommendations, and things to know..."
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-3 pb-12 border-t border-neutral-200 pt-6">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="gap-2">
            <Save size={16} />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
            <Eye size={16} />
            Publish
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

export default AtlasFileEditorPage;
