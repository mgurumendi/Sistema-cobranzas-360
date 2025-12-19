import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Users, DollarSign, Calendar, CheckCircle, XCircle, Search, 
  FileText, Save, User, ArrowLeft, Activity, Filter, CreditCard, 
  AlertCircle, TrendingUp, PieChart as PieIcon, Layers, ChevronRight, 
  Briefcase, Clock, Calculator, PlusCircle, MinusCircle, ClipboardList, 
  Upload, FileSpreadsheet, Trash2, Download, Printer, BarChart2, 
  Table as TableIcon, Settings, Bell, Calendar as CalendarIcon, 
  ListFilter, RefreshCw, UserPlus, X, Info, TrendingDown, Wallet, Target, AlertTriangle,
  Award // Nuevo icono para adjudicación
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  updateDoc, arrayUnion, serverTimestamp, deleteDoc, query
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- CONFIGURACIÓN Y CONSTANTES ---
const APP_VERSION = "2.11.0-EXEC-CARDS";
const DEFAULT_APP_ID = 'sistema-cobranzas-360-v2';

// Configuración de Firebase: Usa la del entorno si existe, sino la proporcionada
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyDT2SAo30U7mYaEE8gfYubu7C4KWxlFDhM",
      authDomain: "sistema-cobranzas-360.firebaseapp.com",
      projectId: "sistema-cobranzas-360",
      storageBucket: "sistema-cobranzas-360.firebasestorage.app",
      messagingSenderId: "256307009098",
      appId: "1:256307009098:web:fdb7c748e03a1c08a778b3"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Usar __app_id del entorno si está disponible para aislar datos en el editor
const appId = typeof __app_id !== 'undefined' ? __app_id : DEFAULT_APP_ID;

const KPI_META_ESTATICA = {
  mensual: 130329.83,
  carteraTotal: 1202683.84
};

