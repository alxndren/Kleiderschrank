import { useEffect, useMemo, useState } from 'react';
import { Camera, Shirt, CloudSun, Heart, Plus, Trash2, Sparkles, MapPin, ArrowLeft } from 'lucide-react';

type Garment = { id: string; image: string; name: string; category: string; color: string; season: string; formality: string; warmth: number };
type Occasion = { id: string; name: string; description: string };
type Outfit = { id: string; itemIds: string[]; occasion: string; reason: string; favorite: boolean; date: string };
type Weather = { temperature: number; wind: number; precipitation: number; label: string };
const categories = ['Oberteil','Hose','Kleid','Schuhe','Jacke','Accessoire'];
const seasons = ['Ganzjährig','Frühling','Sommer','Herbst','Winter'];
const uid = () => crypto.randomUUID();
const load = <T,>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } };
const initialOccasions: Occasion[] = [{ id:'work', name:'Kundentermin', description:'Business, gepflegt' },{ id:'date', name:'Date Night',description:'Elegant, besonders' },{ id:'walk', name:'Spaziergang',description:'Bequem und wetterfest' }];
async function shrink(file: File): Promise<string> {
  if(!file.type.startsWith('image/')) throw Error('Bitte ein Bild auswählen.');
  if(file.size > 15_000_000) throw Error('Das Bild ist zu groß (max. 15 MB).');
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 900 / Math.max(bitmap.width,bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);
  canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  return canvas.toDataURL('image/jpeg',0.72);
}
const weatherCode = (code: number) => code >= 80 ? 'Schauer' : code >= 61 ? 'Regen' : code >= 51 ? 'Nieselregen' : code >= 3 ? 'Bewölkt' : code >= 1 ? 'Leicht bewölkt' : 'Sonnig';
async function fetchWeather(lat:number,lon:number):Promise<Weather>{
 const url = new URL('https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m,precipitation,wind_speed_10m,weather_code',timezone:'auto'}).toString();
 const response=await fetch(url);if(!response.ok)throw Error('Wetter konnte nicht geladen werden.');
 const data=await response.json();const c=data.current;if(!c || typeof c.temperature_2m!=='number')throw Error('Wetterdaten fehlen.');
 return {temperature:c.temperature_2m,wind:c.wind_speed_10m,precipitation:c.precipitation,label:weatherCode(c.weather_code)};
}
function suggest(items:Garment[],occasion:Occasion,weather:Weather|null):Outfit[]{
 const temp=weather?.temperature ?? 18;const seasonal=items.filter(i=>i.season==='Ganzjährig'||(temp<10?['Winter','Herbst']:temp>24?['Sommer','Frühling']:['Frühling','Herbst','Sommer']).includes(i.season));
 const pool=seasonal.length>=2?seasonal:items;
 const formal=/business|kunde|büro|meeting|elegant|date/i.test(occasion.description+' '+occasion.name);
 const ranked=[...pool].sort((a,b)=> (formal ? Number(b.formality==='Business'||b.formality==='Elegant')-Number(a.formality==='Business'||a.formality==='Elegant'):0));
 const tops=ranked.filter(i=>i.category==='Oberteil'||i.category==='Kleid');
 const pants=ranked.filter(i=>i.category==='Hose');const shoes=ranked.filter(i=>i.category==='Schuhe');const jackets=ranked.filter(i=>i.category==='Jacke');
 if(!tops.length||(!pants.length&&!tops.some(i=>i.category==='Kleid')))return [];
 return Array.from({length:Math.min(3,Math.max(1,tops.length))},(_,n)=>{
  const top=tops[n%tops.length];const selected=[top];
  if(top.category!=='Kleid'&&pants.length)selected.push(pants[n%pants.length]);
  if(shoes.length)selected.push(shoes[n%shoes.length]);
  if(jackets.length&&(temp<17||((weather?.precipitation??0)>0)||(weather?.wind??0)>25))selected.push(jackets[n%jackets.length]);
  const reason=[formal?'Passend zum gepflegten Anlass':'Abgestimmt auf deinen Anlass',weather?`${Math.round(temp)} °C und ${weather.label.toLowerCase()}`:'ohne aktuelle Wetterdaten',jackets.length&&selected.some(i=>i.category==='Jacke')?'mit Jacke für das Wetter':''].filter(Boolean).join(' · ');
  return{id:uid(),itemIds:[...new Set(selected.map(i=>i.id))],occasion:occasion.name,reason,favorite:false,date:new Date().toISOString()};
 }).filter((out,i,all)=>all.findIndex(other=>other.itemIds.join(',')===out.itemIds.join(','))===i);
}
export default function App(){
 const [items,setItems]=useState<Garment[]>(()=>load('wardrobe-items',[]));
 const [occasions,setOccasions]=useState<Occasion[]>(()=>load('wardrobe-occasions',initialOccasions));
 const [outfits,setOutfits]=useState<Outfit[]>(()=>load('wardrobe-outfits',[]));
 const [tab,setTab]=useState<'home'|'wardrobe'|'occasions'|'history'>('home');
 const [editing,setEditing]=useState<Partial<Garment>|null>(null);
 const [query,setQuery]=useState('');const [category,setCategory]=useState('Alle');
 const [occasion,setOccasion]=useState('work');const [weather,setWeather]=useState<Weather|null>(null);
 const [coords,setCoords]=useState({lat:'53.36',lon:'8.65'});const [loading,setLoading]=useState(false);
 const [notice,setNotice]=useState('');const [name,setName]=useState('');const [description,setDescription]=useState('');
 const [suggestions,setSuggestions]=useState<Outfit[]>([]);
 useEffect(()=>{try{localStorage.setItem('wardrobe-items',JSON.stringify(items))}catch{setNotice('Lokaler Speicher voll. Bitte Bilder verkleinern oder entfernen.')}},[items]);
 useEffect(()=>{localStorage.setItem('wardrobe-occasions',JSON.stringify(occasions))},[occasions]);
 useEffect(()=>{localStorage.setItem('wardrobe-outfits',JSON.stringify(outfits))},[outfits]);
 const filtered=useMemo(()=>items.filter(i=>(category==='Alle'||i.category===category)&&[i.name,i.color,i.season].join(' ').toLowerCase().includes(query.toLowerCase())),[items,category,query]);
 const picked=occasions.find(i=>i.id===occasion)||occasions[0];
 async function upload(file?:File){if(!file)return;try{const image=await shrink(file);setEditing({id:uid(),image,name:file.name.replace(/\.[^.]+$/,''),category:'Oberteil',color:'',season:'Ganzjährig',formality:'Casual',warmth:3});setNotice('Bitte Tags prüfen: automatische KI-Erkennung folgt mit der sicheren Backend-Anbindung.')}catch(e){setNotice(String(e))}}
 async function updateWeather(lat:number,lon:number){try{setLoading(true);setWeather(await fetchWeather(lat,lon));setNotice('Wetter aktualisiert.')}catch(e){setNotice(String(e))}finally{setLoading(false)}}
 function locate(){if(!navigator.geolocation){setNotice('Standort nicht verfügbar. Bitte Koordinaten eingeben.');return;}navigator.geolocation.getCurrentPosition(p=>{setCoords({lat:String(p.coords.latitude),lon:String(p.coords.longitude)});void updateWeather(p.coords.latitude,p.coords.longitude)},()=>setNotice('Standort nicht freigegeben. Bitte Koordinaten eingeben.'),{timeout:10000});}
 function makeSuggestions(){if(!picked)return setNotice('Bitte zuerst einen Anlass erstellen.');const next=suggest(items,picked,weather);setSuggestions(next);if(!next.length)setNotice('Für Outfitvorschläge brauchst du mindestens ein Oberteil oder Kleid und gegebenenfalls eine Hose.');else{setOutfits(old=>[...next,...old]);setNotice('Regelbasierte Demo-Vorschläge erstellt. KI-Vorschläge folgen.');}}
 function toggleFavorite(id:string){setOutfits(old=>old.map(o=>o.id===id?{...o,favorite:!o.favorite}:o));setSuggestions(old=>old.map(o=>o.id===id?{...o,favorite:!o.favorite}:o));}
 function outfitCard(o:Outfit){const selected=o.itemIds.map(id=>items.find(i=>i.id===id)).filter((i):i is Garment=>!!i);return <article className="outfit" key={o.id}><div className="outfit-pictures">{selected.map(i=><img key={i.id} src={i.image} alt={i.name}/>)}</div><div className="outfit-bottom"><div><strong>{o.occasion}</strong><p>{o.reason}</p></div><button className={o.favorite?'heart active':'heart'} aria-label={o.favorite?'Favorit entfernen':'Favorisieren'} onClick={()=>toggleFavorite(o.id)}><Heart size={22} fill={o.favorite?'currentColor':'none'}/></button></div></article>}
 return <div className="app"><header><div className="brand"><span className="brand-icon"><Shirt size={21}/></span><span>mein<span className="brand-bold">kleiderschrank</span></span></div><span className="demo">LOKALE DEMO</span></header><main>
 {notice&&<div className="notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Hinweis schließen">×</button></div>}
 {tab==='home'&&<><section className="hero"><span className="eyebrow">DEIN STIL. DEIN TAG.</span><h1>Was ziehe ich<br/><em>heute an?</em></h1><p>Entdecke neue Looks aus den Dingen, die du schon liebst.</p><div className="hero-actions"><button className="primary" onClick={()=>setTab('wardrobe')}><Camera size={18}/> Kleidung hinzufügen</button></div></section>
 <section className="panel"><div className="section-heading"><div><span className="eyebrow">TAGESLOOK</span><h2>Dein Outfit</h2></div><CloudSun className="muted" size={30}/></div><label htmlFor="occasion">Wofür kleidest du dich?</label><select id="occasion" value={occasion} onChange={e=>setOccasion(e.target.value)}>{occasions.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select>
 <div className="weather"><div><span className="eyebrow">WETTER</span><p>{weather?<><strong>{Math.round(weather.temperature)} °C</strong> · {weather.label} · Wind {Math.round(weather.wind)} km/h</>:'Noch keine Wetterdaten'}</p></div><button className="text-button" onClick={locate} disabled={loading}><MapPin size={15}/> Standort</button></div><details><summary>Ort manuell (Koordinaten)</summary><div className="coordinates"><input aria-label="Breitengrad" value={coords.lat} onChange={e=>setCoords(v=>({...v,lat:e.target.value}))}/><input aria-label="Längengrad" value={coords.lon} onChange={e=>setCoords(v=>({...v,lon:e.target.value}))}/><button onClick={()=>{const lat=Number(coords.lat),lon=Number(coords.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180){setNotice('Ungültige Koordinaten.');return;}void updateWeather(lat,lon)}}>Abrufen</button></div></details>
 <button className="primary full" onClick={makeSuggestions} disabled={!items.length||loading}><Sparkles size={18}/> Outfits vorschlagen</button>{!items.length&&<p className="hint">Füge zuerst Kleidungsstücke hinzu.</p>}</section>
 {suggestions.length>0&&<section><div className="section-heading"><h2>Für dich kombiniert</h2></div><div className="outfits">{suggestions.map(outfitCard)}</div></section>}
 <section className="summary-card" onClick={()=>setTab('wardrobe')}><div><span className="eyebrow">DEINE GARDEROBE</span><h2>{items.length} Kleidungsstücke</h2><p>Alle deine Lieblingsteile auf einen Blick</p></div><span className="arrow">→</span></section></>}
 {tab==='wardrobe'&&<><div className="page-title"><div><span className="eyebrow">DEINE SAMMLUNG</span><h1>Kleiderschrank</h1><p>{items.length} Teile katalogisiert</p></div><label className="primary upload"><Plus size={18}/> Hinzufügen<input type="file" accept="image/*" onChange={e=>{void upload(e.target.files?.[0]);e.target.value=''}}/></label></div><div className="filters"><input placeholder="Kleidung suchen …" aria-label="Kleidung suchen" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Kategorie" value={category} onChange={e=>setCategory(e.target.value)}><option>Alle</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div>{filtered.length?<div className="garment-grid">{filtered.map(i=><button className="garment" key={i.id} onClick={()=>setEditing(i)}><img src={i.image} alt={i.name}/><strong>{i.name||i.category}</strong><span>{i.category} · {i.color||'Farbe offen'}</span></button>)}</div>:<div className="empty"><Shirt size={38}/><h3>Hier ist noch Platz</h3><p>Fotografiere dein erstes Kleidungsstück.</p></div>}</>}
 {tab==='occasions'&&<><div className="page-title"><div><span className="eyebrow">FÜR JEDEN MOMENT</span><h1>Anlässe</h1></div></div><form className="panel form" onSubmit={e=>{e.preventDefault();if(!name.trim())return;const next={id:uid(),name:name.trim(),description:description.trim()};setOccasions(v=>[...v,next]);setOccasion(next.id);setName('');setDescription('')}}><h2>Neuen Anlass anlegen</h2><label>Name<input required placeholder="z. B. Dinner mit Freunden" value={name} onChange={e=>setName(e.target.value)}/></label><label>Stilwunsch<textarea placeholder="z. B. leger, aber besonders" value={description} onChange={e=>setDescription(e.target.value)}/></label><button className="primary" type="submit"><Plus size={17}/> Anlass speichern</button></form><div className="occasion-list">{occasions.map(o=><div className="occasion-row" key={o.id}><div><strong>{o.name}</strong><p>{o.description||'Keine Stilvorgabe'}</p></div><button aria-label={o.name+' löschen'} onClick={()=>{setOccasions(v=>v.filter(i=>i.id!==o.id));if(occasion===o.id)setOccasion(occasions.find(i=>i.id!==o.id)?.id||'')}}><Trash2 size={17}/></button></div>)}</div></>}
 {tab==='history'&&<><div className="page-title"><div><span className="eyebrow">DEINE LOOKS</span><h1>Outfit-Verlauf</h1></div></div>{outfits.length?<div className="outfits">{outfits.map(outfitCard)}</div>:<div className="empty"><Heart size={38}/><h3>Deine Looks warten</h3><p>Erstelle deine ersten Outfitvorschläge.</p></div>}</>}
 </main><nav aria-label="Hauptnavigation"><button className={tab==='home'?'selected':''} onClick={()=>setTab('home')}><CloudSun size={21}/><span>Heute</span></button><button className={tab==='wardrobe'?'selected':''} onClick={()=>setTab('wardrobe')}><Shirt size={21}/><span>Schrank</span></button><button className={tab==='occasions'?'selected':''} onClick={()=>setTab('occasions')}><Plus size={21}/><span>Anlässe</span></button><button className={tab==='history'?'selected':''} onClick={()=>setTab('history')}><Heart size={21}/><span>Looks</span></button></nav>
 {editing&&<div className="modal-scrim" onClick={()=>setEditing(null)}><div className="modal" role="dialog" aria-modal="true" aria-label="Kleidungsstück bearbeiten" onClick={e=>e.stopPropagation()}><button className="back" onClick={()=>setEditing(null)}><ArrowLeft size={17}/> Zurück</button><h2>Kleidungsstück</h2><img className="edit-photo" src={editing.image} alt="Vorschau"/><div className="fields"><label>Bezeichnung<input value={editing.name||''} onChange={e=>setEditing(v=>({...v,name:e.target.value}))}/></label><label>Kategorie<select value={editing.category} onChange={e=>setEditing(v=>({...v,category:e.target.value}))}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Farbe<input placeholder="z. B. Dunkelblau" value={editing.color||''} onChange={e=>setEditing(v=>({...v,color:e.target.value}))}/></label><label>Jahreszeit<select value={editing.season} onChange={e=>setEditing(v=>({...v,season:e.target.value}))}>{seasons.map(s=><option key={s}>{s}</option>)}</select></label><label>Stil<select value={editing.formality} onChange={e=>setEditing(v=>({...v,formality:e.target.value}))}>{['Casual','Business','Elegant'].map(s=><option key={s}>{s}</option>)}</select></label><label>Wärmegrad (1–5)<input type="number" min="1" max="5" value={editing.warmth||3} onChange={e=>setEditing(v=>({...v,warmth:Number(e.target.value)}))}/></label></div><button className="primary full" onClick={()=>{if(!editing.image)return;const garment=editing as Garment;setItems(prev=>prev.some(i=>i.id===garment.id)?prev.map(i=>i.id===garment.id?garment:i):[garment,...prev]);setEditing(null);setNotice('Kleidungsstück gespeichert.')}}>Kleidungsstück speichern</button>{items.some(i=>i.id===editing.id)&&<button className="danger" onClick={()=>{setItems(v=>v.filter(i=>i.id!==editing.id));setEditing(null)}}><Trash2 size={16}/> Löschen</button>}</div></div>}
 </div>;
}
