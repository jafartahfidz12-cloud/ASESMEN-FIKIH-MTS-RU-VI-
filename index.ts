import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const hash=async(s:string)=>{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Gunakan POST."},405);
 try{
  const b=await req.json();const name=String(b.name||"").trim(),klass=String(b.klass||"").trim(),participant_no=String(b.participant_no||"").trim(),school_year=String(b.school_year||"2026/2027").trim(),pin=String(b.pin||"").trim();
  if(!name||!klass||!participant_no)return json({error:"Nama, kelas, dan nomor peserta wajib diisi."},400);
  const {data:settings,error:se}=await db.from("pengaturan_ujian").select("*").eq("status_aktif",true).order("id",{ascending:false}).limit(1).maybeSingle();
  if(se)throw se;
  if(settings?.tanggal_mulai&&new Date(settings.tanggal_mulai)>new Date())return json({error:"Ujian belum dibuka."},403);
  if(settings?.tanggal_selesai&&new Date(settings.tanggal_selesai)<new Date())return json({error:"Waktu pelaksanaan ujian telah berakhir."},403);
  if(settings?.pin_akses&&settings.pin_akses!==pin)return json({error:"PIN ujian tidak sesuai."},403);
  const {data:existing,error:ee}=await db.from("participants").select("id").eq("participant_no",participant_no).maybeSingle();
  if(ee)throw ee;if(existing)return json({error:"Nomor peserta ini sudah pernah digunakan. Hubungi pengawas."},409);
  const {data:bank,error:qe}=await db.from("soal_fikih").select("id,pertanyaan,pilihan_a,pilihan_b,pilihan_c,pilihan_d,kategori,urutan").eq("aktif",true).order("urutan",{ascending:true,nullsFirst:false}).order("id",{ascending:true}).limit(50);
  if(qe)throw qe;if(!bank||bank.length!==50)return json({error:`Bank soal aktif harus tepat 50 soal. Saat ini ditemukan ${bank?.length||0}. Impor file seed-soal.sql terlebih dahulu.`},409);
  const access_token=crypto.randomUUID()+"-"+crypto.randomUUID(),access_token_hash=await hash(access_token);
  const {data:p,error:pe}=await db.from("participants").insert({name,klass,participant_no,school_year,access_token_hash}).select("id,name,klass,participant_no,school_year,started_at").single();
  if(pe){if(pe.code==="23505")return json({error:"Nomor peserta sudah digunakan."},409);throw pe}
  return json({participant:p,access_token,questions:bank,duration_minutes:settings?.durasi_menit||90,exam_name:settings?.nama_ujian||"Asesmen Fikih 2026"});
 }catch(e){console.error(e);return json({error:"Server gagal memulai ujian. Periksa tabel Supabase dan Edge Function."},500)}
});
