import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

export interface UploadQueueItem {
  id: string; // uuid
  uri: string;
}

const QUEUE_KEY = 'receipt_upload_queue';

export async function uploadReceipt(uri: string) {
  const id = Date.now().toString() + Math.random().toString(36).substring(7);
  const item: UploadQueueItem = { id, uri };
  
  const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: UploadQueueItem[] = queueStr ? JSON.parse(queueStr) : [];
  queue.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

  syncQueue();
}

export async function syncQueue() {
  const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: UploadQueueItem[] = queueStr ? JSON.parse(queueStr) : [];
  if (queue.length === 0) return;

  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) return;

  const remainingQueue = [...queue];

  for (const item of queue) {
    try {
      const extension = item.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${item.id}.${extension}`;
      
      const fileBase64 = await FileSystemLegacy.readAsStringAsync(item.uri, {
        encoding: 'base64',
      });

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, decode(fileBase64), {
          contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
      
      const { data: newReceipt } = await supabase.from('receipts').insert({
        user_id: user.id,
        image_url: publicUrlData.publicUrl,
        status: 'pending'
      }).select().single();

      // Trigger the AI parsing API on the Web backend
      const { data: sessionData } = await supabase.auth.getSession();
      if (newReceipt && sessionData.session) {
        await fetch('https://flow-fi-web.vercel.app/api/receipt/parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`
          },
          body: JSON.stringify({ receiptId: newReceipt.id })
        });
      }

      remainingQueue.shift();
    } catch (e) {
      console.error('Failed to upload', e);
      break;
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
}
