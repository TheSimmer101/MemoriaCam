import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useEntries() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        entry_tags (
          tags ( id, name )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setEntries((data ?? []).map(e => ({
      ...e,
      tags: e.entry_tags.map((et: any) => et.tags)
    })));

    setLoading(false);
  }

  async function createEntry(title: string, body_text?: string) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ title, body_text, user_id: user?.id })
      .select()
      .single();

    if (error) return { error };

    // Optimistically add to top of list
    setEntries(prev => [{ ...data, tags: [] }, ...prev]);
    return { data };
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) return { error };

    setEntries(prev => prev.filter((e: any) => e.id !== id));
    return {};
  }

  async function updateEntry(id: string, fields: { title: string; body_text: string; tags: string[] }) {
    const { tags, ...rest } = fields;

    // Update the entry text fields
    const { error } = await supabase
        .from('journal_entries')
        .update(rest)
        .eq('id', id);

    if (error) return { error };

    // Replace tags: delete old ones, insert new ones
    await supabase.from('entry_tags').delete().eq('entry_id', id);
    await saveTags(id, tags);

    // Update local state
    setEntries(prev => prev.map((e: any) =>
        e.id === id ? { ...e, ...rest, tags: tags.map(name => ({ name })) } : e
    ));

    return {};
  }

  async function saveTags(entryId: string, tagNames: string[]) {
    const { data: { user } } = await supabase.auth.getUser();

    for (const name of tagNames) {
        // Upsert tag
        const { data: tag } = await supabase
        .from('tags')
        .upsert({ name, user_id: user?.id }, { onConflict: 'user_id,name' })
        .select()
        .single();

        // Link to entry
        if (tag) {
        await supabase.from('entry_tags').upsert({
            entry_id: entryId,
            tag_id: tag.id
        });
        }
    }
  }

  return { entries, loading, error, createEntry, deleteEntry, updateEntry, saveTags, refetch: fetchEntries };
}