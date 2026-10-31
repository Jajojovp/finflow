export type Recurrence = { id:string;description:string;category:string;type:'ingreso'|'gasto';amount:number;financialType:string;behavior?:string;startDate:string;endDate:string|null;frequency:'weekly'|'monthly'|'yearly';interval:number;paused:boolean };
export type DebtPayment = {id:string;date:string;principal:number;interest:number;fee:number;rowIds:string[]};
export type Debt = {id:string;name:string;principal:number;startDate:string;dueDate:string|null;annualRate:number|null;payments:DebtPayment[]};
export type Valuation = {id:string;name:string;amount:number;valuedAt:string};
export type Due = {id:string;name:string;counterparty:string;direction:'receivable'|'payable';amount:number;dueDate:string;expectedDate:string|null;cancelled:boolean;cancelledAt:string|null;paymentRowIds:string[]};
export type PlanningData = {recurrences?:Recurrence[];debts?:Debt[];assets?:Valuation[];liabilities?:Valuation[];dues?:Due[];budgets?:Record<string,Record<string,number>>;alerts?:{enabled:boolean;frequency:'daily'|'weekly'|'always';lastReviewed?:string|null;dismissed?:Record<string,string>}};
