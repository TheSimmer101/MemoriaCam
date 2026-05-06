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

  async function saveVideo(
    file: Blob | { uri: string; type?: string; name?: string }
  ) {
    const isWeb = file instanceof Blob;
    let uploadData: Blob | FormData;
    let contentType = "video/mp4";
    let fileName = `${Date.now()}.mp4`;

    // WEB
    if (file instanceof Blob) {
      const isWebm = file.type.includes("webm");
      const ext = isWebm ? "webm" : "mp4";
      contentType = file.type || "video/webm";
      fileName = `${Date.now()}.${ext}`;
      uploadData = new File([file], fileName, { type: contentType });
    }

    // NATIVE (Expo)
    else {
      const { Video } = await import("react-native-compressor");

      //print original file size
      const beforeResponse = await fetch(file.uri);
      const beforeBlob = await beforeResponse.blob();
      console.log("Before compression:", (beforeBlob.size / 1024 / 1024).toFixed(2), "MB");

      const compressedUri = await Video.compress(file.uri, {
      compressionMethod: "auto",
      quality: 0.6,
    }).catch(() => file.uri); //if compression fails fall back to the original video

    //print file size after compressing
    const afterResponse = await fetch(compressedUri);
    const afterBlob = await afterResponse.blob();
    console.log("After compression:", (afterBlob.size / 1024 / 1024).toFixed(2), "MB");

    const ext = file.type?.includes("webm") ? "webm" : "mp4";
    fileName = `${Date.now()}.${ext}`;
    contentType = file.type || "video/mp4";

    const formData = new FormData();
    formData.append("file", {
      uri: compressedUri,
      name: fileName,
      type: contentType,
    } as any);
    uploadData = formData;
  }
      

    const { data, error } = await supabase.storage
      .from("Videos")
      .upload(fileName, uploadData, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.log("UPLOAD ERROR:", error);
      throw error;
    }
    else{
      console.log("VIDEO UPLOADED SUCCESSFULLY");
    }

    const { data: publicUrlData } = supabase.storage
      .from("Videos")
      .getPublicUrl(data.path);

    return data.path;
  }

  async function createEntry(title: string, body_text?: string, video_url?: string) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ title, body_text, video_path: video_url, user_id: user?.id })
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

  return { entries, loading, error, createEntry, deleteEntry, updateEntry, saveTags, saveVideo, refetch: fetchEntries };
}