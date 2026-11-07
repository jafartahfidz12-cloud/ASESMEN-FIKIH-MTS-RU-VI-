import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const hash=async(s:string)=>{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Gunakan POST."},405);
 try{
  const {access_token,answers,auto_submit=false}=await req.json();
  if(!access_token||!Array.isArray(answers))return json({error:"Sesi atau jawaban tidak lengkap."},400);
  const tokenHash=await hash(String(access_token));
  const {data:p,error:pe}=await db.from("participants").select("*").eq("access_token_hash",tokenHash).single();
  if(pe||!p)return json({error:"Sesi peserta tidak ditemukan."},401);
  if(p.submitted_at)return json({error:"Jawaban peserta ini sudah dikumpulkan."},409);
  const {data:bank,error:qe}=await db.from("soal_fikih").select("id,kunci_jawaban").eq("aktif",true).order("urutan",{ascending:true,nullsFirst:false}).order("id",{ascending:true}).limit(50);
  if(qe)throw qe;if(!bank||bank.length!==50)return json({error:"Bank soal aktif tidak berjumlah 50."},409);
  const given=new Map<number,string>();
  for(const a of answers){const id=Number(a.question_id);if(Number.isInteger(id)&&typeof a.answer==="string"&&"ABCD".includes(a.answer.toUpperCase()))given.set(id,a.answer.toUpperCase())}
  const rows=[];let correct=0,wrong=0,unanswered=0;
  for(const q of bank){const ans=given.get(Number(q.id))||null;const ok=!!ans&&ans===String(q.kunci_jawaban).trim().toUpperCase();if(ok)correct++;else if(ans)wrong++;else unanswered++;rows.push({participant_id:p.id,question_id:Number(q.id),answer_text:ans,is_correct:ok})}
  const {error:ae}=await db.from("submission_answers").insert(rows);if(ae)throw ae;
  const score=Math.round(correct/50*100);
  const {data:updated,error:ue}=await db.from("participants").update({submitted_at:new Date().toISOString(),correct,wrong,unanswered,score,auto_submitted:!!auto_submit}).eq("id",p.id).is("submitted_at",null).select("id").maybeSingle();
  if(ue||!updated){await db.from("submission_answers").delete().eq("participant_id",p.id);return json({error:"Pengumpulan gagal atau jawaban sudah pernah dikirim."},409)}
  return json({result:{name:p.name,klass:p.klass,participant_no:p.participant_no,correct,wrong,unanswered,score,auto_submitted:!!auto_submit}});
 }catch(e){console.error(e);return json({error:"Terjadi kesalahan saat mengoreksi atau menyimpan jawaban."},500)}
});
