import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yadgsltfgsjmkmfcmfrz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4NLHnicktdkS9fILxrrMxg_pdvXuP3Z';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);