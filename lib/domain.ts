export type OrderStatus="PENDING"|"AWAITING_PAYMENT"|"PAID"|"FAILED"|"CANCELED"|"EXPIRED"|"REFUNDED";
export type SessionStatus="SCHEDULED"|"COMPLETED"|"CANCELED"|"NO_SHOW"|"RESCHEDULED";
export type OrderSnapshot={title:string;priceMinor:number;currency:string;sessionCount?:number;metadata?:Record<string,string>};
export type Order={id:string;status:OrderStatus;snapshot:OrderSnapshot;createdAt:string};
export type SessionUsage={id:string;entitlementId:string;appointmentId:string;status:"COMPLETED"|"REVERSED";recordedBy:string;recordedAt:string;reason?:string};
export type SessionEntitlement={id:string;totalSessions:number;usages:SessionUsage[]};
const transitions:Record<OrderStatus,OrderStatus[]>={PENDING:["AWAITING_PAYMENT","CANCELED","EXPIRED"],AWAITING_PAYMENT:["PAID","FAILED","CANCELED","EXPIRED"],PAID:["REFUNDED"],FAILED:["AWAITING_PAYMENT","CANCELED"],CANCELED:[],EXPIRED:[],REFUNDED:[]};
export function canTransition(from:OrderStatus,to:OrderStatus){return transitions[from].includes(to)}
export function transitionOrder(order:Order,to:OrderStatus):Order{if(!canTransition(order.status,to))throw new Error(`Invalid order transition: ${order.status} -> ${to}`);return {...order,status:to}}
export function remainingSessions(entitlement:SessionEntitlement){const used=entitlement.usages.filter(u=>u.status==="COMPLETED").length;return Math.max(0,entitlement.totalSessions-used)}
export function consumeSession(entitlement:SessionEntitlement,appointmentId:string,recordedBy:string):SessionEntitlement{if(remainingSessions(entitlement)<=0)throw new Error("No remaining sessions");if(entitlement.usages.some(u=>u.appointmentId===appointmentId&&u.status==="COMPLETED"))return entitlement;return {...entitlement,usages:[...entitlement.usages,{id:`usage-${Date.now()}`,entitlementId:entitlement.id,appointmentId,status:"COMPLETED",recordedBy,recordedAt:new Date().toISOString()}]}}
export function reverseSession(entitlement:SessionEntitlement,usageId:string,recordedBy:string,reason:string):SessionEntitlement{const usage=entitlement.usages.find(u=>u.id===usageId);if(!usage||usage.status!=="COMPLETED")throw new Error("Usage record is not reversible");return {...entitlement,usages:entitlement.usages.map(u=>u.id===usageId?{...u,status:"REVERSED",recordedBy,recordedAt:new Date().toISOString(),reason}:u)}}
