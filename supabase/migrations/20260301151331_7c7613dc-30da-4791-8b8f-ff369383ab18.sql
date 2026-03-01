
-- Table for AI chat conversations
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  template_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  extracted_order_json JSONB DEFAULT '{}'::jsonb,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for AI chat messages
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content JSONB NOT NULL DEFAULT '""'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS for ai_conversations
CREATE POLICY "Users can view own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- RLS for ai_chat_messages (via conversation ownership)
CREATE POLICY "Users can view own chat messages" ON public.ai_chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_chat_messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own chat messages" ON public.ai_chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_chat_messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own chat messages" ON public.ai_chat_messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_chat_messages.conversation_id AND user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX idx_ai_chat_messages_conv ON public.ai_chat_messages(conversation_id, created_at);
