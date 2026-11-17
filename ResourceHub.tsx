"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Link as LinkIcon, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Plus, 
  Globe,
  FileCode
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Resource {
  id: string;
  title: string;
  url: string;
  resource_type: string;
}

interface ResourceHubProps {
  assignmentId: string;
}

const ResourceHub = ({ assignmentId }: ResourceHubProps) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    resource_type: 'link'
  });

  useEffect(() => {
    fetchResources();
  }, [assignmentId]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_resources')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.url) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ensure URL has protocol
      let formattedUrl = newResource.url;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }

      const { error } = await supabase
        .from('assignment_resources')
        .insert({
          assignment_id: assignmentId,
          user_id: user.id,
          title: newResource.title,
          url: formattedUrl,
          resource_type: newResource.resource_type
        });

      if (error) throw error;

      showSuccess("Resource added!");
      setNewResource({ title: '', url: '', resource_type: 'link' });
      setIsAdding(false);
      fetchResources();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const deleteResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignment_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setResources(resources.filter(r => r.id !== id));
      showSuccess("Resource removed");
    } catch (error: any) {
      showError(error.message);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'doc': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'pdf': return <FileCode className="w-4 h-4 text-red-500" />;
      case 'research': return <Globe className="w-4 h-4 text-emerald-500" />;
      default: return <LinkIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) return <div className="animate-pulse space-y-2"><div className="h-10 bg-slate-100 rounded-xl w-full"></div></div>;

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-indigo-600" />
          Resource Hub
        </CardTitle>
        {!isAdding && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="h-8 rounded-lg text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <form onSubmit={handleAddResource} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input 
                placeholder="e.g. Research Paper, Google Doc" 
                value={newResource.title}
                onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                className="h-9 rounded-lg bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">URL</Label>
              <Input 
                placeholder="https://..." 
                value={newResource.url}
                onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                className="h-9 rounded-lg bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Type</Label>
              <Select 
                value={newResource.resource_type} 
                onValueChange={(v) => setNewResource({...newResource, resource_type: v})}
              >
                <SelectTrigger className="h-9 rounded-lg bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="link">General Link</SelectItem>
                  <SelectItem value="doc">Google Doc / Paper</SelectItem>
                  <SelectItem value="pdf">PDF / File Link</SelectItem>
                  <SelectItem value="research">Research Source</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs">Save</Button>
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="h-9 rounded-lg text-xs">Cancel</Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {resources.length === 0 && !isAdding ? (
            <div className="text-center py-6 text-slate-400 text-sm italic">
              No resources attached yet.
            </div>
          ) : (
            resources.map((resource) => (
              <div 
                key={resource.id} 
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                    {getIcon(resource.resource_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{resource.title}</p>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 truncate"
                    >
                      {resource.url.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-2 h-2" />
                    </a>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteResource(resource.id)}
                  className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceHub;