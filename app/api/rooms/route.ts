import { apiError, apiSuccess, getApiAuthContext } from "@/lib/auth/api";
import { getRoomOption } from "@/lib/game/rooms";

export async function GET() {
  const context=await getApiAuthContext(); if(context.error)return context.error;
  await context.admin.rpc("process_due_room_operations",{p_user_id:context.user.id,p_now:new Date().toISOString()});
  const {data,error}=await context.admin.from("room_operations").select("id,operation_type,room_type,cost_cents,status,started_at,completes_at,completed_at,result").eq("owner_id",context.user.id).order("created_at",{ascending:false});
  return error?apiError("Nao foi possivel carregar as operacoes de salas.",503):apiSuccess({operations:data||[],serverNow:new Date().toISOString()});
}
export async function POST(request:Request){
  const context=await getApiAuthContext();if(context.error)return context.error;const body=await request.json().catch(()=>null) as {optionId?:string;mode?:string}|null;
  const option=getRoomOption(body?.optionId||"");const mode=body?.mode;if(!option||!['purchase','rent'].includes(mode||""))return apiError("Operacao de sala invalida.",422);
  const cost=mode==='purchase'?option.purchaseCents:option.rentCents;
  const {data,error}=await context.admin.rpc("start_room_operation",{p_user_id:context.user.id,p_operation_type:mode,p_room_type:option.id,p_cost_cents:cost});
  if(error)return apiError(error.message.includes('insufficient_funds')?"Saldo insuficiente.":error.message.includes('club_unavailable')?"Novas obrigacoes estao bloqueadas para este clube.":"Nao foi possivel iniciar a operacao.",409);
  const {data:operation}=await context.admin.from("room_operations").select("id,operation_type,room_type,cost_cents,status,started_at,completes_at").eq("id",data).single();
  return apiSuccess({operation});
}
