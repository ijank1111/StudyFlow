import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar, Users, BookOpen, ArrowRight, Filter, Lock, User, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { showError } from '@/utils/toast';

const SharedAssignments = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedAssignments();
  }, []);

  const fetchSharedAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (friendError) throw friendError;

      const friendIds = (friendships || []).map(f => 
        f.sender_id === user.id ? f.receiver_id : f.sender_id
      );

      const allIds = [...friendIds, user.id];

      const { data: assignmentsData, error: assError } = await supabase
        .from('assignments')
        .select('*, tasks(count)')
        .eq('is_shared', true)
        .in('user_id', allIds)
        .order('created_at', { ascending: false });

      if (assError) throw assError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        return;
      }

      const userIds = Array.from(new Set(assignmentsData.map(a => a.user_id)));
      const { data: profilesData, error: profError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profError) throw profError;

      const profileMap = (profilesData || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const enrichedAssignments = assignmentsData.map(a => ({
        ...a,
        profiles: profileMap[a.user_id]
      }));

      setAssignments(enrichedAssignments);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = filterType === "all" 
    ? assignments 
    : assignments.filter(a => a.type === filterType);

  if (loading) return <Layout><div className="flex items-center justify-center h-64">Loading shared plans...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Shared Plans</h2>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="pl-2 text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] border-none focus:ring-0 shadow-none h-9">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="essay">Essays</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="programming">Programming</SelectItem>
                <SelectItem value="presentation">Presentations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <Lock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            {assignments.length === 0 && (
              <div className="flex flex-col gap-2 mt-4">
                <Link to="/new" className="text-indigo-600 font-semibold hover:underline">
                  Create and share a plan
                </Link>
                <Link to="/friends" className="text-slate-500 text-sm hover:underline">
                  Go to Friends page
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">
                        {assignment.course}
                      </Badge>
                      {assignment.user_id === currentUserId ? (
                        <Badge variant="outline" className="border-indigo-200 text-indigo-600 bg-indigo-50/30 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Mine
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {assignment.profiles?.email || 'Friend'}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {assignment.type}
                    </span>
                  </div>
                  <CardTitle className="text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {assignment.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500 line-clamp-2 italic">
                    "{assignment.brief}"
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(assignment.deadline), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {assignment.tasks?.[0]?.count || 0} Tasks
                      </span>
                    </div>
                    <Link 
                      to={`/assignment/${assignment.id}`}
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm font-semibold"
                    >
                      View Plan
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SharedAssignments;