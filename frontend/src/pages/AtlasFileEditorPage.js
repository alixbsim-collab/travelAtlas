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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400"></div>
        </div>
      </PageContainer>
    );
  }

  const DAY_ACCENTS = ['bg-coral-100 border-coral-300', 'bg-columbia-100 border-columbia-300', 'bg-naples-100 border-naples-300', 'bg-platinum-100 border-platinum-300'];
  const DAY_NUMBERS = ['bg-coral-400', 'bg-columbia-600', 'bg-naples-500', 'bg-charcoal-500'];

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/designer')}
            className="flex items-center gap-2 text-charcoal-400 hover:text-charcoal-500 transition-colors"
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

        {/* Cover Image Area */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-columbia-100 border-2 border-dashed border-columbia-300">
          {formData.cover_image_url ? (
            <div className="relative">
              <img src={formData.cover_image_url} alt="Cover" className="w-full h-56 object-cover" />
              <div className="absolute inset-0 bg-charcoal-500/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-white rounded-xl px-4 py-2 text-sm font-medium text-charcoal-500 flex items-center gap-2">
                  <Image size={16} /> Change Cover
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-columbia-600">
              <Image size={32} className="mb-2" />
              <p className="text-sm font-medium">Add a cover image</p>
            </div>
          )}
          <input
            type="url"
            value={formData.cover_image_url}
            onChange={(e) => handleFieldChange('cover_image_url', e.target.value)}
            placeholder="Paste cover image URL..."
            className="w-full px-4 py-2.5 bg-white/80 text-sm focus:outline-none focus:bg-white border-t border-columbia-200"
          />
        </div>

        {/* Title & Meta — Journal Style */}
        <div className="mb-10">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Give your atlas file a title..."
            className="w-full text-3xl md:text-4xl font-heading font-bold text-charcoal-500 bg-transparent border-none focus:outline-none placeholder:text-platinum-400 mb-3"
          />
          <textarea
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="A short summary of your adventure..."
            className="w-full text-lg text-charcoal-400 bg-transparent border-none focus:outline-none placeholder:text-platinum-400 resize-none h-16"
          />

          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 bg-naples-100 rounded-xl px-4 py-2.5">
              <span className="text-sm text-charcoal-400">Destination</span>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => handleFieldChange('destination', e.target.value)}
                placeholder="e.g., Tokyo"
                className="bg-transparent font-medium text-charcoal-500 focus:outline-none text-sm w-32"
              />
            </div>
            <div className="flex items-center gap-2 bg-coral-100 rounded-xl px-4 py-2.5">
              <span className="text-sm text-charcoal-400">Days</span>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.trip_length}
                onChange={(e) => handleFieldChange('trip_length', parseInt(e.target.value) || 1)}
                className="bg-transparent font-medium text-charcoal-500 focus:outline-none text-sm w-12"
              />
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-10 bg-white rounded-2xl border border-platinum-200 p-6 shadow-sm">
          <h2 className="text-xl font-heading font-bold text-charcoal-500 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-naples-400 flex items-center justify-center text-charcoal-500 text-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>i</span>
            Introduction
          </h2>
          <RichTextEditor
            content={intro}
            onChange={setIntro}
            placeholder="Write an introduction to your trip..."
          />
        </div>

        {/* Day-by-Day Sections */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold text-charcoal-500">Your Journey</h2>
            <Button variant="accent" size="sm" onClick={addDay} className="gap-2">
              <Plus size={16} />
              Add Day
            </Button>
          </div>

          <div className="space-y-6">
            {days.map((day, index) => {
              const accent = DAY_ACCENTS[index % DAY_ACCENTS.length];
              const numBg = DAY_NUMBERS[index % DAY_NUMBERS.length];
              return (
                <div key={index} className={`rounded-2xl p-6 border-2 ${accent} transition-all`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-10 h-10 rounded-xl ${numBg} text-white flex items-center justify-center font-bold text-lg`} style={{ fontFamily: "'Fredoka', sans-serif" }}>
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => handleDayChange(index, 'title', e.target.value)}
                      className="text-lg font-heading font-bold bg-transparent border-b-2 border-transparent hover:border-platinum-300 focus:border-coral-400 focus:outline-none px-1 py-0.5 flex-1 text-charcoal-500"
                    />
                    {days.length > 1 && (
                      <button
                        onClick={() => removeDay(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove day"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-platinum-200">
                    <RichTextEditor
                      content={day.content}
                      onChange={(val) => handleDayChange(index, 'content', val)}
                      placeholder={`Write about your adventure on Day ${day.dayNumber}...`}
                    />
                  </div>

                  {/* Day Images */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Image size={16} className="text-charcoal-400" />
                      <span className="text-sm font-medium text-charcoal-400">Photos</span>
                      <button
                        type="button"
                        onClick={() => addDayImage(index)}
                        className="text-xs text-coral-500 hover:text-coral-600 font-bold px-2 py-1 bg-coral-50 rounded-lg hover:bg-coral-100 transition-colors"
                      >
                        + Add photo
                      </button>
                    </div>
                    {day.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {day.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative group rounded-xl overflow-hidden">
                            <img src={img} alt="" className="h-28 w-full object-cover" />
                            <button
                              onClick={() => removeDayImage(index, imgIdx)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mb-10 bg-white rounded-2xl border border-platinum-200 p-6 shadow-sm">
          <h2 className="text-xl font-heading font-bold text-charcoal-500 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-columbia-600 flex items-center justify-center text-white text-sm">&#9733;</span>
            Travel Tips
          </h2>
          <RichTextEditor
            content={tips}
            onChange={setTips}
            placeholder="Share your tips, recommendations, and things to know..."
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-center gap-3 pb-12 pt-4">
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
