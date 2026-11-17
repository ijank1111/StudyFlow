"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, UserX, Mail, Users, Clock, Copy, Check, RefreshCw } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Friends = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email || null);

      // Ensure current user has a profile
      await supabase.from('profiles').upsert({ id: user.id, email: user.email });

      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (friendError) throw friendError;

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        setPendingIncoming([]);
        setPendingOutgoing([]);
        return;
      }

      const userIds = Array.from(new Set(
        friendships.flatMap(f => [f.sender_id, f.receiver_id])
      ));

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profileError) throw profileError;

      const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const enrichedFriendships = friendships.map(f => ({
        ...f,
        sender: profileMap[f.sender_id] || { email: 'Unknown User' },
        receiver: profileMap[f.receiver_id] || { email: 'Unknown User' }
      }));

      setFriends(enrichedFriendships.filter(f => f.status === 'accepted'));
      setPendingIncoming(enrichedFriendships.filter(f => f.status === 'pending' && f.receiver_id === user.id));
      setPendingOutgoing(enrichedFriendships.filter(f => f.status === 'pending' && f.sender_id === user.id));

    } catch (error: any) {
      console.error("[Friends] Error:", error);
      showError(`Error: ${error.message || "Could not load friends"}`);
    } finally {
      setRefreshing(false);
    }
  };

  const copyEmail = () => {
    if (currentUserEmail) {
      navigator.clipboard.writeText(currentUserEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSuccess('Email copied!');
    }
  };

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;
    setLoading(true);

    try {
      // Search for the user in the profiles table
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', targetEmail)
        .maybeSingle();

      if (!targetUser) {
        throw new Error(`User "${targetEmail}" not found. They must have logged into StudyFlow at least once.`);
      }
      
      if (targetUser.id === currentUserId) {
        throw new Error('You cannot add yourself.');
      }

      const { error: friendError } = await supabase
        .from('friendships')
        .insert({
          sender_id: currentUserId,
          receiver_id: targetUser.id,
          status: 'pending'
        });

      if (friendError) {
        if (friendError.code === '23505') throw new Error('A request already exists.');
        throw friendError;
      }

      showSuccess(`Request sent to ${targetUser.email}!`);
      setEmail('');
      fetchData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      if (status === 'declined') {
        const { error } = await supabase.from('friendships').delete().eq('id', requestId);
        if (error) throw error;
        showSuccess('Request removed');
      } else {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', requestId);
        if (error) throw error;
        showSuccess('Friend added!');
      }
      fetchData();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Friends</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-xl bg-white ${refreshing ? 'animate-spin' : ''}`}
              onClick={fetchData}
              disabled={refreshing}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {currentUserEmail && (
              <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="text-sm font-medium text-indigo-600">{currentUserEmail}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={copyEmail}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Add Friend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendRequest} className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="friend@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200"
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6">
                {loading ? 'Sending...' : 'Send Invite'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm mb-6">
            <TabsTrigger value="friends" className="rounded-xl px-6 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              My Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl px-6 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Pending ({pendingIncoming.length + pendingOutgoing.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">No friends yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((f) => {
                  const friendProfile = f.sender_id === currentUserId ? f.receiver : f.sender;
                  return (
                    <Card key={f.id} className="border-none shadow-sm rounded-2xl">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {friendProfile?.email?.[0].toUpperCase() || '?'}
                          </div>
                          <p className="font-bold text-slate-800">{friendProfile?.email || 'Unknown User'}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={() => handleRequest(f.id, 'declined')}>
                          <UserX className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            {pendingIncoming.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Incoming Requests</h3>
                {pendingIncoming.map((f) => (
                  <Card key={f.id} className="border-none shadow-sm rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                          {f.sender?.email?.[0].toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{f.sender?.email || 'Unknown User'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-lg" onClick={() => handleRequest(f.id, 'accepted')}>
                          Accept
                        </Button>
                        <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-600 rounded-lg" onClick={() => handleRequest(f.id, 'declined')}>
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {pendingOutgoing.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Sent Requests</h3>
                {pendingOutgoing.map((f) => (
                  <Card key={f.id} className="border-none shadow-sm rounded-2xl opacity-75">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                          {f.receiver?.email?.[0].toUpperCase() || '?'}
                        </div>
                        <p className="font-bold text-slate-800">{f.receiver?.email || 'Unknown User'}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500" onClick={() => handleRequest(f.id, 'declined')}>
                        Cancel
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">No pending requests.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Friends;