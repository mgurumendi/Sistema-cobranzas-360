import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, DollarSign, Calendar, CheckCircle, XCircle, Search, 
  FileText, Save, User, ArrowLeft, Activity, Filter, CreditCard, AlertCircle, TrendingUp, PieChart as PieIcon, Layers, ChevronRight, Briefcase, Clock, Calculator, PlusCircle, MinusCircle, ClipboardList, Upload, FileSpreadsheet, Trash2, Download, Printer, BarChart2, Table as TableIcon, Settings, Bell, Calendar as CalendarIcon, ListFilter, RefreshCw, UserPlus, X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  updateDoc, arrayUnion, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- CONFIGURACIÓN FIREBASE ---
// ⚠️ REEMPLAZA ESTOS VALORES CON LOS DE TU CONSOLA DE FIREBASE
const firebaseConfig = {
   apiKey: "AIzaSyD6_6DCaB-n0K2akPct1gBIZucQZVNVmZI",
  authDomain: "cobranzas-360-web.firebaseapp.com",
  projectId: "cobranzas-360-web",
  storageBucket: "cobranzas-360-web.firebasestorage.app",
  messagingSenderId: "795609253006",
  appId: "1:795609253006:web:b447d8a3a0161ad213b5df",
  measurementId: "G-E7GN3J6CVZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'cobranzas-app-v1'; // Nombre interno para la colección

// --- DATOS MAESTROS INICIALES ---
const KPI_META = {
  mensual: 130329.83, 
  recaudadoReal: 28814.40,
  carteraTotal: 1202683.84, 
  semanal: [
    { semana: 'Semana 1', meta: 32582.46, real: 15648.50 },
    { semana: 'Semana 2', meta: 32582.46, real: 13166.40 },
    { semana: 'Semana 3', meta: 32582.46, real: 0 },
    { semana: 'Semana 4', meta: 21721.64, real: 0 },
    { semana: 'Semana 5', meta: 10860.82, real: 0 },
  ]
};

const INFO_GRUPOS = [
  { name: 'ACV', value: 55, cartera: 118711.84, color: '#3b82f6' }, 
  { name: 'ADP', value: 188, cartera: 1083972.00, color: '#10b981' }, 
];

const INITIAL_BASE_DATA = [
  // --- GIANELLA ---
  { id: "0101ACV001003", grupo: "ACV001", puesto: 3, cliente: "MUÑOZ LOZADA MARIA IVONNE", celular: "0969541591", cuota: 250, vencidas: 3, saldo: 6000, cedula: "0930440896", ejecutivo: "Gianella", ciudad: "GUAYAQUIL" },
  { id: "0101ADP005053", grupo: "ADP005", puesto: 53, cliente: "PAZ MIRALLA RAMON AURELIO", celular: "0959637842", cuota: 277, vencidas: 11, saldo: 5148, cedula: "0906516463", ejecutivo: "Gianella", ciudad: "GUAYAQUIL" },
  { id: "0101ADP005103", grupo: "ADP005", puesto: 103, cliente: "REYES SANTANA ELIO DEMECIO", celular: "0991413550", cuota: 167, vencidas: 0, saldo: 7332, cedula: "0912813714", ejecutivo: "Gianella", ciudad: "GUAYAQUIL" },
  { id: "0101ACV003045", grupo: "ACV003", puesto: 45, cliente: "PEREZ ZAMBRANO JOSE LUIS", celular: "0987654321", cuota: 300, vencidas: 2, saldo: 4500, cedula: "0918273645", ejecutivo: "Gianella", ciudad: "GUAYAQUIL" },
  
  // --- MIGUEL ---
  { id: "0101ACV001008", grupo: "ACV001", puesto: 8, cliente: "RAMIREZ CORDOVA SERGIO ENRIQUE", celular: "0985965387", cuota: 250, vencidas: 3, saldo: 5500, cedula: "0912141553", ejecutivo: "Miguel", ciudad: "GUAYAQUIL" },
  { id: "0101ADP005096", grupo: "ADP005", puesto: 96, cliente: "BURGOS VEGA JULIO CESAR", celular: "0999772794", cuota: 312, vencidas: 11, saldo: 22144, cedula: "0913142907", ejecutivo: "Miguel", ciudad: "GUAYAQUIL" },
  { id: "0101ADP005102", grupo: "ADP005", puesto: 102, cliente: "QUIMIS PINCAY ROBERTO CARLOS", celular: "0999009604", cuota: 182, vencidas: 0, saldo: 8918, cedula: "0915288013", ejecutivo: "Miguel", ciudad: "GUAYAQUIL" },
  { id: "0101ADP005125", grupo: "ADP005", puesto: 125, cliente: "HERNANDEZ CHALEN MARIA LORENA", celular: "0997053351", cuota: 343, vencidas: 0, saldo: 15092, cedula: "0912064680", ejecutivo: "Miguel", ciudad: "GUAYAQUIL" },
  
  // --- JORDY ---
  { id: "0101ADP001015", grupo: "ADP001", puesto: 15, cliente: "PACHECO ALARCON RONALD ANDRES", celular: "0969027947", cuota: 312, vencidas: 11, saldo: 3432, cedula: "0952603884", ejecutivo: "Jordy", ciudad: "GUAYAQUIL" },
  { id: "0101ADP001018", grupo: "ADP001", puesto: 18, cliente: "CUENCA CALLE MIGUEL ROBERTO", celular: "0910562222", cuota: 359, vencidas: 5, saldo: 1795, cedula: "0910562222", ejecutivo: "Jordy", ciudad: "GUAYAQUIL" },
  { id: "0101ADP001034", grupo: "ADP001", puesto: 34, cliente: "PARDO LOPEZ JONATHAN EMANUEL", celular: "0960449137", cuota: 173, vencidas: 11, saldo: 1903, cedula: "0706244423", ejecutivo: "Jordy", ciudad: "GUAYAQUIL" },
  
  // --- FABIOLA ---
  { id: "0101ADP005124", grupo: "ADP005", puesto: 124, cliente: "BOHORQUEZ BAZAN ALEJANDRO ULPIANO", celular: "0967870830", cuota: 281, vencidas: 0, saldo: 15455, cedula: "0907640916", ejecutivo: "Fabiola", ciudad: "GUAYAQUIL" },
  { id: "0101ACV002012", grupo: "ACV002", puesto: 12, cliente: "LOPEZ GARCIA ANA MARIA", celular: "0991234567", cuota: 220, vencidas: 1, saldo: 4000, cedula: "0911223344", ejecutivo: "Fabiola", ciudad: "QUITO" },
  { id: "0101ACV005016", grupo: "ACV005", puesto: 16, cliente: "ZAMBRANO VERA LUIS ALBERTO", celular: "0998877665", cuota: 265, vencidas: 2, saldo: 5616, cedula: "1304567890", ejecutivo: "Fabiola", ciudad: "GUAYAQUIL" }
];

// --- COMPONENTE MODAL FORMULARIO MANUAL ---
const ManualClientForm = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        cliente: '',
        cedula: '',
        celular: '',
        ejecutivo: 'Gianella',
        cuota: '',
        manualType: 'Seguro',
        manualDesc: ''
    });

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.cliente || !formData.cuota) return alert("Nombre y Cuota son obligatorios");
        
        onSave({
            ...formData,
            cuota: parseFloat(formData.cuota),
            grupo: 'MANUAL',
            ciudad: 'NO REGISTRADO'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2"><UserPlus className="h-5 w-5" /> Nuevo Registro Manual</h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente</label>
                        <input name="cliente" required className="w-full border border-slate-300 rounded-lg p-2" onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula / RUC</label>
                            <input name="cedula" className="w-full border border-slate-300 rounded-lg p-2" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
                            <input name="celular" className="w-full border border-slate-300 rounded-lg p-2" onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ejecutivo</label>
                            <select name="ejecutivo" className="w-full border border-slate-300 rounded-lg p-2" onChange={handleChange}>
                                <option>Gianella</option>
                                <option>Miguel</option>
                                <option>Jordy</option>
                                <option>Fabiola</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor ($)</label>
                            <input type="number" step="0.01" name="cuota" required className="w-full border border-slate-300 rounded-lg p-2" onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Financiamiento</label>
                        <select name="manualType" className="w-full border border-slate-300 rounded-lg p-2" onChange={handleChange}>
                            <option>Seguro</option>
                            <option>Rastreo Vehicular</option>
                            <option>Otro</option>
                        </select>
                    </div>
                    {formData.manualType === 'Otro' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Financiamiento</label>
                            <input name="manualDesc" placeholder="Especifique..." className="w-full border border-slate-300 rounded-lg p-2" onChange={handleChange} />
                        </div>
                    )}
                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium">Guardar Registro</button>
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
  
  // Usar valores seguros o defaults
  const [payQuotas, setPayQuotas] = useState(client ? (client.cuotasPagadas || 0) : 0);
  const [abonoValue, setAbonoValue] = useState(client ? (client.abono || '') : '');
  const [commitmentDateInput, setCommitmentDateInput] = useState(client ? (client.commitmentDate || '') : '');

  // Reset state when client changes (KEY FIX for "Error" / Stale state)
  useEffect(() => {
    if (client) {
      setPayQuotas(client.cuotasPagadas || 0);
      setAbonoValue(client.abono || '');
      setCommitmentDateInput(client.commitmentDate || '');
    }
  }, [client]);

  if (!client) return null; // Safety return

  const handlePayQuotasChange = (increment) => {
    const newValue = payQuotas + increment;
    if (newValue >= 0) { 
       setPayQuotas(newValue);
    }
  };

  const handleSave = () => {
    const abonoNum = parseFloat(abonoValue) || 0;
    onSavePayment(client.id, payQuotas, abonoNum);
  };

  const handleCommitmentSave = () => {
    if(commitmentDateInput) {
      onSaveCommitment(client.id, commitmentDateInput);
    }
  };

  const submitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(client.id, commentText, managementWeek, managementDate);
    setCommentText('');
  };

  const totalRecaudoPrevio = (payQuotas * (client.cuota || 0)) + (parseFloat(abonoValue) || 0);
  const vencidasRestantesPrevio = Math.max(0, (client.vencidas || 0) - payQuotas);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-10">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md font-medium text-sm group no-print"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver al Listado
        </button>
        
        {client.isManual && (
          <button 
            onClick={() => onDeleteManual(client.id)}
            className="flex items-center text-red-500 hover:text-red-700 transition-colors bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 hover:shadow-md font-medium text-sm no-print"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Dar de Baja
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${client.pagado ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                     {client.pagado ? 'Gestión Activa' : 'Sin Gestión'}
                   </span>
                   {client.isManual && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-purple-100 text-purple-700 border-purple-200">Manual</span>}
                   <span className="text-slate-400 text-xs">|</span>
                   <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Ejecutivo: {client.ejecutivo}</span>
                 </div>
                 <h1 className="text-2xl font-bold text-slate-800">{client.cliente}</h1>
                 {client.manualType && (
                    <div className="text-sm text-slate-600 mt-1 italic">
                      Financiamiento: <strong>{client.manualType}</strong> {client.manualDesc ? `- ${client.manualDesc}` : ''}
                    </div>
                 )}
                 <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {client.cedula || 'N/A'}</span>
                    <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm font-mono text-xs">ID: {client.id}</span>
                 </div>
              </div>
              <div className="text-right bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                 <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Cuota</p>
                 <p className="text-xl font-bold text-slate-800">${(client.cuota || 0).toFixed(2)}</p>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6 items-center">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 col-span-2 md:col-span-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase">Resumen Financiero</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="border-r border-slate-200">
                       <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cuotas Pendientes</p>
                       <p className={`text-2xl font-bold ${client.vencidasActuales > 0 ? 'text-red-600' : 'text-emerald-500'}`}>
                         {client.vencidasActuales} <span className="text-xs text-slate-400 font-normal">/ {client.vencidas || 0}</span>
                       </p>
                    </div>
                    <div className="border-r border-slate-200">
                       <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Pagado (Mes)</p>
                       <p className="text-2xl font-bold text-emerald-600">
                         ${(client.montoPagadoTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                       </p>
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Saldo Capital</p>
                       <p className="text-2xl font-bold text-slate-800">
                         ${(client.saldoActual || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                       </p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">Módulo de Caja / Recaudación</h3>
             </div>
             
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase block mb-3">1. Pago de Cuotas Completas</label>
                   <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <button onClick={() => handlePayQuotasChange(-1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors shadow-sm"><MinusCircle className="h-5 w-5" /></button>
                      <div className="flex-1 text-center"><span className="text-2xl font-bold text-slate-800">{payQuotas}</span><p className="text-[10px] text-slate-400 uppercase">Cuotas Seleccionadas</p></div>
                      <button onClick={() => handlePayQuotasChange(1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-emerald-500 transition-colors shadow-sm"><PlusCircle className="h-5 w-5" /></button>
                   </div>
                   <div className="text-right mt-2 text-xs text-slate-500">Valor por Cuotas: <span className="font-bold text-slate-700">${(payQuotas * (client.cuota || 0)).toFixed(2)}</span></div>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase block mb-3">2. Abono Adicional / Parcial</label>
                   <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                      <input type="number" min="0" step="0.01" placeholder="0.00" className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={abonoValue} onChange={(e) => setAbonoValue(e.target.value)} />
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2">Ingrese valores adicionales.</p>
                </div>
             </div>

             <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                   <div><p className="text-[10px] text-slate-400 uppercase font-bold">Total a Registrar</p><p className="text-2xl font-bold text-blue-600">${totalRecaudoPrevio.toFixed(2)}</p></div>
                   <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                   <div className="hidden md:block"><p className="text-[10px] text-slate-400 uppercase font-bold">Cuotas Restantes (Simulado)</p><p className="text-lg font-bold text-slate-600">{vencidasRestantesPrevio}</p></div>
                </div>
                <button onClick={handleSave} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"><Save className="h-5 w-5" /> Registrar Recaudación</button>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden no-print">
             <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-purple-600" /><h3 className="font-bold text-slate-800">Programar Seguimiento / Alerta</h3></div>
             <div className="p-5">
               <div className="flex gap-3">
                 <input type="date" className="flex-1 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" value={commitmentDateInput} onChange={(e) => setCommitmentDateInput(e.target.value)} />
                 <button onClick={handleCommitmentSave} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Guardar</button>
               </div>
               {client.commitmentDate && (<div className="mt-3 text-xs flex items-center gap-2 p-2 bg-purple-50 text-purple-700 rounded border border-purple-100"><Bell className="h-3 w-3" /> Compromiso activo para el: <strong>{new Date(client.commitmentDate).toLocaleDateString()}</strong></div>)}
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
             <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex justify-between items-center"><h3 className="font-bold text-slate-700 flex items-center gap-2"><Briefcase className="h-4 w-4 text-slate-500" /> Bitácora</h3><span className="text-xs font-medium bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500 shadow-sm">{(client.comentarios || []).length} Notas</span></div>
             <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
               {(client.comentarios && client.comentarios.length > 0) ? ([...client.comentarios].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((note, i) => (<div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-colors"><div className="flex justify-between items-center mb-2"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100 uppercase">{note.week || 'General'}</span><span className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="h-3 w-3" />{note.date ? new Date(note.date).toLocaleDateString() : 'N/A'}</span></div><p className="text-sm text-slate-700 mb-2 pl-1 leading-relaxed">{note.text}</p><div className="text-[10px] text-slate-400 pl-1 border-t border-slate-50 pt-2">Registrado por: <span className="font-medium text-slate-500">{note.author}</span></div></div>))) : (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><FileText className="h-10 w-10 mb-2 stroke-1" /><p className="text-sm font-medium">Sin registros</p></div>)}
             </div>

             <div className="p-5 border-t border-slate-100 bg-white rounded-b-2xl no-print">
               <div className="flex gap-3 mb-3">
                 <div className="flex-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block pl-1">Semana</label>
                   <select className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" value={managementWeek} onChange={(e) => setManagementWeek(e.target.value)}><option>Semana 1</option><option>Semana 2</option><option>Semana 3</option><option>Semana 4</option><option>Semana 5</option></select>
                 </div>
                 <div className="flex-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block pl-1">Fecha</label>
                   <input type="date" className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" value={managementDate} onChange={(e) => setManagementDate(e.target.value)} />
                 </div>
               </div>
               <div className="relative">
                 <textarea className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none bg-slate-50 focus:bg-white transition-all shadow-inner" rows="3" placeholder="Escriba los detalles..." value={commentText} onChange={(e) => setCommentText(e.target.value)}></textarea>
                 <button onClick={submitComment} disabled={!commentText.trim()} className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-0 disabled:translate-y-2 transition-all shadow-md hover:shadow-lg" title="Guardar comentario"><Save className="h-4 w-4" /></button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function CobranzasApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); 
  const [selectedClient, setSelectedClient] = useState(null);
  const [updates, setUpdates] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExecutive, setFilterExecutive] = useState('Todos');
  const [filterAlertType, setFilterAlertType] = useState('all'); 
  const [baseData, setBaseData] = useState(INITIAL_BASE_DATA); 
  const [weeksConfig, setWeeksConfig] = useState(5); 
  
  // ESTADOS PARA REGISTRO MANUAL
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualClients, setManualClients] = useState([]);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      // INTENTO DE AUTENTICACIÓN
      try {
        await signInAnonymously(auth);
      } catch(e) {
        console.error("Error en autenticación anónima:", e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'cobranzas_dic25_final_v2'); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newUpdates = {};
      snapshot.forEach(doc => {
        newUpdates[doc.id] = doc.data();
      });
      setUpdates(newUpdates);
    });
    return () => unsubscribe();
  }, [user]);
  
  // LISTENER PARA CLIENTES MANUALES
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'cobranzas_manual_clients_v1'); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedManualClients = [];
      snapshot.forEach(doc => {
        loadedManualClients.push({ ...doc.data(), id: doc.id });
      });
      setManualClients(loadedManualClients);
    });
    return () => unsubscribe();
  }, [user]);

  const mergedData = useMemo(() => {
    let combinedBase = [];
    if (!baseData || !Array.isArray(baseData) || baseData.length === 0) {
        combinedBase = [...INITIAL_BASE_DATA, ...manualClients]; 
    } else {
        combinedBase = [...baseData, ...manualClients];
    }
    
    const today = new Date().toISOString().split('T')[0];

    return combinedBase.map(client => {
      if (!client) return null;

      const clientUpdate = (updates && updates[client.id]) ? updates[client.id] : {};
      
      const cuotaVal = parseFloat(client.cuota) || 0;
      const saldoVal = parseFloat(client.saldo) || 0;
      const vencidasVal = parseInt(client.vencidas) || 0;

      const cuotasPagadas = parseInt(clientUpdate.cuotasPagadas) || 0;
      const abono = parseFloat(clientUpdate.abono) || 0;
      
      const montoPagadoTotal = (cuotasPagadas * cuotaVal) + abono;
      
      const hasComments = Array.isArray(clientUpdate.comentarios) && clientUpdate.comentarios.length > 0;
      const isManaged = montoPagadoTotal > 0 || hasComments;
      
      const currentVencidas = Math.max(0, vencidasVal - cuotasPagadas);
      
      const lastComment = hasComments 
        ? [...clientUpdate.comentarios].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0))[0] 
        : null;

      const commitmentDate = clientUpdate.commitmentDate || null;
      let alertStatus = 'none'; 
      if (commitmentDate && montoPagadoTotal === 0) {
         if (commitmentDate < today) alertStatus = 'overdue';
         else if (commitmentDate === today) alertStatus = 'today';
         else alertStatus = 'future';
      }

      return {
        ...client,
        cliente: client.cliente || 'Sin Nombre',
        ejecutivo: client.ejecutivo || 'Sin Asignar',
        grupo: client.grupo || 'Sin Grupo',
        id: client.id || `unknown-${Math.random()}`,
        cedula: client.cedula || '',
        celular: client.celular || '',
        cuota: cuotaVal,
        saldo: saldoVal,
        vencidas: vencidasVal,
        pagado: isManaged, 
        gestionado: isManaged, 
        cuotasPagadas: cuotasPagadas,
        abono: abono,
        montoPagadoTotal: montoPagadoTotal,
        comentarios: clientUpdate.comentarios || [],
        fechaPago: clientUpdate.updatedAt ? new Date(clientUpdate.updatedAt.seconds * 1000).toISOString() : null,
        vencidasActuales: currentVencidas,
        saldoActual: saldoVal - montoPagadoTotal,
        ultimaGestionFecha: lastComment ? new Date(lastComment.date).toLocaleDateString() : 'Sin gestión',
        ultimaGestionTexto: lastComment ? lastComment.text : '',
        commitmentDate: commitmentDate,
        alertStatus: alertStatus
      };
    }).filter(item => item !== null);
  }, [updates, baseData, manualClients]);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePayment = async (clientId, numCuotas, abonoVal) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_dic25_final_v2', clientId);
    try {
      await setDoc(docRef, {
        cuotasPagadas: numCuotas,
        abono: abonoVal,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("Error guardando pago", e);
    }
  };

  const handleSaveCommitment = async (clientId, date) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_dic25_final_v2', clientId);
    try {
      await setDoc(docRef, {
        commitmentDate: date,
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (e) {
      console.error("Error guardando compromiso", e);
    }
  };
  
  const handleSaveManualClient = async (data) => {
     if (!user) return;
     const newId = `MAN-${Date.now()}`;
     const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_manual_clients_v1', newId);
     const newClient = {
         ...data,
         id: newId,
         isManual: true,
         createdAt: serverTimestamp(),
         vencidas: 0, 
         saldo: data.cuota 
     };
     
     try {
         await setDoc(docRef, newClient);
         setShowManualForm(false);
     } catch (e) {
         console.error("Error saving manual client", e);
     }
  };

  const handleDeleteManualClient = async (clientId) => {
      if (!user) return;
      if (window.confirm("¿Está seguro que desea dar de baja este registro manual? Esta acción es irreversible.")) {
          try {
              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_manual_clients_v1', clientId);
              await deleteDoc(docRef);
              setView('list'); 
          } catch(e) {
              console.error("Error deleting", e);
          }
      }
  };

  const handleAddComment = async (clientId, text, week, customDate) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_dic25_final_v2', clientId);
    const newComment = {
      text,
      week,
      date: customDate ? new Date(customDate).toISOString() : new Date().toISOString(),
      author: "Gestor",
      timestamp: Date.now()
    };
    try {
      await setDoc(docRef, {
        comentarios: arrayUnion(newComment),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("Error guardando comentario", e);
    }
  };

  const handleClearBase = () => {
    if (window.confirm("ATENCIÓN: ¿Está seguro que desea eliminar la base actual?")) {
      setBaseData([]);
    }
  };
  
  const handleRestoreBase = () => {
      setBaseData(INITIAL_BASE_DATA);
  };

  const handleExportReport = () => {
    const tableRows = mergedData.map(c => `
      <tr style="height: 25px;">
        <td style="border: 1px solid #ccc; text-align: left;">${c.id}</td>
        <td style="border: 1px solid #ccc;">${c.cliente}</td>
        <td style="border: 1px solid #ccc; mso-number-format:'@'">${c.cedula || ''}</td>
        <td style="border: 1px solid #ccc;">${c.ejecutivo}</td>
        <td style="border: 1px solid #ccc;">${c.grupo}</td>
        <td style="border: 1px solid #ccc;">${c.ciudad}</td>
        <td style="border: 1px solid #ccc;">${c.celular}</td>
        <td style="border: 1px solid #ccc; mso-number-format:'0.00'">${(c.cuota || 0).toFixed(2)}</td>
        <td style="border: 1px solid #ccc; mso-number-format:'0.00'">${(c.saldo || 0).toFixed(2)}</td>
        <td style="border: 1px solid #ccc;">${c.vencidas}</td>
        <td style="border: 1px solid #ccc;">${c.cuotasPagadas}</td>
        <td style="border: 1px solid #ccc; mso-number-format:'0.00'">${c.abono.toFixed(2)}</td>
        <td style="border: 1px solid #ccc; background-color: #d1e7dd; mso-number-format:'0.00'">${c.montoPagadoTotal.toFixed(2)}</td>
        <td style="border: 1px solid #ccc; mso-number-format:'0.00'">${c.saldoActual.toFixed(2)}</td>
        <td style="border: 1px solid #ccc;">${c.vencidasActuales}</td>
        <td style="border: 1px solid #ccc;">${c.gestionado ? "GESTIONADO" : "PENDIENTE"}</td>
        <td style="border: 1px solid #ccc;">${c.fechaPago ? new Date(c.fechaPago).toLocaleDateString() : "-"}</td>
        <td style="border: 1px solid #ccc;">${c.ultimaGestionFecha}</td>
        <td style="border: 1px solid #ccc;">${c.ultimaGestionTexto}</td>
        <td style="border: 1px solid #ccc;">${c.commitmentDate || '-'}</td>
      </tr>
    `).join('');

    const tableContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #1f4e78; color: white; border: 1px solid #000; padding: 8px; text-align: center; }
          td { padding: 5px; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>ID CLIENTE</th>
              <th>NOMBRE CLIENTE</th>
              <th>CEDULA</th>
              <th>EJECUTIVO</th>
              <th>GRUPO</th>
              <th>CIUDAD</th>
              <th>CELULAR</th>
              <th>CUOTA MENSUAL</th>
              <th>SALDO INICIAL</th>
              <th>VENCIDAS INICIAL</th>
              <th>CUOTAS PAGADAS</th>
              <th>ABONO EXTRA</th>
              <th>TOTAL RECAUDADO</th>
              <th>SALDO ACTUAL</th>
              <th>VENCIDAS ACTUAL</th>
              <th>ESTADO GESTION</th>
              <th>FECHA ULTIMO PAGO</th>
              <th>ULTIMA GESTION</th>
              <th>COMENTARIO GESTION</th>
              <th>FECHA COMPROMISO</th>
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
    link.download = `Reporte_Cobranzas_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim().toUpperCase());
      
      const newClients = [];
      const idxId = headers.findIndex(h => h.includes('IDCODIGO') || h.includes('ID'));
      const idxCliente = headers.findIndex(h => h.includes('CLIENTE') || h.includes('NOMBRE'));
      const idxEjecutivo = headers.findIndex(h => h.includes('EJECUTIVO') || h.includes('ASIGNADO'));
      const idxCuota = headers.findIndex(h => h.includes('CUOTA'));
      const idxVencidas = headers.findIndex(h => h.includes('VENCIDAS'));
      const idxSaldo = headers.findIndex(h => h.includes('SALDO'));
      const idxCelular = headers.findIndex(h => h.includes('CELULAR') || h.includes('TELEFONO'));
      const idxGrupo = headers.findIndex(h => h.includes('GRUPO'));
      const idxPuesto = headers.findIndex(h => h.includes('PUESTO'));
      const idxCedula = headers.findIndex(h => h.includes('CEDULA'));
      const idxCiudad = headers.findIndex(h => h.includes('CIUDAD'));

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',').map(c => c.trim().replace(/"/g, ''));
        if (row.length < 5) continue;

        if (idxId !== -1 && idxCliente !== -1) {
          newClients.push({
            id: row[idxId] || `GEN-${i}`,
            grupo: row[idxGrupo] || 'GEN',
            puesto: row[idxPuesto] || 0,
            cliente: row[idxCliente] || 'Desconocido',
            celular: row[idxCelular] || '',
            cuota: parseFloat(row[idxCuota]) || 0,
            vencidas: parseInt(row[idxVencidas]) || 0,
            saldo: parseFloat(row[idxSaldo]) || 0,
            cedula: row[idxCedula] || '',
            ejecutivo: row[idxEjecutivo] || 'Sin Asignar',
            ciudad: row[idxCiudad] || ''
          });
        }
      }

      if (newClients.length > 0) {
        setBaseData(newClients);
        alert(`¡Importación exitosa! Se cargaron ${newClients.length} clientes.`);
      } else {
        alert("No se pudieron procesar clientes. Verifique el formato CSV.");
      }
    };
    reader.readAsText(file);
  };
  
  // --- VISTA DE ALERTAS ---
  const renderAlertsView = () => {
    // 1. Filtrar solo clientes con fecha de compromiso
    const clientsWithAlerts = mergedData.filter(client => client.commitmentDate);
    
    // 2. Aplicar filtro de tipo de alerta
    const filteredAlerts = clientsWithAlerts.filter(client => {
      if (filterAlertType === 'all') return true;
      if (filterAlertType === 'overdue') return client.alertStatus === 'overdue';
      if (filterAlertType === 'today') return client.alertStatus === 'today';
      if (filterAlertType === 'future') return client.alertStatus === 'future';
      return true;
    });

    // Ordenar por fecha de compromiso (más antigua primero)
    filteredAlerts.sort((a,b) => new Date(a.commitmentDate) - new Date(b.commitmentDate));

    return (
      <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in space-y-4">
        {/* HEADER DE FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            <h2 className="font-bold text-slate-800">Centro de Alertas</h2>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setFilterAlertType('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterAlertType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
             <button onClick={() => setFilterAlertType('overdue')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${filterAlertType === 'overdue' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-slate-500 hover:text-red-600'}`}><AlertCircle className="h-3 w-3" /> Vencidos</button>
             <button onClick={() => setFilterAlertType('today')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${filterAlertType === 'today' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500 hover:text-orange-600'}`}><Bell className="h-3 w-3" /> Para Hoy</button>
             <button onClick={() => setFilterAlertType('future')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${filterAlertType === 'future' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-blue-600'}`}><Calendar className="h-3 w-3" /> Futuros</button>
          </div>
        </div>

        {/* TABLA DE ALERTAS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-bold text-slate-600">Estado</th>
                  <th className="px-6 py-3 font-bold text-slate-600">Cliente / ID</th>
                  <th className="px-6 py-3 font-bold text-slate-600">Ejecutivo</th>
                  <th className="px-6 py-3 font-bold text-slate-600 text-center">Fecha Compromiso</th>
                  <th className="px-6 py-3 font-bold text-slate-600 text-right">Monto Pendiente</th>
                  <th className="px-6 py-3 font-bold text-slate-600 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((client) => {
                    let statusBadge;
                    if (client.alertStatus === 'overdue') {
                      statusBadge = <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><AlertCircle className="h-3 w-3 mr-1"/> Vencido</span>;
                    } else if (client.alertStatus === 'today') {
                      statusBadge = <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200"><Bell className="h-3 w-3 mr-1"/> Hoy</span>;
                    } else {
                      statusBadge = <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><Calendar className="h-3 w-3 mr-1"/> Pendiente</span>;
                    }

                    return (
                      <tr key={client.id} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">{statusBadge}</td>
                        <td className="px-6 py-4"><div className="font-bold text-slate-800">{client.cliente}</div><div className="text-xs text-slate-500 mt-1">{client.id}</div></td>
                        <td className="px-6 py-4"><span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">{client.ejecutivo}</span></td>
                        <td className="px-6 py-4 text-center font-medium text-slate-700">{new Date(client.commitmentDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">${(client.vencidasActuales * client.cuota).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="px-6 py-4 text-center"><button onClick={() => handleClientSelect(client)} className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-center gap-1 mx-auto hover:underline">Ir a Gestión <ArrowLeft className="h-3 w-3 rotate-180" /></button></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400"><div className="flex flex-col items-center justify-center"><Bell className="h-10 w-10 mb-3 opacity-20" /><p>No hay alertas con este criterio.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ... (renderDashboard logic remains same) ...
  const renderDashboard = () => {
    // ... logic ...
    const totalRecaudadoSistema = mergedData.reduce((acc, curr) => acc + (curr.montoPagadoTotal || 0), 0);
    const recaudadoTotalVisual = KPI_META.recaudadoReal + totalRecaudadoSistema;
    const porcentajeCumplimiento = ((recaudadoTotalVisual / KPI_META.mensual) * 100).toFixed(1);
    const totalGestionados = mergedData.filter(c => c.gestionado).length;
    const coberturaPorcentaje = mergedData.length > 0 ? ((totalGestionados / mergedData.length) * 100).toFixed(1) : 0;
    const porcentajeRecuperacionCartera = ((recaudadoTotalVisual / KPI_META.carteraTotal) * 100).toFixed(2);
    const executivesData = mergedData.reduce((acc, curr) => {
      const execName = curr.ejecutivo || "Sin Asignar";
      if (!acc[execName]) acc[execName] = { name: execName, asignados: 0, gestionados: 0, recaudado: 0 };
      acc[execName].asignados += 1;
      if (curr.gestionado) acc[execName].gestionados += 1;
      acc[execName].recaudado += curr.montoPagadoTotal || 0;
      return acc;
    }, {});
    const executiveChartData = Object.values(executivesData);
    const weeklyMatrix = {};
    const weeklyRevenueMatrix = {};
    const weeks = Array.from({length: weeksConfig}, (_, i) => `Semana ${i + 1}`);
    const allExecutivesList = Object.keys(executivesData).length > 0 ? Object.keys(executivesData) : ["Gianella", "Miguel", "Jordy", "Fabiola"];
    allExecutivesList.forEach(exec => {
      weeklyMatrix[exec] = { total: 0 };
      weeklyRevenueMatrix[exec] = { total: 0 };
      weeks.forEach(w => { weeklyMatrix[exec][w] = 0; weeklyRevenueMatrix[exec][w] = 0; });
    });
    const weeklyTrendData = weeks.map(w => ({ name: w, value: 0 }));
    const weeklyTotalRevenue = {};
    weeks.forEach(w => weeklyTotalRevenue[w] = 0);
    const baseTotalPorCobrar = mergedData.reduce((acc, curr) => acc + (curr.cuota || 0), 0);
    const targetRevenuePerWeek = weeksConfig > 0 ? baseTotalPorCobrar / weeksConfig : 0;
    mergedData.forEach(client => {
      const exec = client.ejecutivo || "Sin Asignar";
      if (!weeklyMatrix[exec]) { weeklyMatrix[exec] = { total: 0 }; weeklyRevenueMatrix[exec] = { total: 0 }; weeks.forEach(w => { weeklyMatrix[exec][w] = 0; weeklyRevenueMatrix[exec][w] = 0; }); }
      if (client.comentarios && client.comentarios.length > 0) {
        const clientWeeks = new Set(client.comentarios.map(c => c.week || 'Semana 1'));
        clientWeeks.forEach(w => { if (weeklyMatrix[exec][w] !== undefined) weeklyMatrix[exec][w]++; });
        weeklyMatrix[exec].total++; 
      }
      if (client.montoPagadoTotal > 0 && client.fechaPago) {
        const paymentDate = new Date(client.fechaPago);
        const day = paymentDate.getDate();
        let week = 'Semana 1';
        if (day > 7 && day <= 14) week = 'Semana 2';
        else if (day > 14 && day <= 21) week = 'Semana 3';
        else if (day > 21 && day <= 28) week = 'Semana 4';
        else if (day > 28) week = 'Semana 5';
        if (parseInt(week.split(' ')[1]) > weeksConfig) week = `Semana ${weeksConfig}`;
        if (weeklyRevenueMatrix[exec][week] !== undefined) {
          weeklyRevenueMatrix[exec][week] += client.montoPagadoTotal;
          weeklyRevenueMatrix[exec].total += client.montoPagadoTotal;
          const weekIndex = weeks.indexOf(week);
          if (weekIndex !== -1) { weeklyTrendData[weekIndex].value += client.montoPagadoTotal; weeklyTotalRevenue[week] += client.montoPagadoTotal; }
        }
      }
    });

    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
            <div><h2 className="text-3xl font-bold">Dashboard de Cobranzas</h2><p className="text-blue-100 mt-2 flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Diciembre 2025</p></div>
            <div className="flex gap-4 no-print items-center">
               <div className="bg-emerald-500/20 px-4 py-2 rounded-lg text-center border border-emerald-400/30"><p className="text-[10px] text-emerald-100 uppercase font-bold tracking-wider">Total Gestionados</p><p className="text-xl font-bold text-white">{totalGestionados}</p></div>
               <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg"><Settings className="h-4 w-4 text-white" /><select className="bg-transparent text-sm text-white border-none focus:ring-0 cursor-pointer" value={weeksConfig} onChange={(e) => setWeeksConfig(parseInt(e.target.value))}><option value={4} className="text-slate-800">4 Semanas</option><option value={5} className="text-slate-800">5 Semanas</option></select></div>
               <button onClick={handlePrintDashboard} className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 py-2 rounded-xl font-medium shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"><Printer className="h-5 w-5" /> Imprimir Reporte Gráfico (PDF)</button>
            </div>
          </div>
          <div className="flex gap-6 mt-6 pt-6 border-t border-white/10"><div><p className="text-xs text-blue-100 uppercase tracking-wide">Cobertura</p><p className="text-2xl font-bold">{coberturaPorcentaje}%</p></div><div><p className="text-xs text-emerald-100 uppercase tracking-wide">Recaudado</p><p className="text-2xl font-bold text-emerald-300">${recaudadoTotalVisual.toLocaleString()}</p></div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-sm font-medium">% Recup. Cartera</p><h3 className="text-2xl font-bold mt-1 text-indigo-600">{porcentajeRecuperacionCartera}%</h3></div><div className="p-2 bg-indigo-50 rounded-lg"><Activity className="h-5 w-5 text-indigo-600" /></div></div></div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-sm font-medium">Efectividad Recaudo</p><h3 className="text-2xl font-bold mt-1 text-emerald-600">{porcentajeCumplimiento}%</h3></div><div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="h-5 w-5 text-emerald-600" /></div></div></div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-sm font-medium">Cartera Vencida</p><h3 className="text-2xl font-bold mt-1 text-red-600">{mergedData.filter(c => c.vencidasActuales > 0).length}</h3></div><div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="h-5 w-5 text-red-600" /></div></div></div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-sm font-medium">Por Cobrar</p><h3 className="text-2xl font-bold mt-1 text-amber-600">${(KPI_META.mensual - recaudadoTotalVisual).toLocaleString()}</h3></div><div className="p-2 bg-amber-50 rounded-lg"><DollarSign className="h-5 w-5 text-amber-600" /></div></div></div>
        </div>
        
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 page-break-avoid">
           <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-6"><Activity className="h-5 w-5 text-blue-600" /> Análisis de Cumplimiento Semanal ($ Meta vs $ Real)</h3>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
               <thead className="bg-blue-50">
                 <tr><th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Semana</th><th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">Recaudado ($)</th><th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">Meta ($)</th><th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">% Alcanzado</th><th className="px-6 py-3 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">Estado</th></tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {weeks.map((week) => {
                   const revenue = weeklyTotalRevenue[week] || 0;
                   const percentAchieved = targetRevenuePerWeek > 0 ? (revenue / targetRevenuePerWeek) * 100 : 0;
                   const isMet = revenue >= targetRevenuePerWeek;
                   return (
                     <tr key={week} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{week}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">${revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500">${targetRevenuePerWeek.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">{percentAchieved.toFixed(1)}%</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                         {isMet ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Cumplido</span> : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">En Proceso</span>}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={executiveChartData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} /><RechartsTooltip /><Legend /><Bar dataKey="asignados" name="Total Asignados" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} /><Bar dataKey="gestionados" name="Gestionados (Con Acción)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyTrendData}><defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} /><RechartsTooltip formatter={(val) => `$${val.toLocaleString()}`} /><Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" /></AreaChart></ResponsiveContainer></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 page-break-avoid">
           <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-6"><TableIcon className="h-5 w-5 text-purple-600" /> Detalle Semanal de Clientes Gestionados (Casos)</h3>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
               <thead className="bg-gray-50">
                 <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejecutivo</th>{weeks.map(w => <th key={w} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{w}</th>)}<th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100">Total Unico</th></tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {Object.keys(weeklyMatrix).map((exec) => (
                   <tr key={exec} className="hover:bg-gray-50">
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{exec}</td>
                     {weeks.map(w => (<td key={w} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{weeklyMatrix[exec][w] > 0 ? <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">{weeklyMatrix[exec][w]}</span> : "-"}</td>))}
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900 bg-gray-50">{weeklyMatrix[exec].total}</td>
                   </tr>
                 ))}
                 <tr className="bg-gray-100 border-t-2 border-gray-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 uppercase">TOTALES</td>
                    {weeks.map(w => {
                        const totalWeek = Object.values(weeklyMatrix).reduce((acc, curr) => acc + (curr[w] || 0), 0);
                        return <td key={w} className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-800">{totalWeek > 0 ? totalWeek : "-"}</td>;
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-black text-gray-900 bg-gray-200">{totalGestionados}</td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 page-break-avoid">
           <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-6"><DollarSign className="h-5 w-5 text-emerald-600" /> Detalle Semanal de Recaudación ($)</h3>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
               <thead className="bg-emerald-50">
                 <tr><th className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider">Ejecutivo</th>{weeks.map(w => <th key={w} className="px-6 py-3 text-center text-xs font-medium text-emerald-800 uppercase tracking-wider">{w}</th>)}<th className="px-6 py-3 text-center text-xs font-bold text-emerald-900 uppercase tracking-wider bg-emerald-100">Total Recaudado</th></tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {Object.keys(weeklyRevenueMatrix).map((exec) => (
                   <tr key={exec} className="hover:bg-gray-50">
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{exec}</td>
                     {weeks.map(w => (<td key={w} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{weeklyRevenueMatrix[exec][w] > 0 ? <span className="font-medium text-emerald-600">${weeklyRevenueMatrix[exec][w].toLocaleString()}</span> : "-"}</td>))}
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-emerald-700 bg-emerald-50">${weeklyRevenueMatrix[exec].total.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  };
  
  // ... (renderClientList remains same)
  // ... (renderAlertsView remains same)
  const renderClientList = () => {
    // PROTECCIÓN CONTRA DATOS NULOS O INDEFINIDOS
    const filteredClients = mergedData.filter(client => {
      // Safely access properties with optional chaining or fallback to empty string
      const clientName = client.cliente ? client.cliente.toLowerCase() : '';
      const clientId = client.id ? client.id.toString().toLowerCase() : '';
      const clientCedula = client.cedula ? client.cedula.toString() : '';
      const term = searchTerm.toLowerCase();

      const matchesSearch = clientName.includes(term) || clientId.includes(term) || clientCedula.includes(term);
      const matchesExec = filterExecutive === 'Todos' || client.ejecutivo === filterExecutive;
      return matchesSearch && matchesExec;
    });

    const uniqueExecutives = [...new Set(mergedData.map(c => c.ejecutivo || 'Sin Asignar'))];

    return (
      <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in space-y-4">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 no-print">
          <button onClick={() => setFilterExecutive('Todos')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${filterExecutive === 'Todos' ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-300' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Users className="h-5 w-5" /><span className="text-xs font-bold uppercase">Todos</span></button>
          {uniqueExecutives.map(ex => (
            <button key={ex} onClick={() => setFilterExecutive(ex)} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${filterExecutive === ex ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><User className="h-5 w-5" /><div className="text-center"><span className="text-xs font-bold uppercase block">{ex}</span><span className="text-[10px] opacity-80 font-normal">{mergedData.filter(c => c.ejecutivo === ex).length} Clientes</span></div></button>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-4 items-stretch no-print">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 flex-1">
             <Search className="h-5 w-5 text-slate-400" />
             <input type="text" placeholder={`Buscar en la cartera de ${filterExecutive === 'Todos' ? 'todos los equipos' : filterExecutive}...`} className="w-full text-sm outline-none text-slate-700 placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             {searchTerm && (<button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600"><XCircle className="h-4 w-4" /></button>)}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setShowManualForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-4 rounded-xl font-medium shadow-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"><UserPlus className="h-5 w-5" /> <span className="hidden sm:inline">Nuevo Manual</span></button>
            <button onClick={() => setView('alerts')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-4 rounded-xl font-medium shadow-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap" title="Ver todas las alertas"><Bell className="h-5 w-5" /> <span className="hidden sm:inline">Centro de Alertas</span></button>
            <button onClick={handleExportReport} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-4 rounded-xl font-medium shadow-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap" title="Descargar data en formato compatible con Excel"><Download className="h-5 w-5" /> <span className="hidden sm:inline">Exportar Data (Excel)</span></button>
            {baseData.length > 0 ? (
               <button onClick={handleClearBase} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-4 rounded-xl font-medium shadow-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap" title="Borrar base actual"><Trash2 className="h-5 w-5" /></button>
            ) : (
               <button onClick={handleRestoreBase} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-4 py-4 rounded-xl font-medium shadow-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap" title="Cargar datos de ejemplo"><RefreshCw className="h-5 w-5" /> Restaurar Base</button>
            )}
            <div className="relative">
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-medium shadow-sm flex items-center justify-center gap-2 h-full transition-colors whitespace-nowrap"><FileSpreadsheet className="h-5 w-5" /> Subir Base</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-bold text-slate-600">Gestión</th>
                  <th className="px-6 py-3 font-bold text-slate-600">Cliente / ID</th>
                  <th className="px-6 py-3 font-bold text-slate-600 text-center">Cuota</th>
                  <th className="px-6 py-3 font-bold text-slate-600 text-center">Vencidas (Act)</th>
                  <th className="px-6 py-3 font-bold text-slate-600">Ejecutivo Asignado</th>
                  <th className="px-6 py-3 font-bold text-slate-600">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                  <tr key={client.id} onClick={() => handleClientSelect(client)} className="bg-white hover:bg-blue-50/50 cursor-pointer transition-colors group border-b border-slate-50 last:border-none">
                    <td className="px-6 py-4">
                      {client.gestionado ? (
                        <div className="flex flex-col"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 w-fit"><CheckCircle className="w-3 h-3 mr-1" /> Gestionado</span>{client.montoPagadoTotal > 0 && (<span className="text-[10px] text-emerald-600 mt-1 pl-1 font-medium">${client.montoPagadoTotal} Pagado</span>)}</div>
                      ) : (
                         <div className="flex flex-col"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 w-fit"><Clock className="w-3 h-3 mr-1" /> Pendiente</span></div>
                      )}
                      {client.alertStatus === 'overdue' && (<span className="mt-1 flex items-center gap-1 text-[10px] text-red-600 font-bold uppercase animate-pulse"><AlertCircle className="h-3 w-3" /> Compromiso Vencido</span>)}
                      {client.alertStatus === 'today' && (<span className="mt-1 flex items-center gap-1 text-[10px] text-orange-600 font-bold uppercase"><Bell className="h-3 w-3" /> Cobrar Hoy</span>)}
                      {client.isManual && (<span className="mt-1 flex items-center gap-1 text-[10px] text-purple-600 font-bold uppercase"><UserPlus className="h-3 w-3" /> Manual</span>)}
                    </td>
                    <td className="px-6 py-4"><div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{client.cliente || 'Sin Nombre'}</div><div className="text-xs text-slate-500 mt-1 flex items-center gap-2"><span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">{client.id}</span><span className="text-slate-400">|</span><span>{client.grupo}</span></div></td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">${(client.cuota || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">{client.vencidasActuales > 0 ? (<span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-red-50 text-red-600 font-bold text-xs border border-red-100">{client.vencidasActuales}</span>) : (<span className="text-emerald-500 font-bold text-xs">Al día</span>)}</td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${client.ejecutivo === 'Miguel' ? 'bg-indigo-500' : client.ejecutivo === 'Gianella' ? 'bg-pink-500' : client.ejecutivo === 'Jordy' ? 'bg-cyan-500' : 'bg-orange-500'}`}>{(client.ejecutivo || '?').charAt(0)}</div><div className="flex flex-col"><span className="text-sm font-medium text-slate-700">{client.ejecutivo || 'Sin Asignar'}</span><span className="text-[10px] text-slate-400 uppercase">Responsable</span></div></div></td>
                    <td className="px-6 py-4"><button onClick={(e) => { e.stopPropagation(); handleClientSelect(client); }} className="text-white bg-blue-600 hover:bg-blue-700 font-medium text-xs px-3 py-2 rounded-lg shadow-sm hover:shadow flex items-center gap-1 transition-all group-hover:scale-105">Gestionar <ChevronRight className="h-3 w-3" /></button></td>
                  </tr>
                ))
               ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Users className="h-12 w-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-slate-600 mb-1">No hay clientes visibles</h3>
                        <p className="text-sm mb-4">La base de datos parece estar vacía o el filtro no coincide.</p>
                        <button onClick={handleRestoreBase} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
                          Recargar Base de Datos
                        </button>
                      </div>
                    </td>
                  </tr>
               )}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>Mostrando {filteredClients.length} registros</span>
            <span>Total Cartera: {mergedData.length}</span>
          </div>
        </div>
      </div>
    );
  };
  
  // ... (handleExportReport remains same)
  // ... (handlePrintDashboard remains same)
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      {/* ... (styles remain same) */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90 no-print">
        {/* ... (nav content) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-blue-200/50"><Activity className="h-5 w-5" /></div>
              <div><span className="text-lg font-bold text-slate-800 tracking-tight block leading-none">Cobranzas 360°</span><span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Panel Administrativo</span></div>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Activity className="h-4 w-4" /> Dashboard</button>
              <button onClick={() => { setView('list'); setFilterExecutive('Todos'); setSearchTerm(''); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'list' || view === 'detail' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users className="h-4 w-4" /> Base de Clientes</button>
              <button onClick={() => setView('alerts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'alerts' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-purple-700'}`}><Bell className="h-4 w-4" /> Alertas</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && renderDashboard()}
        {view === 'list' && renderClientList()}
        {view === 'alerts' && renderAlertsView()}
        {view === 'detail' && selectedClient && (
          <ClientDetailView 
            client={mergedData.find(c => c.id === selectedClient.id) || selectedClient}
            onBack={() => setView('list')}
            onSavePayment={handleSavePayment}
            onAddComment={handleAddComment}
            onSaveCommitment={handleSaveCommitment}
            onDeleteManual={handleDeleteManualClient}
          />
        )}
      </main>

      {/* MODAL MANUAL */}
      {showManualForm && <ManualClientForm onClose={() => setShowManualForm(false)} onSave={handleSaveManualClient} />}
    </div>
  );
}