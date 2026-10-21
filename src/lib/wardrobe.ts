import { supabase } from './supabase';

export type StoredGarment = { id: string; image: string; photoPath?: string; name: string; category: string; color: string; season: string; formality: string; warmth: number };
const bucket = 'wardrobe-photos';
function requireClient() { if (!supabase) throw new Error('Supabase ist noch nicht konfiguriert.'); return supabase; }
export async function ensureSession(): Promise<string> {
 const client=requireClient();
 const {data:{session},error}=await client.auth.getSession(); if(error) throw error;
 if(session?.user) return session.user.id;
 const signed=await client.auth.signInAnonymously();
 if(signed.error || !signed.data.user) throw signed.error ?? new Error('Anonyme Anmeldung fehlgeschlagen.');
 return signed.data.user.id;
}
export async function loadGarments():Promise<StoredGarment[]> {
 const client=requireClient();
 const {data,error}=await client.from('clothing_items').select('id,photo_path,name,category,colors,season,formality,warmth_level').order('created_at',{ascending:false});
 if(error)throw error;
 return await Promise.all((data??[]).map(async row=>{
  const {data:photo,error:photoError}=await client.storage.from(bucket).createSignedUrl(row.photo_path,3600);
  if(photoError)throw photoError;
  return {id:row.id,photoPath:row.photo_path,image:photo.signedUrl,name:row.name,category:row.category,color:row.colors?.[0]??'',season:row.season?.[0]??'Ganzjährig',formality:row.formality,warmth:row.warmth_level};
 }));
}
export async function saveGarment(item:StoredGarment,userId:string):Promise<StoredGarment> {
 const client=requireClient();
 let path=item.photoPath; let newlyUploaded=false;
 if(!path){
  if(!item.image.startsWith('data:image/jpeg;base64,')) throw new Error('Bitte ein neues JPEG-Bild auswählen.');
  const blob=await (await fetch(item.image)).blob();
  path=`${userId}/${crypto.randomUUID()}.jpg`;
  const {error}=await client.storage.from(bucket).upload(path,blob,{contentType:'image/jpeg',upsert:false});
  if(error)throw error;
  newlyUploaded=true;
 }
 const {error}=await client.from('clothing_items').upsert({id:item.id,user_id:userId,photo_path:path,name:item.name,category:item.category,colors:item.color?[item.color]:[],season:[item.season],formality:item.formality,warmth_level:item.warmth});
 if(error){if(newlyUploaded)await client.storage.from(bucket).remove([path]);throw error;}
 const {data:photo,error:photoError}=await client.storage.from(bucket).createSignedUrl(path,3600);
 if(photoError)throw photoError;
 return {...item,photoPath:path,image:photo.signedUrl};
}
export async function deleteGarment(item:StoredGarment):Promise<void> {
 const client=requireClient();
 const {error}=await client.from('clothing_items').delete().eq('id',item.id);
 if(error)throw error;
 if(item.photoPath) {
  const {error:storageError}=await client.storage.from(bucket).remove([item.photoPath]);
  if(storageError) console.warn('Foto konnte nicht entfernt werden:',storageError.message);
 }
}
export type StoredOccasion = {id:string;name:string;description:string};
export async function loadOccasions():Promise<StoredOccasion[]>{
 const {data,error}=await requireClient().from('occasions').select('id,name,description').order('created_at',{ascending:false});
 if(error)throw error;
 return data??[];
}
export async function addOccasion(item:StoredOccasion,userId:string):Promise<void>{
 const {error}=await requireClient().from('occasions').insert({id:item.id,user_id:userId,name:item.name,description:item.description});
 if(error)throw error;
}
export async function deleteOccasion(id:string):Promise<void>{
 const {error}=await requireClient().from('occasions').delete().eq('id',id);
 if(error)throw error;
}
