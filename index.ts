import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  const auth=req.headers.get("Authorization")||"",token=auth.replace(/^Bearer\\s+/i,"");
  if(!token)return json({error:"Login admin diperlukan."},401);
  const userClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:{user},error:ue}=await userClient.auth.getUser();if(ue||!user)return json({error:"Sesi login tidak valid."},401);
  const {data:role,error:re}=await db.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
  if(re)throw re;if(!role)return json({error:"Akun belum diberi hak administrator pada tabel admin_users."},403);
  const {data:participants,error:pe}=await db.from("participants").select("name,klass,participant_no,school_year,correct,wrong,unanswered,score,submitted_at,started_at,auto_submitted,created_at").order("created_at",{ascending:false});
  if(pe)throw pe;
  const {count:questionCount,error:qe}=await db.from("soal_fikih").select("*",{count:"exact",head:true}).eq("aktif",true);if(qe)throw qe;
  return json({participants:participants||[],question_count:questionCount||0});
 }catch(e){console.error(e);return json({error:"Gagal mengambil data dashboard administrator."},500)}
});
