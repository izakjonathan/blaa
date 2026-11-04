'use client';
export default function PeriodTime({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
 const [date='',time='04:00']=value.split('T');
 return <div className="stock-period-boundary" role="group" aria-label={label}><h3>{label}</h3><div className="stock-date-time"><label>Date<input type="date" value={date} onChange={e=>onChange(e.target.value?e.target.value+'T'+(time||'04:00'):'')}/></label><label>Time<input type="time" value={time} onChange={e=>onChange(date?date+'T'+e.target.value:'')}/></label></div></div>;
}