// --- COMPONENTES DE APOYO ---

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000); // 6 segundos para leer errores
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-blue-600';

  return (
    <div className={`fixed bottom-6 right-6 ${bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[150] animate-fade-in-up border border-white/10`}>
      {type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1"><X className="h-4 w-4" /></button>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up border border-slate-200">
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Cancelar</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all">Sí, Borrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>)}
    </div>
    <div className="h-64 bg-slate-200 rounded-2xl w-full"></div>
  </div>
);

const ManualClientForm = ({ onClose, onSave, showNotify }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente: '', 
    cedula: '', 
    celular: '', 
    ejecutivo: 'Gianella',
    producto: 'Rastreo',
    monto: '',
    meses: '',
    fechaVencimiento: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validación de campos obligatorios
    if (!formData.cliente || !formData.monto || !formData.meses || !formData.fechaVencimiento) {
        showNotify("⚠️ Falta información obligatoria: Nombre, Monto, Meses o Fecha.", "error");
        setLoading(false);
        return;
    }
    
    const montoVal = parseFloat(formData.monto);
    const mesesVal = parseInt(formData.meses);

    // Validación numérica
    if (isNaN(montoVal) || isNaN(mesesVal) || mesesVal <= 0) {
        showNotify("⚠️ El Monto y los Meses deben ser números válidos mayores a 0.", "error");
        setLoading(false);
        return;
    }

    const cuotaVal = montoVal / mesesVal;

    // Extracción segura del día de pago
    let diaPago = '05'; // Valor por defecto seguro
    if (formData.fechaVencimiento) {
        const parts = formData.fechaVencimiento.split('-');
        if (parts.length === 3) diaPago = parts[2];
    }

    // Construcción de objeto seguro (Sanitización)
    const secureData = {
      cliente: formData.cliente || 'Sin Nombre',
      cedula: formData.cedula || '',
      celular: formData.celular || '',
      ejecutivo: formData.ejecutivo || 'Sin Asignar',
      grupo: 'FINANCIAMIENTO',
      ciudad: 'S/I',
      cuota: Number(cuotaVal.toFixed(2)), // Asegurar número con 2 decimales
      saldo: Number(montoVal.toFixed(2)),
      vencidas: 0,
      producto: formData.producto || 'Varios',
      montoTotal: Number(montoVal.toFixed(2)),
      plazoMeses: Number(mesesVal),
      fechaInicio: formData.fechaVencimiento,
      diaPago: diaPago,
      manualType: 'Financiamiento'
    };

    const success = await onSave(secureData);

    if (!success) setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex justify-between items-center text-white">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6" /> Nuevo Financiamiento</h3>
            <p className="text-blue-100 text-xs mt-1">Registro manual de contrato</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nombres Completos *</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Número de Cédula</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Teléfono</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ejecutivo</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.ejecutivo} onChange={e => setFormData({...formData, ejecutivo: e.target.value})}>
                    {["Gianella", "Fabiola", "Jordy", "Miguel"].map(e => <option key={e}>{e}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Producto</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" value={formData.producto} onChange={e => setFormData({...formData, producto: e.target.value})}>
                    <option>Rastreo</option>
                    <option>Seguro</option>
                    <option>Entrada del vehiculo</option>
                    <option>Seguro y Rastreo</option>
                    <option>Triple (Seguro, Rastreo y Entrada)</option>
                </select>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Monto Total *</label>
              <input type="number" step="0.01" required className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Meses Plazo *</label>
              <input type="number" required className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.meses} onChange={e => setFormData({...formData, meses: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase">Cuota Mensual</label>
               <div className="w-full p-2 font-black text-emerald-600 text-sm pt-3">
                 ${(formData.monto && formData.meses && formData.meses > 0) ? (parseFloat(formData.monto) / parseInt(formData.meses)).toFixed(2) : '0.00'}
               </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Fecha de Inicio / Vencimiento *</label>
            <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.fechaVencimiento} onChange={e => setFormData({...formData, fechaVencimiento: e.target.value})} />
            <p className="text-[10px] text-slate-400 pl-1 italic">El día seleccionado será la fecha máxima de pago mensual.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-2">
                {loading ? 'Guardando...' : 'Registrar Financiamiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTE DETALLE DE CLIENTE ---
const ClientDetailView = ({ client, onBack, onSavePayment, onAddComment, onSaveCommitment, onDeleteManual }) => {
  const [commentText, setCommentText] = useState('');
  const [managementWeek, setManagementWeek] = useState('Semana 1');
  const [managementDate, setManagementDate] = useState(new Date().toISOString().split('T')[0]);
  const [payQuotas, setPayQuotas] = useState(0);
  const [abonoValue, setAbonoValue] = useState('');
  const [commitmentDateInput, setCommitmentDateInput] = useState('');

  useEffect(() => {
    if (client) {
      setPayQuotas(client.cuotasPagadas || 0);
      setAbonoValue(client.abono || '');
      setCommitmentDateInput(client.commitmentDate || '');
    }
  }, [client?.id]);

  if (!client) return null;

  const totalRecaudoSimulado = (payQuotas * (client.cuota || 0)) + (parseFloat(abonoValue) || 0);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-20">
      <div className="flex justify-between items-center mb-8 no-print">
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold shadow-sm hover:shadow-md transition-all group">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Volver al Listado
        </button>
        {client.isManual && (
          <button onClick={() => onDeleteManual(client.id)} className="flex items-center gap-2 px-5 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold hover:bg-red-100 transition-all">
            <Trash2 className="h-5 w-5" /> Eliminar Registro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${client.pagado ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                     {client.pagado ? 'Gestionado' : 'Pendiente'}
                   </span>
                   {client.fechaAdjudicacion ? (
                     <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                       <Award className="h-3 w-3" /> Adjudicado: {client.fechaAdjudicacion}
                     </span>
                   ) : (
                     <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-500 border-slate-300">
                       No Adjudicado
                     </span>
                   )}
                   {client.isManual && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 border-purple-200">Financiamiento</span>}
                </div>
                <h1 className="text-3xl font-black text-slate-800 leading-tight">{client.cliente}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-slate-500">
                  <span className="flex items-center gap-1.5 text-sm font-medium bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm"><CreditCard className="h-4 w-4" /> {client.cedula || 'SIN ID'}</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm"><Users className="h-4 w-4" /> {client.ejecutivo}</span>
                  {client.diaPago && <span className="flex items-center gap-1.5 text-sm font-medium bg-purple-50 text-purple-700 px-3 py-1 rounded-lg border border-purple-100 shadow-sm"><Calendar className="h-4 w-4" /> Día de Pago: {client.diaPago}</span>}
                </div>
                {client.producto && <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Producto: {client.producto}</p>}
              </div>
              <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">Cuota Mensual</p>
                <p className="text-3xl font-black">${(client.cuota || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="p-8">
               <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Vencidas</p>
                    <p className={`text-3xl font-black ${client.vencidasActuales > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{client.vencidasActuales}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Recaudado</p>
                    <p className="text-3xl font-black text-emerald-600">${(client.montoPagadoTotal || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Saldo / Capital</p>
                    <p className="text-3xl font-black text-slate-800">${(client.saldoActual || 0).toLocaleString()}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="px-8 py-6 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-xl text-white"><DollarSign className="h-5 w-5" /></div>
              <h3 className="text-lg font-black text-slate-800">Módulo de Recaudación</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Pago de Cuotas Completas</label>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                  <button onClick={() => setPayQuotas(prev => Math.max(0, prev - 1))} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 transition-all shadow-sm"><MinusCircle className="h-6 w-6" /></button>
                  <div className="flex-1 text-center font-black text-3xl text-slate-800">{payQuotas}</div>
                  <button onClick={() => setPayQuotas(prev => prev + 1)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-emerald-500 transition-all shadow-sm"><PlusCircle className="h-6 w-6" /></button>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Abono o Ajuste ($)</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-blue-500">$</div>
                  <input type="number" placeholder="0.00" className="w-full pl-10 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl font-black text-2xl text-slate-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" value={abonoValue} onChange={e => setAbonoValue(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto a registrar</p>
                <p className="text-4xl font-black text-blue-600">${totalRecaudoSimulado.toFixed(2)}</p>
              </div>
              <button onClick={() => onSavePayment(client.id, payQuotas, parseFloat(abonoValue) || 0)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl shadow-blue-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                <Save className="h-6 w-6" /> Guardar Recaudación
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden no-print">
             <div className="px-6 py-5 bg-purple-50/50 border-b border-purple-100 flex items-center gap-3">
               <CalendarIcon className="h-5 w-5 text-purple-600" />
               <h3 className="font-black text-slate-800">Fecha Compromiso</h3>
             </div>
             <div className="p-6 space-y-4">
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all" value={commitmentDateInput} onChange={e => setCommitmentDateInput(e.target.value)} />
                <button onClick={() => onSaveCommitment(client.id, commitmentDateInput)} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all">Definir Alerta</button>
                {client.commitmentDate && (
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3 animate-pulse">
                    <span className="text-sm font-bold text-purple-700">Programado para: {new Date(client.commitmentDate).toLocaleDateString()}</span>
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col h-[520px]">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-black text-slate-800 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-slate-400" /> Bitácora de Gestión</h3>
               <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">{(client.comentarios || []).length} registros</span>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {(client.comentarios && client.comentarios.length > 0) ? (
                  [...client.comentarios].sort((a,b) => b.timestamp - a.timestamp).map((note, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">{note.week}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(note.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{note.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 text-center px-6">
                    <FileText className="h-12 w-12 mb-3 stroke-[1.5]" />
                    <p className="text-sm font-bold">No hay gestiones registradas aún.</p>
                  </div>
                )}
             </div>
             <div className="p-6 border-t border-slate-100 space-y-3 bg-white no-print">
                <div className="flex gap-2">
                  <select className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold" value={managementWeek} onChange={e => setManagementWeek(e.target.value)}>
                    {["Semana 1", "Semana 2", "Semana 3", "Semana 4", "Semana 5"].map(w => <option key={w}>{w}</option>)}
                  </select>
                  <input type="date" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold" value={managementDate} onChange={e => setManagementDate(e.target.value)} />
                </div>
                <div className="relative">
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all" rows="3" placeholder="Ingresar comentario de gestión..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                  <button disabled={!commentText.trim()} onClick={() => { onAddComment(client.id, commentText, managementWeek, managementDate); setCommentText(''); }} className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-0 transition-all"><Save className="h-5 w-5" /></button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); 
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [updates, setUpdates] = useState({});
  const [manualClients, setManualClients] = useState([]);
  const [baseData, setBaseData] = useState(INITIAL_BASE_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExecutive, setFilterExecutive] = useState('Todos');
  const [filterAlertType, setFilterAlertType] = useState('all');
  const [showManualForm, setShowManualForm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false); // Estado para el modal de borrado
  const [notification, setNotification] = useState(null);
  const [weeksConfig, setWeeksConfig] = useState(5);

  const fileInputRef = useRef(null);

  // Load XLSX library via CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth error:", e);
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const collectionsPath = ['artifacts', appId, 'public', 'data'];
    const updatesRef = collection(db, ...collectionsPath, 'cobranzas_live_v2');
    const unsubscribeUpdates = onSnapshot(updatesRef, (snap) => {
      const data = {};
      snap.forEach(d => data[d.id] = d.data());
      setUpdates(data);
    });
    const manualRef = collection(db, ...collectionsPath, 'cobranzas_manuales_v2');
    const unsubscribeManual = onSnapshot(manualRef, (snap) => {
      const data = [];
      snap.forEach(d => data.push({ ...d.data(), id: d.id }));
      setManualClients(data);
    });
    return () => {
      unsubscribeUpdates();
      unsubscribeManual();
    };
  }, [user]);

  const showNotify = (message, type = 'success') => setNotification({ message, type });

  const mergedData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const source = baseData; // Base importada
    const combined = [...source, ...manualClients]; // Combinar con manuales

    return combined.map(client => {
      if (!client) return null;
      const live = updates[client.id] || {};
      const cuota = parseFloat(client.cuota) || 0;
      const saldo = parseFloat(client.saldo) || 0;
      const vencidas = parseInt(client.vencidas) || 0;
      const cuotasPagadas = parseInt(live.cuotasPagadas) || 0;
      const abono = parseFloat(live.abono) || 0;
      const totalPagado = (cuotasPagadas * cuota) + abono;
      const comments = Array.isArray(live.comentarios) ? live.comentarios : [];
      const hasGestion = totalPagado > 0 || comments.length > 0;
      const commitmentDate = live.commitmentDate || null;
      let alertStatus = 'none';
      if (commitmentDate && totalPagado === 0) {
        if (commitmentDate < today) alertStatus = 'overdue';
        else if (commitmentDate === today) alertStatus = 'today';
        else alertStatus = 'future';
      }
      return {
        ...client,
        id: client.id,
        pagado: hasGestion,
        gestionado: hasGestion,
        cuotasPagadas,
        abono,
        montoPagadoTotal: totalPagado,
        comentarios: comments,
        vencidasActuales: Math.max(0, vencidas - cuotasPagadas),
        saldoActual: saldo - totalPagado,
        commitmentDate,
        alertStatus,
        lastUpdate: live.updatedAt ? new Date(live.updatedAt.seconds * 1000).toISOString() : null
      };
    }).filter(Boolean);
  }, [updates, baseData, manualClients]);

  const selectedClient = useMemo(() => {
    return mergedData.find(c => c.id === selectedClientId) || null;
  }, [mergedData, selectedClientId]);

  // --- LÓGICA DE BORRADO CON MODAL ---
  const handleClearBaseClick = () => {
    setShowClearConfirm(true); // Abre el modal
  };

  const confirmClearBase = () => {
    setBaseData([]); // Borra solo los datos del CSV local
    setShowClearConfirm(false); // Cierra el modal
    showNotify("Base de datos importada eliminada correctamente. Registros manuales conservados.", "success");
  };

  const handleSavePayment = async (clientId, numCuotas, abono) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_live_v2', clientId);
    try {
      await setDoc(docRef, { cuotasPagadas: numCuotas, abono, updatedAt: serverTimestamp() }, { merge: true });
      showNotify("Pago actualizado exitosamente");
    } catch (e) { showNotify("Error de sincronización", "error"); }
  };

  const handleAddComment = async (clientId, text, week, date) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_live_v2', clientId);
    const comment = { text, week, date: new Date(date).toISOString(), author: "Gestor", timestamp: Date.now() };
    try {
      await setDoc(docRef, { comentarios: arrayUnion(comment), updatedAt: serverTimestamp() }, { merge: true });
      showNotify("Comentario registrado");
    } catch (e) { showNotify("Error de conexión", "error"); }
  };

  const handleSaveCommitment = async (clientId, date) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_live_v2', clientId);
    try {
      await setDoc(docRef, { commitmentDate: date, updatedAt: serverTimestamp() }, { merge: true });
      showNotify("Alerta programada");
    } catch (e) { showNotify("Error al guardar", "error"); }
  };

  const handleSaveManualClient = async (data) => {
    if (!user) {
        showNotify("Error: Usuario no autenticado. Recargue la página.", "error");
        return false;
    }

    const newId = `M-${Date.now()}`;
    // Usamos el ID de la app correctamente en la ruta
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_manuales_v2', newId);
    
    try {
      // Nos aseguramos de que el objeto data esté limpio (sin undefined)
      const cleanData = JSON.parse(JSON.stringify(data));
      
      await setDoc(docRef, { 
          ...cleanData, 
          id: newId, 
          isManual: true, 
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp() 
      });
      setShowManualForm(false);
      showNotify("Cliente de financiamiento creado exitosamente");
      return true;
    } catch (e) { 
        console.error("Error saving manual client:", e);
        showNotify(`Error al guardar: ${e.message}`, "error"); 
        return false;
    }
  };

  const handleDeleteManualClient = async (id) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_manuales_v2', id);
    try {
      await deleteDoc(docRef);
      setSelectedClientId(null);
      setView('list');
      showNotify("Registro borrado");
    } catch (e) { showNotify("Error al eliminar", "error"); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Helper para procesar headers y filas de datos
    const processData = (headers, dataRows) => {
         const getIdx = (keywords) => headers.findIndex(h => keywords.some(k => h && String(h).toUpperCase().includes(k)));
         
         const idx = {
            id: getIdx(['ID', 'CODIGO', 'CÓDIGO']),
            cliente: getIdx(['CLIENTE', 'NOMBRE']),
            ejecutivo: getIdx(['EJECUTIVO', 'GESTOR']),
            cuota: getIdx(['CUOTA', 'CUOTA MENSUAL', 'MENSUAL']),
            vencidas: getIdx(['VENCIDAS']),
            saldo: getIdx(['SALDO']),
            celular: getIdx(['CELULAR']),
            cedula: getIdx(['CEDULA', 'CÉDULA', 'RUC']),
            grupo: getIdx(['GRUPO']),
            ciudad: getIdx(['CIUDAD']),
            puesto: getIdx(['PUESTO']),
            fechaAdjudicacion: getIdx(['ADJUDICACION', 'FECHA DE ADJUDICACION', 'F. ADJUDICACION', 'ADJUDICADO'])
         };

         return dataRows.map((row, i) => {
             const getVal = (i) => i !== -1 && row[i] !== undefined ? row[i] : '';
             
             // Mejorada: Función segura para limpiar y parsear números con formato de moneda (ej: "$ 1,200.00")
             const parseNum = (val) => {
                 if (typeof val === 'number') return val;
                 if (!val) return 0;
                 // Elimina todo excepto números, puntos y signo menos.
                 // Esto arregla el problema de "$ 250.00" siendo leído como NaN
                 const clean = String(val).replace(/[^0-9.-]/g, ''); 
                 return parseFloat(clean) || 0;
             };

             return {
                 id: idx.id !== -1 ? String(getVal(idx.id)) : `R-${i}`,
                 cliente: idx.cliente !== -1 ? String(getVal(idx.cliente)).toUpperCase() : 'S/N',
                 ejecutivo: idx.ejecutivo !== -1 ? String(getVal(idx.ejecutivo)) : 'Sin Asignar',
                 cuota: idx.cuota !== -1 ? parseNum(getVal(idx.cuota)) : 0,
                 vencidas: idx.vencidas !== -1 ? (typeof getVal(idx.vencidas) === 'number' ? getVal(idx.vencidas) : parseInt(getVal(idx.vencidas)) || 0) : 0,
                 saldo: idx.saldo !== -1 ? parseNum(getVal(idx.saldo)) : 0,
                 celular: idx.celular !== -1 ? String(getVal(idx.celular)) : '',
                 cedula: idx.cedula !== -1 ? String(getVal(idx.cedula)) : '',
                 grupo: idx.grupo !== -1 ? String(getVal(idx.grupo)) : 'GEN',
                 ciudad: idx.ciudad !== -1 ? String(getVal(idx.ciudad)) : 'S/I',
                 puesto: idx.puesto !== -1 ? String(getVal(idx.puesto)) : '0',
                 fechaAdjudicacion: idx.fechaAdjudicacion !== -1 ? String(getVal(idx.fechaAdjudicacion)) : ''
             };
         }).filter(Boolean);
    };

    if (file.name.endsWith('.csv')) {
        // Lógica CSV Existente
        const reader = new FileReader();
        reader.onload = (evt) => {
             try {
                const text = evt.target.result;
                const lines = text.split(/\r?\n/).filter(line => line.trim());
                if (lines.length < 1) return;
                
                const headers = lines[0].split(',').map(h => h.trim().toUpperCase().replace(/"/g, ''));
                const dataRows = lines.slice(1).map(line => line.split(',').map(c => c.trim().replace(/"/g, '')));
                
                const parsed = processData(headers, dataRows);
                if (parsed.length > 0) {
                    setBaseData(parsed);
                    showNotify(`Base CSV cargada: ${parsed.length} registros`);
                }
             } catch (err) {
                showNotify("Error de formato en CSV", "error");
             }
        };
        reader.readAsText(file);
    } else if (file.name.match(/\.(xls|xlsx)$/)) {
        // Lógica Excel (.xls, .xlsx) usando SheetJS
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                if (!window.XLSX) {
                    showNotify("La librería Excel se está cargando... intente en 5 segundos.", "error");
                    return;
                }
                const data = evt.target.result;
                const workbook = window.XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array de arrays

                if (jsonData.length === 0) {
                     showNotify("El archivo Excel está vacío", "error");
                     return;
                }

                const headers = jsonData[0].map(h => String(h).trim().toUpperCase());
                const dataRows = jsonData.slice(1);
                
                const parsed = processData(headers, dataRows);
                 if (parsed.length > 0) {
                     setBaseData(parsed);
                     showNotify(`Base Excel cargada: ${parsed.length} registros`);
                 } else {
                     showNotify("No se encontraron registros válidos en el Excel", "error");
                 }

            } catch(e) {
                console.error(e);
                showNotify("Error al procesar el archivo Excel. Verifique el formato.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        showNotify("Formato no soportado. Use .csv, .xls o .xlsx", "error");
    }
  };

  const handleExportExcel = () => {
    const tableRows = mergedData.map(c => `
      <tr>
        <td style="mso-number-format:'@'">${c.id}</td>
        <td>${c.cliente}</td>
        <td>${c.ejecutivo}</td>
        <td style="mso-number-format:'0.00'">${c.cuota.toFixed(2)}</td>
        <td>${c.vencidasActuales}</td>
        <td style="mso-number-format:'0.00'">${c.montoPagadoTotal.toFixed(2)}</td>
        <td style="mso-number-format:'0.00'">${c.saldoActual.toFixed(2)}</td>
        <td>${c.gestionado ? 'Gestionado' : 'Pendiente'}</td>
        <td>${c.fechaAdjudicacion ? 'ADJUDICADO' : 'NO ADJUDICADO'}</td>
        <td>${c.fechaAdjudicacion || ''}</td>
        <td>${c.commitmentDate || ''}</td>
        <td>${(c.comentarios || []).map(com => `[${com.date.split('T')[0]}] ${com.text}`).join(' | ')}</td>
      </tr>
    `).join('');

    const tableContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #1f4e78; color: white; border: 1px solid #000; padding: 10px; font-weight: bold; text-align: center; }
          td { border: 1px solid #ccc; padding: 5px; vertical-align: top; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>CLIENTE</th>
              <th>EJECUTIVO</th>
              <th>CUOTA ($)</th>
              <th>VENCIDAS</th>
              <th>RECAUDADO ($)</th>
              <th>SALDO ($)</th>
              <th>ESTADO</th>
              <th>ADJUDICACIÓN</th>
              <th>FECHA ADJ.</th>
              <th>FECHA COMPROMISO</th>
              <th>HISTORIAL GESTIÓN</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Reporte_Gestion_${new Date().toISOString().split('T')[0]}.xls`; // Extensión .xls
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- LOGICA DEL DASHBOARD ---

  const renderDashboard = () => {
    const totalRecaudado = mergedData.reduce((acc, curr) => acc + curr.montoPagadoTotal, 0);
    const totalVencidoPorCobrar = mergedData.reduce((acc, curr) => acc + (curr.cuota * curr.vencidasActuales), 0);
    
    // KPI NUEVO: Total Financiamiento
    const totalFinanciamiento = mergedData
      .filter(c => c.isManual)
      .reduce((acc, curr) => acc + (curr.saldoActual || 0), 0);

    // Lista de ejecutivos solicitada
    const targetExecutives = ["Gianella", "Fabiola", "Jordy", "Miguel"];
    const weeks = Array.from({length: weeksConfig}, (_, i) => `Semana ${i + 1}`);

    // Inicializar matrices de datos
    const matrixGestion = {}; 
    const matrixRevenue = {}; 

    targetExecutives.forEach(exec => {
      matrixGestion[exec] = { total: 0 };
      matrixRevenue[exec] = { total: 0 };
      weeks.forEach(w => {
        matrixGestion[exec][w] = 0;
        matrixRevenue[exec][w] = 0;
      });
    });

    // Procesar datos para las matrices
    mergedData.forEach(client => {
      const exec = targetExecutives.find(e => client.ejecutivo.includes(e)) || "Otros";
      if (!matrixGestion[exec]) {
          matrixGestion[exec] = { total: 0 };
          matrixRevenue[exec] = { total: 0 };
          weeks.forEach(w => { matrixGestion[exec][w] = 0; matrixRevenue[exec][w] = 0; });
      }

      // Conteo de gestiones (comentarios por semana)
      if (client.comentarios && client.comentarios.length > 0) {
        const clientWeeks = new Set(client.comentarios.map(c => c.week || 'Semana 1'));
        clientWeeks.forEach(w => {
          if (matrixGestion[exec][w] !== undefined) matrixGestion[exec][w]++;
        });
        matrixGestion[exec].total++;
      }

      // Monto recaudado (basado en la fecha de actualización si hay pago)
      if (client.montoPagadoTotal > 0 && client.lastUpdate) {
        const pDate = new Date(client.lastUpdate);
        const day = pDate.getDate();
        let weekTag = 'Semana 1';
        if (day > 7 && day <= 14) weekTag = 'Semana 2';
        else if (day > 14 && day <= 21) weekTag = 'Semana 3';
        else if (day > 21 && day <= 28) weekTag = 'Semana 4';
        else if (day > 28) weekTag = 'Semana 5';
        
        if (matrixRevenue[exec][weekTag] !== undefined) {
          matrixRevenue[exec][weekTag] += client.montoPagadoTotal;
          matrixRevenue[exec].total += client.montoPagadoTotal;
        }
      }
    });

    // Preparar datos para gráficos comparativos
    const revenueChartData = weeks.map(w => ({
      name: w,
      ...targetExecutives.reduce((acc, e) => ({ ...acc, [e]: matrixRevenue[e][w] }), {})
    }));

    const gestionChartData = weeks.map(w => ({
      name: w,
      ...targetExecutives.reduce((acc, e) => ({ ...acc, [e]: matrixGestion[e][w] }), {})
    }));

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return (
      <div className="space-y-10 animate-fade-in pb-20">
        {/* Banner Superior */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full"></div>
          <div className="relative z-10">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h2 className="text-4xl font-black tracking-tight flex items-center gap-3">
                    <Target className="h-10 w-10 text-blue-400" /> Rendimiento de Equipo
                  </h2>
                  <p className="text-blue-200/60 mt-2 font-bold uppercase tracking-widest text-xs">
                    Análisis comparativo de productividad y recaudación
                  </p>
                </div>
                <div className="flex items-center gap-4 no-print">
                  <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                    <Settings className="h-4 w-4 text-white/50" />
                    <select className="bg-transparent text-sm font-bold border-none outline-none focus:ring-0 cursor-pointer" value={weeksConfig} onChange={e => setWeeksConfig(parseInt(e.target.value))}>
                      <option value={4} className="text-slate-800">Cerrar en Semana 4</option>
                      <option value={5} className="text-slate-800">Cerrar en Semana 5</option>
                    </select>
                  </div>
                  <button onClick={() => window.print()} className="bg-white text-blue-900 px-6 py-4 rounded-3xl font-black flex items-center gap-2 hover:bg-blue-50 transition-all shadow-xl shadow-blue-500/20">
                    <Printer className="h-5 w-5" /> Imprimir Análisis
                  </button>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors">
                  <p className="text-xs font-bold text-blue-200/50 uppercase mb-1">Recaudado (Efectivo)</p>
                  <p className="text-3xl font-black text-emerald-400">${totalRecaudado.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <div className="bg-white/10 border border-blue-400/30 p-6 rounded-[2rem] shadow-xl shadow-blue-500/10 ring-1 ring-white/10">
                  <p className="text-xs font-bold text-blue-300 uppercase mb-1">Total por Recaudar (Vencido)</p>
                  <p className="text-3xl font-black text-white">${totalVencidoPorCobrar.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                
                {/* NUEVO KPI: Cartera Financiamiento */}
                <div className="bg-white/10 border border-purple-400/30 p-6 rounded-[2rem] shadow-xl shadow-purple-500/10 ring-1 ring-white/10">
                  <p className="text-xs font-bold text-purple-200 uppercase mb-1">Cartera Financiamiento</p>
                  <p className="text-3xl font-black text-white">${totalFinanciamiento.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors">
                  <p className="text-xs font-bold text-blue-200/50 uppercase mb-1">Meta Alcanzada</p>
                  <p className="text-3xl font-black">{((totalRecaudado / KPI_META_ESTATICA.mensual) * 100).toFixed(1)}%</p>
                </div>
             </div>
          </div>
        </div>

        {/* --- MATRICES DE RENDIMIENTO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Gráfico Gestión */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-600" /> Casos Gestionados por Ejecutivo</h3>
                <span className="text-[10px] font-black text-blue-400 uppercase bg-blue-50 px-3 py-1 rounded-full">Casos Únicos / Semanales</span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gestionChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                    <Legend iconType="circle" />
                    {targetExecutives.map((exec, idx) => (
                      <Bar key={exec} dataKey={exec} fill={COLORS[idx % 4]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Gráfico Recaudación */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-600" /> Recaudación por Ejecutivo ($)</h3>
                <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-50 px-3 py-1 rounded-full">Flujo de Caja / Semanal</span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                    <Legend iconType="circle" />
                    {targetExecutives.map((exec, idx) => (
                      <Bar key={exec} dataKey={exec} fill={COLORS[idx % 4]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* --- TABLAS DE DETALLE (MATRICES SOLICITADAS) --- */}
        <div className="space-y-8">
          {/* Matriz 1: Recaudación */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-emerald-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" /> Matriz de Recaudación por Ejecutivo ($)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-50/30">
                    <th className="px-8 py-5 font-black text-emerald-800 uppercase text-[10px] tracking-widest text-left">Ejecutivo</th>
                    {weeks.map(w => <th key={w} className="px-6 py-5 font-black text-emerald-800 uppercase text-[10px] tracking-widest text-center">{w}</th>)}
                    <th className="px-8 py-5 font-black text-emerald-900 uppercase text-[10px] tracking-widest text-right bg-emerald-100/50">Total Mes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {targetExecutives.map(exec => (
                    <tr key={exec} className="hover:bg-emerald-50/10 transition-colors">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black uppercase">{exec.substring(0,2)}</div>
                            <span className="font-bold text-slate-700">{exec}</span>
                         </div>
                      </td>
                      {weeks.map(w => (
                        <td key={w} className="px-6 py-5 text-center font-bold text-slate-600">
                          {matrixRevenue[exec][w] > 0 ? `$${matrixRevenue[exec][w].toLocaleString()}` : "-"}
                        </td>
                      ))}
                      <td className="px-8 py-5 text-right font-black text-emerald-700 bg-emerald-50/50">
                        ${matrixRevenue[exec].total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-600 text-white font-black">
                     <td className="px-8 py-5 uppercase tracking-tighter">Total Ingresos de Red</td>
                     {weeks.map(w => {
                       const totalW = targetExecutives.reduce((sum, e) => sum + matrixRevenue[e][w], 0);
                       return <td key={w} className="px-6 py-5 text-center">${totalW.toLocaleString()}</td>
                     })}
                     <td className="px-8 py-5 text-right font-black text-xl">${totalRecaudado.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Matriz 2: Gestiones */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <TableIcon className="h-5 w-5 text-blue-600" /> Matriz de Productividad (Casos Atendidos)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest text-left">Ejecutivo</th>
                    {weeks.map(w => <th key={w} className="px-6 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">{w}</th>)}
                    <th className="px-8 py-5 font-black text-blue-600 uppercase text-[10px] tracking-widest text-right bg-blue-50/50">Consolidado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {targetExecutives.map(exec => (
                    <tr key={exec} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-700">{exec}</td>
                      {weeks.map(w => (
                        <td key={w} className="px-6 py-5 text-center">
                          {matrixGestion[exec][w] > 0 ? (
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black text-xs">
                              {matrixGestion[exec][w]}
                            </span>
                          ) : <span className="text-slate-200">-</span>}
                        </td>
                      ))}
                      <td className="px-8 py-5 text-right font-black text-blue-700 bg-blue-50/30">{matrixGestion[exec].total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClientList = () => {
    // Si la vista es 'financing', solo mostramos clientes manuales
    const isFinancingView = view === 'financing';
    
    const filtered = mergedData.filter(c => {
      // Filtro de Vista (Tag)
      if (isFinancingView && !c.isManual) return false;
      if (!isFinancingView && view === 'list' && c.isManual) return false; // En cartera normal no mostramos manuales (opcional, según preferencia)
      
      // Filtro de Ejecutivo (NUEVO)
      if (filterExecutive !== 'Todos' && !c.ejecutivo.includes(filterExecutive)) return false;

      // Filtro de Buscador
      const matchSearch = c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchSearch;
    });

    return (
      <div className="space-y-6 animate-fade-in h-[calc(100vh-200px)] flex flex-col">
        
        {/* Executive Tabs/Cards Row */}
        <div className="flex overflow-x-auto pb-2 gap-3 no-print scrollbar-hide">
            <button 
                onClick={() => setFilterExecutive('Todos')}
                className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] border transition-all min-w-[160px] cursor-pointer group ${filterExecutive === 'Todos' ? 'bg-slate-800 text-white border-slate-800 shadow-xl shadow-slate-200' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:shadow-md'}`}
            >
                <div className={`p-2 rounded-full ${filterExecutive === 'Todos' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-50'}`}><Users className="h-5 w-5" /></div>
                <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Equipo</p>
                    <p className="font-black text-lg leading-none">Todos</p>
                </div>
            </button>

            {["Gianella", "Fabiola", "Jordy", "Miguel"].map(exec => {
                // Quick count
                const count = mergedData.filter(c => c.ejecutivo.includes(exec)).length;
                const isActive = filterExecutive === exec;
                return (
                    <button 
                        key={exec}
                        onClick={() => setFilterExecutive(exec)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] border transition-all min-w-[160px] cursor-pointer group ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200 scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:shadow-md'}`}
                    >
                        <div className={`p-2 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-50'}`}><User className="h-5 w-5" /></div>
                        <div className="text-left">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>Ejecutivo</p>
                            <p className="font-black text-lg leading-none">{exec}</p>
                        </div>
                        <span className={`ml-auto text-xs font-black px-2 py-1 rounded-lg ${isActive ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{count}</span>
                    </button>
                )
            })}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center no-print">
          {/* Search Input (Full width now since drop down is gone) */}
          <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 flex-1 w-full">
            <Search className="h-5 w-5 text-slate-400" />
            <input className="bg-transparent border-none outline-none w-full text-slate-700 font-medium" placeholder="Buscar por nombre, ID o cédula..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2 w-full md:w-auto">
             <button onClick={() => setShowManualForm(true)} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"><PlusCircle className="h-5 w-5" /> Nuevo</button>
             <button onClick={handleExportExcel} className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"><Download className="h-5 w-5" /> Reporte Excel</button>
             <input type="file" accept=".csv, .xls, .xlsx" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
             <button onClick={() => fileInputRef.current.click()} className="flex-1 bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"><Upload className="h-5 w-5" /> Subir Base</button>
             {baseData.length > 0 && (
                <button onClick={handleClearBaseClick} className="flex-1 bg-red-100 text-red-600 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-200 transition-all"><Trash2 className="h-5 w-5" /> Borrar Base</button>
             )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md z-10">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Cuota</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Vencidas</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Monto Vencido</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => { setSelectedClientId(c.id); setView('detail'); }} className="group hover:bg-slate-50/50 cursor-pointer transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${c.gestionado ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-300'}`}></div>
                        <span className={`text-[10px] font-black uppercase ${c.gestionado ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {c.gestionado ? 'Gestionado' : 'Pendiente'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{c.cliente}</p>
                         {c.fechaAdjudicacion && (
                           <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-blue-100 flex items-center gap-1">
                             <Award className="h-3 w-3" /> Adjudicado
                           </span>
                         )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{c.id}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{c.ejecutivo}</span>
                        {c.isManual && <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded uppercase">MANUAL</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-700">${(c.cuota || 0).toFixed(2)}</td>
                    <td className="px-6 py-5 text-center">
                       <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${c.vencidasActuales > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {c.vencidasActuales}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-900">
                        ${(c.cuota * c.vencidasActuales).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAlerts = () => {
    const alerted = mergedData.filter(c => c.commitmentDate);
    return (
      <div className="space-y-6 animate-fade-in">
         <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
           <h2 className="text-2xl font-black text-slate-800">Centro de Monitoreo</h2>
           <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
             {['all', 'overdue', 'today'].map(type => (
               <button key={type} onClick={() => setFilterAlertType(type)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${filterAlertType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                 {type === 'all' ? 'Todos' : type === 'overdue' ? 'Vencidos' : 'Hoy'}
               </button>
             ))}
           </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {alerted.map(c => (
             <div key={c.id} onClick={() => { setSelectedClientId(c.id); setView('detail'); }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                {c.alertStatus === 'overdue' && <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">Vencido</div>}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Calendar className="h-5 w-5" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Compromiso</p>
                    <p className="font-black text-slate-800">{new Date(c.commitmentDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <h4 className="font-black text-lg text-slate-800 mb-1 truncate">{c.cliente}</h4>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                   <p className="text-xl font-black text-slate-800">${(c.vencidasActuales * c.cuota).toLocaleString()}</p>
                   <ChevronRight className="h-5 w-5 text-blue-600" />
                </div>
             </div>
           ))}
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[50] no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
           <div className="flex items-center gap-4">
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20"><Activity className="h-6 w-6" /></div>
             <div>
               <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">COBRANZAS 360</h1>
               <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Intelligence Platform v{APP_VERSION}</p>
             </div>
           </div>
           <div className="hidden md:flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
             {[
               {id: 'dashboard', icon: Activity, label: 'Dashboard'},
               {id: 'list', icon: Users, label: 'Cartera'},
               {id: 'financing', icon: Wallet, label: 'Financiamiento'}, // NUEVO TAG
               {id: 'alerts', icon: Bell, label: 'Alertas'}
             ].map(item => (
               <button key={item.id} onClick={() => setView(item.id)} className={`px-6 py-2.5 rounded-[1rem] text-xs font-black uppercase transition-all flex items-center gap-2 ${view === item.id ? 'bg-white text-blue-600 shadow-md shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>
                 <item.icon className="h-4 w-4" /> {item.label}
               </button>
             ))}
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? <SkeletonLoader /> : (
          <>
            {view === 'dashboard' && renderDashboard()}
            {(view === 'list' || view === 'financing') && renderClientList()}
            {view === 'alerts' && renderAlerts()}
            {view === 'detail' && <ClientDetailView client={selectedClient} onBack={() => setView('list')} onSavePayment={handleSavePayment} onAddComment={handleAddComment} onSaveCommitment={handleSaveCommitment} onDeleteManual={handleDeleteManualClient} />}
          </>
        )}
      </main>

      {showManualForm && <ManualClientForm onClose={() => setShowManualForm(false)} onSave={handleSaveManualClient} showNotify={showNotify} />}
      {notification && <Notification {...notification} onClose={() => setNotification(null)} />}
      
      <ConfirmationModal 
        isOpen={showClearConfirm} 
        onClose={() => setShowClearConfirm(false)} 
        onConfirm={confirmClearBase} 
        title="¿Borrar Base Importada?" 
        message="Esta acción eliminará todos los datos cargados desde el archivo CSV. Los registros de financiamiento manual NO se verán afectados. ¿Desea continuar?" 
      />
    </div>
  );
}

const INITIAL_BASE_DATA = [
  { id: "0101ACV001003", grupo: "ACV001", puesto: "3", cliente: "MUÑOZ LOZADA MARIA IVONNE", celular: "0969541591", cuota: 250, vencidas: 3, saldo: 6000, cedula: "0930440896", ejecutivo: "Gianella", ciudad: "GUAYAQUIL", fechaAdjudicacion: "" },
  { id: "0101ADP005053", grupo: "ADP005", puesto: "53", cliente: "PAZ MIRALLA RAMON AURELIO", celular: "0959637842", cuota: 277, vencidas: 11, saldo: 5148, cedula: "0906516463", ejecutivo: "Fabiola", ciudad: "GUAYAQUIL", fechaAdjudicacion: "2023-10-15" },
  { id: "0101ADP005103", grupo: "ADP005", puesto: "103", cliente: "REYES SANTANA ELIO DEMECIO", celular: "0991413550", cuota: 167, vencidas: 0, saldo: 7332, cedula: "0912813714", ejecutivo: "Jordy", ciudad: "GUAYAQUIL", fechaAdjudicacion: "" },
  { id: "0101ACV001008", grupo: "ACV001", puesto: "8", cliente: "RAMIREZ CORDOVA SERGIO ENRIQUE", celular: "0985965387", cuota: 250, vencidas: 3, saldo: 5500, cedula: "0912141553", ejecutivo: "Miguel", ciudad: "GUAYAQUIL", fechaAdjudicacion: "2023-11-20" }
];