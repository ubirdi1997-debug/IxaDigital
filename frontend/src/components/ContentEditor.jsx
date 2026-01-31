import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { Save, Plus, Trash2, ArrowLeft, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const ContentEditor = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchContent();
  }, [navigate]);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔍 Fetching content from:', `${BACKEND_URL}/api/admin/content/homepage`);
      
      const response = await axios.get(`${BACKEND_URL}/api/admin/content/homepage`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📦 Received content:', response.data);

      if (response.data.content) {
        setContent(response.data.content);
      } else {
        // Initialize with default structure
        console.log('⚠️ No content found, initializing defaults');
        setContent({
          page: 'homepage',
          hero: {
            headline: 'Results-Driven SEO, Marketing & Development Solutions',
            subheadline: 'Helping brands grow through SEO, digital marketing, web & app development',
            cta_primary: 'Get a Free Consultation',
            cta_secondary: 'View Our Services',
            stats: [
              { value: '500+', label: 'Projects Delivered' },
              { value: '98%', label: 'Client Satisfaction' },
              { value: '5+', label: 'Years Experience' }
            ]
          },
          about: {
            title: 'About IXA Digital',
            subtitle: 'Your long-term digital growth partner',
            headline: 'Driving Measurable Growth Through Digital Excellence',
            paragraphs: [
              'At IXA Digital, we don\'t just deliver projects—we deliver results.',
              'From startups to enterprises, we partner with businesses.',
              'We\'re your growth partner for the long haul.'
            ]
          },
          cta_section: {
            headline: 'Let\'s Build Your Digital Growth Engine',
            description: 'Ready to scale your business?',
            button_text: 'Start Your Project'
          },
          footer: {
            company_description: 'Results-driven digital growth partner',
            social_links: {
              facebook: '#',
              twitter: '#',
              linkedin: '#',
              instagram: '#'
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Fetch error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      } else {
        toast.error('Failed to fetch content');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Prepare payload with proper structure
      const payload = {
        page: content.page || 'homepage',
        hero: content.hero || {},
        about: content.about || {},
        services: content.services || [],
        menu_items: content.menu_items || [],
        process_steps: content.process_steps || [],
        industries: content.industries || [],
        footer: content.footer || {},
        cta_section: content.cta_section || {}
      };
      
      console.log('Saving content:', payload);
      
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/content`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Save response:', response.data);
      
      if (response.data.success) {
        toast.success('Content saved successfully!');
      } else {
        toast.error(response.data.message || 'Failed to save content');
      }
    } catch (error) {
      console.error('Save error:', error.response?.data || error.message);
      toast.error(error.response?.data?.detail || 'Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const updateHero = (field, value) => {
    setContent({
      ...content,
      hero: { ...content.hero, [field]: value }
    });
  };

  const updateStat = (index, field, value) => {
    const newStats = [...content.hero.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setContent({
      ...content,
      hero: { ...content.hero, stats: newStats }
    });
  };

  const addStat = () => {
    const newStats = [...content.hero.stats, { value: '', label: '' }];
    setContent({
      ...content,
      hero: { ...content.hero, stats: newStats }
    });
  };

  const removeStat = (index) => {
    const newStats = content.hero.stats.filter((_, i) => i !== index);
    setContent({
      ...content,
      hero: { ...content.hero, stats: newStats }
    });
  };

  const updateAbout = (field, value) => {
    setContent({
      ...content,
      about: { ...content.about, [field]: value }
    });
  };

  const updateParagraph = (index, value) => {
    const newParagraphs = [...content.about.paragraphs];
    newParagraphs[index] = value;
    setContent({
      ...content,
      about: { ...content.about, paragraphs: newParagraphs }
    });
  };

  const addParagraph = () => {
    const newParagraphs = [...content.about.paragraphs, ''];
    setContent({
      ...content,
      about: { ...content.about, paragraphs: newParagraphs }
    });
  };

  const removeParagraph = (index) => {
    const newParagraphs = content.about.paragraphs.filter((_, i) => i !== index);
    setContent({
      ...content,
      about: { ...content.about, paragraphs: newParagraphs }
    });
  };

  const updateCTA = (field, value) => {
    setContent({
      ...content,
      cta_section: { ...content.cta_section, [field]: value }
    });
  };

  const updateFooter = (field, value) => {
    setContent({
      ...content,
      footer: { ...content.footer, [field]: value }
    });
  };

  if (isLoading || !content) {
    return <div className="p-8 text-center">Loading content editor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Edit className="mr-3 text-red-600" size={32} />
              Content Editor
            </h1>
            <p className="text-gray-600 mt-2">Edit homepage content, texts, and menu items</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
              <Save size={16} className="mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="about">About Section</TabsTrigger>
            <TabsTrigger value="cta">CTA Section</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Headline</Label>
                  <Input
                    value={content.hero.headline}
                    onChange={(e) => updateHero('headline', e.target.value)}
                    placeholder="Main headline"
                  />
                </div>

                <div>
                  <Label>Subheadline</Label>
                  <Textarea
                    value={content.hero.subheadline}
                    onChange={(e) => updateHero('subheadline', e.target.value)}
                    placeholder="Supporting text"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primary CTA Button Text</Label>
                    <Input
                      value={content.hero.cta_primary}
                      onChange={(e) => updateHero('cta_primary', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Secondary CTA Button Text</Label>
                    <Input
                      value={content.hero.cta_secondary}
                      onChange={(e) => updateHero('cta_secondary', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Statistics</Label>
                    <Button onClick={addStat} size="sm" variant="outline">
                      <Plus size={14} className="mr-1" />
                      Add Stat
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {content.hero.stats.map((stat, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs">Value</Label>
                          <Input
                            value={stat.value}
                            onChange={(e) => updateStat(index, 'value', e.target.value)}
                            placeholder="500+"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={stat.label}
                            onChange={(e) => updateStat(index, 'label', e.target.value)}
                            placeholder="Projects Delivered"
                          />
                        </div>
                        <Button
                          onClick={() => removeStat(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Section */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About Section Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={content.about.title}
                    onChange={(e) => updateAbout('title', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={content.about.subtitle}
                    onChange={(e) => updateAbout('subtitle', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Headline</Label>
                  <Input
                    value={content.about.headline}
                    onChange={(e) => updateAbout('headline', e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Paragraphs</Label>
                    <Button onClick={addParagraph} size="sm" variant="outline">
                      <Plus size={14} className="mr-1" />
                      Add Paragraph
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {content.about.paragraphs.map((para, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={para}
                          onChange={(e) => updateParagraph(index, e.target.value)}
                          placeholder="Paragraph text"
                          rows={2}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => removeParagraph(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CTA Section */}
          <TabsContent value="cta">
            <Card>
              <CardHeader>
                <CardTitle>Call-to-Action Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Headline</Label>
                  <Input
                    value={content.cta_section.headline}
                    onChange={(e) => updateCTA('headline', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={content.cta_section.description}
                    onChange={(e) => updateCTA('description', e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={content.cta_section.button_text}
                    onChange={(e) => updateCTA('button_text', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer */}
          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Footer Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Description</Label>
                  <Textarea
                    value={content.footer.company_description}
                    onChange={(e) => updateFooter('company_description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Social Media Links</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label className="text-xs">Facebook URL</Label>
                      <Input
                        value={content.footer.social_links.facebook}
                        onChange={(e) =>
                          updateFooter('social_links', {
                            ...content.footer.social_links,
                            facebook: e.target.value
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Twitter URL</Label>
                      <Input
                        value={content.footer.social_links.twitter}
                        onChange={(e) =>
                          updateFooter('social_links', {
                            ...content.footer.social_links,
                            twitter: e.target.value
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">LinkedIn URL</Label>
                      <Input
                        value={content.footer.social_links.linkedin}
                        onChange={(e) =>
                          updateFooter('social_links', {
                            ...content.footer.social_links,
                            linkedin: e.target.value
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Instagram URL</Label>
                      <Input
                        value={content.footer.social_links.instagram}
                        onChange={(e) =>
                          updateFooter('social_links', {
                            ...content.footer.social_links,
                            instagram: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Button onClick={handleSave} disabled={isSaving} className="bg-red-600 hover:bg-red-700 px-12 py-6 text-lg">
            <Save size={20} className="mr-2" />
            {isSaving ? 'Saving All Changes...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;
