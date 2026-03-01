import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIConversation {
  id: string;
  user_id: string;
  title: string | null;
  template_id: string | null;
  status: string;
  extracted_order_json: Record<string, any>;
  order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIChatMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: any; // string or MessageContent[]
  created_at: string;
}

export function useAIConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-conversations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AIConversation[];
    },
  });
}

export function useAIConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['ai-chat-messages', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as AIChatMessage[];
    },
  });
}

export function useCreateAIConversation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { title?: string }) => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user!.id, title: params.title || null })
        .select()
        .single();
      if (error) throw error;
      return data as AIConversation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-conversations'] }),
  });
}

export function useUpdateAIConversation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; title?: string; status?: string; extracted_order_json?: any; order_id?: string; template_id?: string }) => {
      const { id, ...updates } = params;
      const { error } = await supabase
        .from('ai_conversations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-conversations'] }),
  });
}

export function useSaveAIChatMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { conversation_id: string; role: string; content: any }) => {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .insert({
          conversation_id: params.conversation_id,
          role: params.role,
          content: params.content,
        })
        .select()
        .single();
      if (error) throw error;
      return data as AIChatMessage;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['ai-chat-messages', vars.conversation_id] }),
  });
}

export function useDeleteAIConversation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-conversations'] }),
  });
}
