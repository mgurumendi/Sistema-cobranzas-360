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
  Award, MessageSquare, MousePointerClick, Lock, LogOut, UserCheck, ShieldCheck, Key, UserPlus as UserPlusIcon,
  Send, CalendarDays, PenTool, Check
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  updateDoc, arrayUnion, serverTimestamp, deleteDoc, query, getDoc, getDocs, where
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';

// --- CONFIGURACIÓN Y CONSTANTES ---
const APP_VERSION = "3.8.3-MANUAL-FORM-STABILITY";
const DEFAULT_APP_ID = 'sistema-cobranzas-360-v2';

// Configuración de Firebase
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
const appId = typeof __app_id !== 'undefined' ? __app_id : DEFAULT_APP_ID;

const KPI_META_ESTATICA = {
  mensual: 130329.83,
  carteraTotal: 1202683.84
};

const ADMIN_EMAIL = 'mgurumendi@bopelual.com';
const EXECUTIVES_LIST = ["Gianella", "Fabiola", "Jordy", "Miguel"];

// --- COMPONENTES DE APOYO ---

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000); 
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

// --- PANTALLA DE SOLICITUD DE ACCESO ---
const RequestAccessForm = ({ onCancel, onSubmit, loading }) => {
    const [formData, setFormData] = useState({ name: '', cedula: '', email: '', password: '' });

    return (
        <div className="absolute inset-0 bg-slate-900 z-20 flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                <button onClick={onCancel} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors"><ArrowLeft className="h-5 w-5" /> Volver al Login</button>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Solicitar Acceso</h2>
                <p className="text-slate-500 mb-8 font-medium text-sm">Complete sus datos para que el administrador apruebe su cuenta.</p>
                
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Completo</label>
                        <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Número de Cédula</label>
                        <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Correo Electrónico</label>
                        <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contraseña Deseada</label>
                        <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all mt-4 flex justify-center items-center gap-2">
                        {loading ? 'Enviando...' : <><Save className="h-4 w-4" /> Enviar Solicitud</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- PANTALLA DE CAMBIO DE CONTRASEÑA ---
const ChangePasswordModal = ({ onClose, onSubmit, loading, userEmail }) => {
    const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            alert("Las contraseñas nuevas no coinciden");
            return;
        }
        onSubmit(userEmail, formData.currentPassword, formData.newPassword);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 relative overflow-hidden animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"><X className="h-6 w-6" /></button>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Key className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Cambiar Contraseña</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">{userEmail}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contraseña Actual</label>
                        <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.currentPassword} onChange={e => setFormData({...formData, currentPassword: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nueva Contraseña</label>
                        <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Confirmar Nueva Contraseña</label>
                        <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all mt-4">
                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- PANTALLA DE RECUPERACIÓN DE CONTRASEÑA ---
const ForgotPasswordForm = ({ onCancel, onSubmit, loading }) => {
    const [formData, setFormData] = useState({ email: '', newPassword: '' });

    return (
        <div className="absolute inset-0 bg-slate-900 z-20 flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <button onClick={onCancel} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors"><ArrowLeft className="h-5 w-5" /> Volver al Login</button>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Recuperar Clave</h2>
                <p className="text-slate-500 mb-8 font-medium text-sm">Ingrese su correo registrado y la nueva contraseña para confirmar el cambio.</p>
                
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Correo Registrado</label>
                        <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="pt-4 border-t border-slate-100 mt-4">
                        <label className="text-[10px] font-black text-emerald-600 uppercase ml-1">Nueva Contraseña</label>
                        <input type="password" required className="w-full bg-emerald-50 border border-emerald-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-900 font-bold" placeholder="Escriba su nueva clave" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-emerald-700 transition-all mt-4 flex justify-center items-center gap-2">
                        {loading ? 'Procesando...' : <><Check className="h-4 w-4" /> Confirmar Cambio</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE DE LOGIN PRINCIPAL ---
const LoginPage = ({ onLogin, onRegisterRequest, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await onLogin(email, password, (err) => {
        setError(err);
        setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up relative">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-10 text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-inner">
                    <Lock className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Acceso Seguro</h1>
                <p className="text-blue-100 mt-2 font-medium">Sistema Cobranzas 360</p>
           </div>
        </div>
        
        <form onSubmit={handleLoginSubmit} className="p-10 space-y-6">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Correo Electrónico</label>
             <div className="relative">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <input 
                 type="email" 
                 required
                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                 placeholder="usuario@empresa.com"
                 value={email}
                 onChange={e => setEmail(e.target.value)}
               />
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contraseña</label>
             <div className="relative">
               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <input 
                 type="password" 
                 required
                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                 placeholder="••••••••"
                 value={password}
                 onChange={e => setPassword(e.target.value)}
               />
             </div>
             <div className="text-right">
                 <button type="button" onClick={onForgotPassword} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">¿Olvidó su contraseña?</button>
             </div>
           </div>

           {error && (
             <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100 animate-shake">
               <AlertCircle className="h-4 w-4 shrink-0" /> {error}
             </div>
           )}

           <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
           >
             {loading ? 'Validando...' : 'Iniciar Sesión'}
           </button>
           
           <div className="pt-4 border-t border-slate-100">
               <button type="button" onClick={onRegisterRequest} className="w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all text-sm flex items-center justify-center gap-2">
                 <UserPlusIcon className="h-4 w-4" /> Solicitar Acceso
               </button>
           </div>
        </form>
      </div>
    </div>
  );
};

// --- PANEL DE ADMINISTRACIÓN ---
const AdminPanel = ({ onClose, showNotify }) => {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const qReq = collection(db, 'artifacts', appId, 'public', 'data', 'cobranzas_requests');
        const unsubReq = onSnapshot(qReq, (snap) => {
            const data = [];
            snap.forEach(d => data.push({ ...d.data(), id: d.id }));
            setRequests(data);
        });

        const qUsers = collection(db, 'artifacts', appId, 'public', 'data', 'cobranzas_users');
        const unsubUsers = onSnapshot(qUsers, (snap) => {
            const data = [];
            snap.forEach(d => data.push({ ...d.data(), id: d.id }));
            setUsers(data);
        });

        return () => { unsubReq(); unsubUsers(); };
    }, []);

    const handleApprove = async (req) => {
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_users', req.email), {
                ...req,
                role: 'user', 
                status: 'active',
                approvedAt: serverTimestamp()
            });
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_requests', req.id));
            showNotify(`Usuario ${req.name} aprobado correctamente`);
        } catch (e) {
            console.error(e);
            showNotify("Error al aprobar usuario", "error");
        }
    };

    const handleReject = async (id) => {
        if (!confirm("¿Está seguro de rechazar esta solicitud?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_requests', id));
            showNotify("Solicitud rechazada y eliminada");
        } catch (e) { showNotify("Error al rechazar", "error"); }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("¿Eliminar acceso a este usuario permanentemente?")) return;
        if (id === ADMIN_EMAIL) { showNotify("No puede eliminar al Administrador Principal", "error"); return; }
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_users', id));
            showNotify("Usuario eliminado");
        } catch (e) { showNotify("Error al eliminar usuario", "error"); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
                <div className="bg-slate-800 p-8 flex justify-between items-center text-white border-b border-slate-700">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-emerald-400" /> Panel de Administración</h2>
                        <p className="text-slate-400 text-sm mt-1 ml-11">Gestión de accesos y seguridad</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-3 rounded-full transition-colors"><X className="h-6 w-6" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><UserPlusIcon className="h-5 w-5 text-blue-600" /> Solicitudes Pendientes <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">{requests.length}</span></h3>
                        {requests.length === 0 ? (
                            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                <UserCheck className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 font-bold">No hay solicitudes pendientes por revisar.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {requests.map(req => (
                                    <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                                        <div>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><User className="h-5 w-5" /></div>
                                                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg uppercase">Pendiente</span>
                                            </div>
                                            <p className="font-bold text-slate-800 text-lg leading-tight">{req.name}</p>
                                            <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wide">C.I. {req.cedula}</p>
                                            <p className="text-sm text-slate-600 font-medium mt-3 break-all bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">{req.email}</p>
                                        </div>
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <button onClick={() => handleReject(req.id)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors">Rechazar</button>
                                            <button onClick={() => handleApprove(req)} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">Aprobar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /> Usuarios Activos <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-xs">{users.length}</span></h3>
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-5 font-black text-slate-400 uppercase text-[10px] tracking-wider">Usuario</th>
                                        <th className="p-5 font-black text-slate-400 uppercase text-[10px] tracking-wider">Identificación</th>
                                        <th className="p-5 font-black text-slate-400 uppercase text-[10px] tracking-wider">Acceso</th>
                                        <th className="p-5 font-black text-slate-400 uppercase text-[10px] tracking-wider text-right">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${u.email === ADMIN_EMAIL ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700">{u.name}</p>
                                                        <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-slate-500 font-mono font-medium">{u.cedula}</td>
                                            <td className="p-5">
                                                {u.email === ADMIN_EMAIL 
                                                    ? <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">Administrador</span>
                                                    : <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">Estándar</span>
                                                }
                                            </td>
                                            <td className="p-5 text-right">
                                                {u.email !== ADMIN_EMAIL && (
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-slate-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all group-hover:text-red-400" title="Eliminar Usuario"><Trash2 className="h-5 w-5" /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CONFIRMATION MODAL ---
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

  // Cálculo seguro para evitar NaN
  const getCuota = () => {
      const m = parseFloat(formData.monto) || 0;
      const p = parseInt(formData.meses) || 0;
      return p > 0 ? (m / p).toFixed(2) : '0.00';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.cliente || !formData.monto || !formData.meses || !formData.fechaVencimiento) {
        showNotify("⚠️ Falta información obligatoria: Nombre, Monto, Meses o Fecha.", "error");
        setLoading(false);
        return;
    }
    
    const montoVal = parseFloat(formData.monto);
    const mesesVal = parseInt(formData.meses);

    if (isNaN(montoVal) || isNaN(mesesVal) || mesesVal <= 0) {
        showNotify("⚠️ El Monto y los Meses deben ser números válidos mayores a 0.", "error");
        setLoading(false);
        return;
    }

    const cuotaVal = montoVal / mesesVal;
    let diaPago = '05'; 
    if (formData.fechaVencimiento) {
        const parts = formData.fechaVencimiento.split('-');
        if (parts.length === 3) diaPago = parts[2];
    }

    const secureData = {
      cliente: formData.cliente || 'Sin Nombre',
      cedula: formData.cedula || '',
      celular: formData.celular || '',
      ejecutivo: formData.ejecutivo || 'Sin Asignar',
      grupo: 'FINANCIAMIENTO',
      ciudad: 'S/I',
      cuota: Number(cuotaVal.toFixed(2)),
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
          <button onClick={onClose} type="button" className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="h-6 w-6" /></button>
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
                    {(EXECUTIVES_LIST || []).map(e => <option key={e}>{e}</option>)}
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
                 ${getCuota()}
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
  const [selectedExec, setSelectedExec] = useState(client?.ejecutivo || EXECUTIVES_LIST[0]);

  useEffect(() => {
    if (client) {
      setPayQuotas(client.cuotasPagadas || 0);
      setAbonoValue(client.abono || '');
      setCommitmentDateInput(client.commitmentDate || '');
      const matchedExec = EXECUTIVES_LIST.find(e => client.ejecutivo && client.ejecutivo.includes(e));
      if (matchedExec) setSelectedExec(matchedExec);
    }
  }, [client]);

  if (!client) return <div className="p-10 text-center font-bold text-slate-500">Seleccione un cliente...</div>;

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
              <button onClick={() => onSavePayment(client.id, payQuotas, parseFloat(abonoValue) || 0, selectedExec)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl shadow-blue-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                <Save className="h-6 w-6" /> Guardar Recaudación
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
             {/* Card 2: Nueva Gestión (UNIFICADA CON COMPROMISO) */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden border-t-8 border-t-slate-800">
                <div className="p-6 bg-slate-800 flex justify-between items-center">
                    <h3 className="font-black text-white flex items-center gap-2 text-lg">
                        <PenTool className="h-5 w-5 text-blue-400" /> Registrar Gestión
                    </h3>
                    <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold">Nuevo Registro</span>
                </div>
                <div className="p-6 space-y-6">
                    {/* SECCIÓN 1: COMPROMISO (Integrado) */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <label className="text-[10px] font-black text-blue-400 uppercase mb-2 block flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Próximo Compromiso
                        </label>
                        <div className="flex gap-2">
                             <input 
                                type="date" 
                                className="flex-1 bg-white border border-blue-200 rounded-lg p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-700" 
                                value={commitmentDateInput} 
                                onChange={e => setCommitmentDateInput(e.target.value)} 
                            />
                            <button 
                                onClick={() => onSaveCommitment(client.id, commitmentDateInput)} 
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-700 transition-all shadow-md"
                            >
                                Definir
                            </button>
                        </div>
                         {client.commitmentDate && (
                            <div className="mt-2 text-[10px] font-bold text-blue-600 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Actual: {new Date(client.commitmentDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 2: FORMULARIO DE GESTIÓN */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Detalles de Actividad</label>
                        </div>
                        
                        {/* Executive & Date Inputs Compact */}
                         <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-slate-700"
                                    value={selectedExec} 
                                    onChange={e => setSelectedExec(e.target.value)}
                                >
                                    {(EXECUTIVES_LIST || []).map(e => <option key={e}>{e}</option>)}
                                </select>
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            </div>
                             <input 
                                type="date" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-700" 
                                value={managementDate} 
                                onChange={e => setManagementDate(e.target.value)} 
                            />
                        </div>

                         <div className="flex bg-slate-100 p-1 rounded-xl">
                                {["Semana 1", "Semana 2", "Semana 3", "Semana 4", "Semana 5"].map(w => (
                                    <button
                                        key={w}
                                        onClick={() => setManagementWeek(w)}
                                        className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${managementWeek === w ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {w.replace("Semana ", "SEM ")}
                                    </button>
                                ))}
                         </div>

                        <div className="relative">
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-400 min-h-[120px] font-medium text-slate-700" 
                                placeholder="Escriba el resultado de la gestión aquí..." 
                                value={commentText} 
                                onChange={e => setCommentText(e.target.value)} 
                            />
                            <button 
                                disabled={!commentText.trim()} 
                                onClick={() => { onAddComment(client.id, commentText, managementWeek, managementDate, selectedExec); setCommentText(''); }} 
                                className="absolute bottom-3 right-3 bg-blue-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-105 flex items-center justify-center group"
                            >
                                <Send className="h-5 w-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 3: Historial (Timeline style) */}
            <div className="bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col h-[400px]">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                    <h3 className="font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest text-xs"><Clock className="h-4 w-4" /> Historial de Cambios</h3>
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black border border-slate-200">{(client.comentarios || []).length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {(client.comentarios && client.comentarios.length > 0) ? (
                        [...client.comentarios].sort((a,b) => b.timestamp - a.timestamp).map((note, i) => (
                        <div key={i} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-white text-slate-400 flex items-center justify-center text-xs font-black border-2 border-slate-200 shrink-0">
                                    {note.author ? note.author.charAt(0) : 'S'}
                                </div>
                                {i < client.comentarios.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-2 rounded-full group-hover:bg-blue-200 transition-colors"></div>}
                            </div>
                            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group-hover:shadow-md transition-all relative">
                                <div className="absolute top-4 right-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">{new Date(note.date).toLocaleDateString()}</div>
                                <div className="mb-2">
                                    <p className="text-xs font-black text-slate-800">{note.author || 'Sistema'}</p>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{note.week}</p>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">{note.text}</p>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 text-center px-6">
                        <MessageSquare className="h-12 w-12 mb-3 stroke-[1.5]" />
                        <p className="text-sm font-bold">Sin registros aún.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null); // Firebase Connection
  const [loginEmail, setLoginEmail] = useState(''); // App Session User
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); 
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [updates, setUpdates] = useState({});
  const [manualClients, setManualClients] = useState([]);
  const [baseData, setBaseData] = useState(INITIAL_BASE_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExecutive, setFilterExecutive] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos'); 
  const [filterAlertType, setFilterAlertType] = useState('all');
  const [showManualForm, setShowManualForm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false); 
  const [notification, setNotification] = useState(null);
  const [weeksConfig, setWeeksConfig] = useState(5);
  
  // NUEVO ESTADO: Filtro Drill-down (Interactivo)
  const [drillDown, setDrillDown] = useState(null);

  // LOGIN FLOW STATES
  const [showRegisterRequest, setShowRegisterRequest] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false); // NUEVO ESTADO

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

  // INIT AUTH: Always connect anonymously to Firebase to allow DB reads/writes for login check
  useEffect(() => {
    const initConnection = async () => {
        try {
            await signInAnonymously(auth);
        } catch (e) {
            console.error("Auth conn error", e);
        }
    };
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false); 
      if (!u) {
          // If disconnected, try reconnect
          initConnection();
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Listen to Firestore updates
  useEffect(() => {
    if (!user) return;
    const collectionsPath = ['artifacts', appId, 'public', 'data'];
    const updatesRef = collection(db, ...collectionsPath, 'cobranzas_live_v3');
    const unsubscribeUpdates = onSnapshot(updatesRef, (snap) => {
      const data = {};
      snap.forEach(d => data[d.id] = d.data());
      setUpdates(data);
    });
    const manualRef = collection(db, ...collectionsPath, 'cobranzas_manuales_v3');
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

  // Handle Login Logic with Access Control
  const handleLogin = async (email, password, onError) => {
      try {
          if (email === ADMIN_EMAIL && password === '123456') {
              setLoginEmail(email);
              showNotify(`Bienvenido Administrador`);
              return;
          }

          // Verificar si el usuario existe y está aprobado en la colección "users"
          const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_users', email);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
              const userData = userSnap.data();
              if (userData.password === password) {
                  if (userData.status === 'active') {
                      setLoginEmail(email);
                      showNotify(`Bienvenido, ${userData.name}`);
                  } else {
                      onError('Su cuenta está desactivada.');
                  }
              } else {
                  onError('Contraseña incorrecta.');
              }
          } else {
              // Verificar si está pendiente
              const qPending = query(collection(db, 'artifacts', appId, 'public', 'data', 'cobranzas_requests'), where('email', '==', email));
              const pendingSnap = await getDocs(qPending);
              if (!pendingSnap.empty) {
                  onError('Su solicitud está pendiente de aprobación por el administrador.');
              } else {
                  onError('Usuario no registrado. Solicite acceso.');
              }
          }
      } catch (error) {
          console.error(error);
          onError("Error de conexión. Intente nuevamente.");
      }
  };

  const handleRegisterRequest = async (data) => {
      try {
          const reqRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_requests', data.email); // ID es el email
          await setDoc(reqRef, {
              ...data,
              status: 'pending',
              requestedAt: serverTimestamp()
          });
          setShowRegisterRequest(false);
          showNotify("Solicitud enviada exitosamente. Espere aprobación.");
      } catch (e) {
          console.error(e);
          showNotify("Error al enviar solicitud.", "error");
      }
  };

  const handlePasswordRecovery = async (data) => {
      try {
          const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_users', data.email);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
              // Actualizar contraseña directamente
              await updateDoc(userDocRef, { password: data.newPassword });
              setShowForgotPassword(false);
              showNotify("Contraseña actualizada. Ahora puede iniciar sesión con su nueva clave.");
          } else {
              showNotify("Correo no encontrado en usuarios activos.", "error");
          }
      } catch (e) {
          console.error(e);
          showNotify("Error al procesar recuperación.", "error");
      }
  };

  const handleChangePassword = async (email, currentPassword, newPassword) => {
     try {
          const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_users', email);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
              const userData = userSnap.data();
              // Verificar contraseña actual
              if (userData.password === currentPassword) {
                  await updateDoc(userDocRef, { password: newPassword });
                  setShowChangePassword(false);
                  showNotify("Contraseña actualizada exitosamente.");
              } else {
                  showNotify("La contraseña actual es incorrecta.", "error");
              }
          } else {
             // Si es admin backdoor
             if (email === ADMIN_EMAIL && currentPassword === '123456') {
                 showNotify("El usuario administrador principal no puede cambiar su clave por este medio.", "error");
             } else {
                 showNotify("Error de usuario.", "error");
             }
          }
     } catch(e) {
         console.error(e);
         showNotify("Error al actualizar contraseña.", "error");
     }
  };

  // FIX: Solo limpiar el email local, NO cerrar la sesión de firebase (se necesita para el login check)
  const handleLogout = () => {
      setLoginEmail('');
      setView('dashboard');
      setShowAdminPanel(false);
  };

  const mergedData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const source = baseData; 
    const combined = [...source, ...manualClients]; 

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
    setShowClearConfirm(true); 
  };

  const confirmClearBase = () => {
    setBaseData([]); 
    setShowClearConfirm(false); 
    showNotify("Base de datos importada eliminada correctamente. Registros manuales conservados.", "success");
  };

  const handleSavePayment = async (clientId, numCuotas, abono, authorName) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_live_v3', clientId);
    try {
      await setDoc(docRef, { cuotasPagadas: numCuotas, abono, updatedAt: serverTimestamp() }, { merge: true });
      showNotify("Pago actualizado exitosamente");
    } catch (e) { showNotify("Error de sincronización", "error"); }
  };

  const handleAddComment = async (clientId, text, week, date, authorName) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_live_v3', clientId);
    const comment = { text, week, date: new Date(date).toISOString(), author: authorName || "Gestor", timestamp: Date.now() };
    try {
      await setDoc(docRef, { comentarios: arrayUnion(comment), updatedAt: serverTimestamp() }, { merge: true });
      showNotify("Comentario registrado");
    } catch (e) { showNotify("Error de conexión", "error"); }
  };

  const handleSaveCommitment = async (clientId, date) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_live_v3', clientId);
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
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_manuales_v3', newId);
    
    try {
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
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cobranzas_manuales_v3', id);
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

         const seenIds = new Set(); // To track duplicates

         return dataRows.map((row, i) => {
             const getVal = (i) => i !== -1 && row[i] !== undefined ? row[i] : '';
             const parseNum = (val) => {
                 if (typeof val === 'number') return val;
                 if (!val) return 0;
                 const clean = String(val).replace(/[^0-9.-]/g, ''); 
                 return parseFloat(clean) || 0;
             };

             // ID Logic
             let rawId = idx.id !== -1 ? String(getVal(idx.id)).trim() : '';
             let finalId = rawId;
             
             // If empty or duplicate, generate a unique one
             if (!finalId || seenIds.has(finalId)) {
                 finalId = finalId ? `${finalId}_DUP_${i}` : `ROW_${i}`;
             }
             seenIds.add(finalId);

             return {
                 id: finalId, // Use the guaranteed unique ID
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
    // Ensure we export ALL data, not just filtered view if that was the issue (though mergedData is usually all)
    const tableRows = mergedData.map(c => `
      <tr>
        <td>${c.grupo || ''}</td>
        <td>${c.puesto || ''}</td>
        <td>${c.cliente}</td>
        <td style="mso-number-format:'0.00'">${c.cuota.toFixed(2)}</td>
        <td>${c.vencidas || 0}</td>
        <td>${c.cuotasPagadas || 0}</td>
        <td>${c.ejecutivo}</td>
        
        <td style="mso-number-format:'0.00'">${c.montoPagadoTotal.toFixed(2)}</td>
        <td>${c.fechaAdjudicacion ? 'SI' : 'NO'}</td>
        <td>${(c.comentarios || []).map(com => `[${com.date.split('T')[0]}] (${com.author || 'Gestor'}): ${com.text}`).join(' | ')}</td>
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
              <th>GRUPO</th>
              <th>PUESTO</th>
              <th>CLIENTE</th>
              <th>CUOTA MENSUAL</th>
              <th>VENCIDAS</th>
              <th>CUOTAS COBRADAS</th>
              <th>EJECUTIVO ASIGNADO</th>
              <th>TOTAL RECAUDADO ($)</th>
              <th>ADJUDICADO</th>
              <th>HISTORIAL</th>
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
    link.download = `Reporte_Gestion_${new Date().toISOString().split('T')[0]}.xls`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- LOGICA DEL DASHBOARD ---

  const renderDashboard = () => {
    const totalRecaudado = mergedData.reduce((acc, curr) => acc + curr.montoPagadoTotal, 0);
    const totalVencidoPorCobrar = mergedData.reduce((acc, curr) => acc + (curr.cuota * curr.vencidasActuales), 0);
    const totalFinanciamiento = mergedData.filter(c => c.isManual).reduce((acc, curr) => acc + (curr.saldoActual || 0), 0);

    const weeks = Array.from({length: weeksConfig}, (_, i) => `Semana ${i + 1}`);

    // Inicializar matrices de datos
    const matrixGestion = {}; 
    const matrixRevenue = {}; 
    const executiveGoals = {}; // New: Store goals and progress per executive

    EXECUTIVES_LIST.forEach(exec => {
      matrixGestion[exec] = { total: 0 };
      matrixRevenue[exec] = { total: 0 };
      executiveGoals[exec] = { 
          target: 0, 
          collected: 0 
      };
      weeks.forEach(w => {
        matrixGestion[exec][w] = 0;
        matrixRevenue[exec][w] = 0;
      });
    });

    // Procesar datos para las matrices
    mergedData.forEach(client => {
      // 1. Matriz de Recaudación (Se mantiene por Ejecutivo ASIGNADO al cliente - Portfolio Owner)
      const assignedExec = EXECUTIVES_LIST.find(e => client.ejecutivo.includes(e)) || "Otros";
      if (!matrixRevenue[assignedExec]) matrixRevenue[assignedExec] = { total: 0 };
      weeks.forEach(w => { if(!matrixRevenue[assignedExec][w]) matrixRevenue[assignedExec][w] = 0; });

      // --- CÁLCULO DE METAS POR EJECUTIVO (NUEVO) ---
      if (assignedExec !== "Otros") {
          // Meta: Suma de la deuda inicial (Vencidas * Cuota). Si Vencidas es 0, usamos 1 cuota (del mes).
          const initialDebt = (client.vencidas > 0 ? client.vencidas : 1) * client.cuota;
          executiveGoals[assignedExec].target += initialDebt;
          executiveGoals[assignedExec].collected += client.montoPagadoTotal;
      }

      if (client.montoPagadoTotal > 0 && client.lastUpdate) {
        const pDate = new Date(client.lastUpdate);
        const day = pDate.getDate();
        let weekTag = 'Semana 1';
        if (day > 7 && day <= 14) weekTag = 'Semana 2';
        else if (day > 14 && day <= 21) weekTag = 'Semana 3';
        else if (day > 21 && day <= 28) weekTag = 'Semana 4';
        else if (day > 28) weekTag = 'Semana 5';
        
        if (matrixRevenue[assignedExec][weekTag] !== undefined) {
          matrixRevenue[assignedExec][weekTag] += client.montoPagadoTotal;
          matrixRevenue[assignedExec].total += client.montoPagadoTotal;
        }
      }

      // 2. Matriz de Gestión (Se calcula por AUTOR de la gestión - Activity Owner)
      if (client.comentarios && client.comentarios.length > 0) {
          client.comentarios.forEach(comment => {
              const author = EXECUTIVES_LIST.find(e => comment.author && comment.author.includes(e));
              const week = comment.week || 'Semana 1';
              
              if (author && matrixGestion[author]) {
                  if (matrixGestion[author][week] !== undefined) {
                      matrixGestion[author][week]++;
                      matrixGestion[author].total++;
                  }
              }
          });
      }
    });

    // Helper para clic en matriz
    const handleMatrixClick = (exec, week) => {
        setDrillDown({ executive: exec, week: week });
        setView('list');
    };

    // Preparar datos para gráficos
    const revenueChartData = weeks.map(w => ({
      name: w,
      ...EXECUTIVES_LIST.reduce((acc, e) => ({ ...acc, [e]: matrixRevenue[e][w] }), {})
    }));

    const gestionChartData = weeks.map(w => ({
      name: w,
      ...EXECUTIVES_LIST.reduce((acc, e) => ({ ...acc, [e]: matrixGestion[e][w] }), {})
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

        {/* --- NUEVA SECCIÓN: METAS Y CUMPLIMIENTO POR EJECUTIVO --- */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6"><Target className="h-6 w-6 text-indigo-600" /> Metas y Cumplimiento por Ejecutivo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {EXECUTIVES_LIST.map(exec => {
                    const data = executiveGoals[exec];
                    const percentage = data.target > 0 ? (data.collected / data.target) * 100 : 0;
                    return (
                        <div key={exec} className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-all">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-slate-700 shadow-sm">{exec.charAt(0)}</div>
                                    <span className="font-bold text-slate-700">{exec}</span>
                                </div>
                                <span className={`text-xs font-black px-2 py-1 rounded-lg ${percentage >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {percentage.toFixed(1)}%
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recaudado</p>
                                    <p className="text-2xl font-black text-emerald-600">${data.collected.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meta / Base Asignada</p>
                                    <p className="text-lg font-bold text-slate-600">${data.target.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* --- MATRICES DE RENDIMIENTO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Gráfico Gestión */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-600" /> Actividad Realizada por Ejecutivo</h3>
                <span className="text-[10px] font-black text-blue-400 uppercase bg-blue-50 px-3 py-1 rounded-full">Gestiones Totales / Semanales</span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gestionChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                    <Legend iconType="circle" />
                    {EXECUTIVES_LIST.map((exec, idx) => (
                      <Bar key={exec} dataKey={exec} fill={COLORS[idx % 4]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Gráfico Recaudación */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-600" /> Recaudación por Cartera Asignada ($)</h3>
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
                    {EXECUTIVES_LIST.map((exec, idx) => (
                      <Bar key={exec} dataKey={exec} fill={COLORS[idx % 4]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* --- TABLAS DE DETALLE (MATRICES SOLICITADAS) --- */}
        <div className="space-y-8">
          {/* Matriz 1: Recaudación (RESTAURADA) */}
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
                  {EXECUTIVES_LIST.map(exec => (
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
                       const totalW = EXECUTIVES_LIST.reduce((sum, e) => sum + matrixRevenue[e][w], 0);
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
                <TableIcon className="h-5 w-5 text-blue-600" /> Matriz de Actividad (Gestiones Realizadas)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Haz clic en cualquier número para ver el detalle de clientes gestionados.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest text-left">Ejecutivo</th>
                    {weeks.map(w => <th key={w} className="px-6 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">{w}</th>)}
                    <th className="px-8 py-5 font-black text-blue-600 uppercase text-[10px] tracking-widest text-right bg-blue-50/50">Total Gestiones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {EXECUTIVES_LIST.map(exec => (
                    <tr key={exec} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-700">{exec}</td>
                      {weeks.map(w => (
                        <td 
                            key={w} 
                            onClick={() => handleMatrixClick(exec, w)}
                            className="px-6 py-5 text-center cursor-pointer hover:bg-blue-50 transition-colors group relative"
                        >
                          {matrixGestion[exec][w] > 0 ? (
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {matrixGestion[exec][w]}
                            </span>
                          ) : <span className="text-slate-200 group-hover:text-blue-300">-</span>}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none">
                             <MousePointerClick className="h-4 w-4" />
                          </div>
                        </td>
                      ))}
                      <td 
                        onClick={() => handleMatrixClick(exec, 'Total')}
                        className="px-8 py-5 text-right font-black text-blue-700 bg-blue-50/30 cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                          {matrixGestion[exec].total}
                      </td>
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
    const isFinancingView = view === 'financing';
    
    const filtered = mergedData.filter(c => {
      if (isFinancingView && !c.isManual) return false;
      if (!isFinancingView && view === 'list' && c.isManual) return false; 
      
      // LOGICA DE DRILL-DOWN (PRIORIDAD ALTA)
      if (drillDown) {
          // Buscamos si el cliente tiene AL MENOS UN comentario que coincida con el Ejecutivo y la Semana seleccionados
          const hasMatchingManagement = c.comentarios?.some(com => 
             (com.author === drillDown.executive) && 
             (drillDown.week === 'Total' || com.week === drillDown.week)
          );
          return hasMatchingManagement;
      }

      // Filtros Estándar (Solo se aplican si NO hay drill-down activo)
      if (filterExecutive !== 'Todos' && !c.ejecutivo.includes(filterExecutive)) return false;
      if (filterStatus === 'Gestionados' && !c.gestionado) return false;
      if (filterStatus === 'Pendientes' && c.gestionado) return false;

      // Filtro de Buscador (Siempre aplica)
      const matchSearch = c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchSearch;
    });

    return (
      <div className="space-y-6 animate-fade-in h-[calc(100vh-200px)] flex flex-col">
        
        {/* BANNER DE DRILL-DOWN ACTIVO */}
        {drillDown && (
            <div className="bg-blue-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg animate-fade-in-down mb-4 border border-blue-800">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-700 p-2 rounded-xl"><Filter className="h-5 w-5" /></div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-blue-300 tracking-wider">Filtro de Auditoría Activo</p>
                        <p className="font-bold text-lg">Viendo gestiones de <span className="text-blue-300">{drillDown.executive}</span> en <span className="text-blue-300">{drillDown.week}</span></p>
                    </div>
                </div>
                <button onClick={() => setDrillDown(null)} className="bg-white text-blue-900 px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-50 transition-colors flex items-center gap-2">
                    <X className="h-4 w-4" /> Limpiar Filtro
                </button>
            </div>
        )}

        {/* Executive Tabs/Cards Row (Solo visible si NO hay drill-down) */}
        {!drillDown && (
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

                {EXECUTIVES_LIST.map(exec => {
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
        )}

        <div className="flex flex-col md:flex-row gap-4 items-center no-print">
          <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 flex-1 w-full">
            <Search className="h-5 w-5 text-slate-400" />
            <input className="bg-transparent border-none outline-none w-full text-slate-700 font-medium" placeholder="Buscar por nombre, ID o cédula..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          {/* NUEVO: Filtro de Estado de Gestión (Solo si no hay Drill-down) */}
          {!drillDown && (
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-blue-500" />
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-transparent font-bold text-sm outline-none text-slate-700 cursor-pointer min-w-[120px]"
                    >
                      <option value="Todos">Ver Todos</option>
                      <option value="Gestionados">✅ Gestionados</option>
                      <option value="Pendientes">⏳ Pendientes</option>
                    </select>
              </div>
          )}

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
      {user && loginEmail ? (
        <>
          <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[50] no-print">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20"><Activity className="h-6 w-6" /></div>
                 <div>
                   <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">COBRANZAS 360</h1>
                   <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Intelligence Platform v{APP_VERSION}</p>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <div className="hidden md:flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                   {[
                     {id: 'dashboard', icon: Activity, label: 'Dashboard'},
                     {id: 'list', icon: Users, label: 'Cartera'},
                     {id: 'financing', icon: Wallet, label: 'Financiamiento'}, 
                     {id: 'alerts', icon: Bell, label: 'Alertas'}
                   ].map(item => (
                     <button key={item.id} onClick={() => { setView(item.id); setDrillDown(null); }} className={`px-6 py-2.5 rounded-[1rem] text-xs font-black uppercase transition-all flex items-center gap-2 ${view === item.id ? 'bg-white text-blue-600 shadow-md shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>
                       <item.icon className="h-4 w-4" /> {item.label}
                     </button>
                   ))}
                 </div>
                 
                 <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Usuario</span>
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><UserCheck className="h-3 w-3 text-emerald-500" /> {loginEmail || 'Conectado'}</span>
                    </div>
                    <button onClick={() => setShowChangePassword(true)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-3 rounded-xl transition-colors" title="Cambiar Contraseña">
                        <Key className="h-5 w-5" />
                    </button>
                    {loginEmail === ADMIN_EMAIL && (
                        <button onClick={() => setShowAdminPanel(true)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-3 rounded-xl transition-colors" title="Panel Admin">
                            <ShieldCheck className="h-5 w-5" />
                        </button>
                    )}
                    <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl transition-colors" title="Cerrar Sesión">
                        <LogOut className="h-5 w-5" />
                    </button>
                 </div>
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
          {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} showNotify={showNotify} />}
          {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} onSubmit={handleChangePassword} loading={loading} userEmail={loginEmail} />}
          {notification && <Notification {...notification} onClose={() => setNotification(null)} />}
          
          <ConfirmationModal 
            isOpen={showClearConfirm} 
            onClose={() => setShowClearConfirm(false)} 
            onConfirm={confirmClearBase} 
            title="¿Borrar Base Importada?" 
            message="Esta acción eliminará todos los datos cargados desde el archivo CSV. Los registros de financiamiento manual NO se verán afectados. ¿Desea continuar?" 
          />
        </>
      ) : (
        <>
            {showRegisterRequest ? (
                <RequestAccessForm onCancel={() => setShowRegisterRequest(false)} onSubmit={handleRegisterRequest} loading={loading} />
            ) : showForgotPassword ? (
                <ForgotPasswordForm onCancel={() => setShowForgotPassword(false)} onSubmit={handlePasswordRecovery} loading={loading} />
            ) : (
                <LoginPage onLogin={handleLogin} onRegisterRequest={() => setShowRegisterRequest(true)} onForgotPassword={() => setShowForgotPassword(true)} />
            )}
            {notification && <Notification {...notification} onClose={() => setNotification(null)} />}
        </>
      )}
    </div>
  );
}

const INITIAL_BASE_DATA = [
  { id: "0101ACV001003", grupo: "ACV001", puesto: "3", cliente: "MUÑOZ LOZADA MARIA IVONNE", celular: "0969541591", cuota: 250, vencidas: 3, saldo: 6000, cedula: "0930440896", ejecutivo: "Gianella", ciudad: "GUAYAQUIL", fechaAdjudicacion: "" },
  { id: "0101ADP005053", grupo: "ADP005", puesto: "53", cliente: "PAZ MIRALLA RAMON AURELIO", celular: "0959637842", cuota: 277, vencidas: 11, saldo: 5148, cedula: "0906516463", ejecutivo: "Fabiola", ciudad: "GUAYAQUIL", fechaAdjudicacion: "2023-10-15" },
  { id: "0101ADP005103", grupo: "ADP005", puesto: "103", cliente: "REYES SANTANA ELIO DEMECIO", celular: "0991413550", cuota: 167, vencidas: 0, saldo: 7332, cedula: "0912813714", ejecutivo: "Jordy", ciudad: "GUAYAQUIL", fechaAdjudicacion: "" },
  { id: "0101ACV001008", grupo: "ACV001", puesto: "8", cliente: "RAMIREZ CORDOVA SERGIO ENRIQUE", celular: "0985965387", cuota: 250, vencidas: 3, saldo: 5500, cedula: "0912141553", ejecutivo: "Miguel", ciudad: "GUAYAQUIL", fechaAdjudicacion: "2023-11-20" }
];