'use client';
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { Activity, LogOut, Trash2, Database, UploadCloud, CheckCircle, ShieldCheck } from 'lucide-react'; 
import * as XLSX from 'xlsx';

// CONFIGURACIÓN DE TU FIREBASE (Credenciales Reales de mgurumendi)
const firebaseConfig = {
  apiKey: "AIzaSyD6_6DCaB-n0K2akPct1gBIZucQZVNVmZI",
  authDomain: "cobranzas-360-web.firebaseapp.com",
  projectId: "cobranzas-360-web",
  storageBucket: "cobranzas-360-web.firebasestorage.app",
  messagingSenderId: "795609253006",
  appId: "1:795609253006:web:b447d8a3a0161ad213b3df"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Definición de la estructura de datos (para una mejor visualización en TS)
interface ClienteData {
  id: string;
  fechaCarga: string;
  usuarioCarga: string;
  [key: string]: any; // Permite campos variables del Excel
}

export default function SistemaCobranzas() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClienteData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false); // NUEVO ESTADO PARA EL MODAL

  // 1. CONTROL DE ACCESO CORPORATIVO (Restricción de dominio)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const email = currentUser.email || '';
        const domain = email.split('@')[1];
        if (domain === 'autoclubec.com' || domain === 'bopelual.com') {
          setUser(currentUser);
          fetchData();
        } else {
          // Si el correo no es corporativo, se cierra la sesión
          setMessage('Acceso restringido: Solo correos de AutoClub o Bopelual'); // Reemplazado alert()
          signOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    try {
      // Nota: No usamos orderBy para evitar errores de índice, filtramos en cliente
      const querySnapshot = await getDocs(collection(db, "cobranzas"));
      const docs: ClienteData[] = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() as ClienteData 
      }));
      setData(docs);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  // 2. LÓGICA PARA PROCESAR EXCEL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setUploading(true);
    setMessage('Procesando archivo... No cierres esta ventana.');

    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const excelData = XLSX.utils.sheet_to_json(ws);

      try {
        for (const row of excelData) {
          if (typeof row === 'object' && row !== null) {
            await addDoc(collection(db, "cobranzas"), {
              ...row as object,
              fechaCarga: new Date().toISOString(),
              usuarioCarga: auth.currentUser?.email
            });
          }
        }
        setMessage(`¡${excelData.length} registros subidos y guardados en la nube!`);
        fetchData();
      } catch (err) {
        setMessage('Error al subir los datos. Revisa la consola para más detalles.');
        console.error("Error al subir:", err);
      } finally {
        setUploading(false);
        e.target.value = ''; // Limpia el input file
      }
    };
    reader.readAsBinaryString(file);
  };

  // 3. LÓGICA PARA LIMPIEZA DE CIERRE DE MES (Inicia el modal)
  const vaciarBaseDeDatos = () => {
    setShowConfirmModal(true); // Muestra el modal de confirmación
  };
  
  // 4. HANDLER DE CONFIRMACIÓN DEL MODAL
  const handleConfirmVaciar = async () => {
    setShowConfirmModal(false); // Cierra el modal
    
    try {
      const querySnapshot = await getDocs(collection(db, "cobranzas"));
      const promesasBorrado = querySnapshot.docs.map((documento) => 
        deleteDoc(doc(db, "cobranzas", documento.id))
      );
      await Promise.all(promesasBorrado);
      setData([]); // Vacía la tabla local
      setMessage("Base de datos de cobranzas vaciada con éxito.");
    } catch (error) {
      setMessage("Error al vaciar la base. Revisa los permisos.");
      console.error("Error al vaciar la base:", error);
    }
  };


  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 text-blue-600 font-bold text-lg">
      Iniciando Sistema de Cobranzas...
    </div>
  );

  // PANTALLA DE INGRESO
  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white font-sans p-6 text-center">
        <div className="bg-blue-600 p-4 rounded-3xl mb-6 shadow-xl shadow-blue-100">
          <Activity size={48} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Cobranzas 360°</h1>
        <p className="text-gray-500 mb-8 max-w-xs">Acceso exclusivo para personal autorizado de AutoClub y Bopelual.</p>
        
        <button 
          onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
          className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5" alt="Google" />
          Ingresar con Google Corporativo
        </button>
      </div>
    );
  }

  // PANEL PRINCIPAL (DASHBOARD)
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* BARRA SUPERIOR */}
      <header className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="font-black text-xl leading-tight">Panel de Cobranzas</h2>
            <p className="text-xs text-green-500 font-bold uppercase tracking-widest">Conexión Segura</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <div className="text-right hidden sm:block pl-2">
            <p className="text-sm font-bold">{user.displayName || 'Usuario'}</p>
            <p className="text-[10px] text-gray-400 font-medium italic">{user.email}</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="bg-white p-2 rounded-xl text-red-500 shadow-sm border border-red-50 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* 1. CARGA DE EXCEL */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-black text-slate-800">Cargar Data Mensual</h3>
              <UploadCloud className="text-blue-500" size={32} />
            </div>
            
            <p className="text-sm text-slate-500 mb-6">Sube tu archivo `.xlsx` o `.xls`. El sistema subirá todas las filas a la base de datos de Firebase.</p>
            
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors cursor-pointer disabled:opacity-50"
            />
            {uploading && <p className="mt-4 text-blue-600 animate-pulse font-medium flex items-center gap-2"><Activity size={16} className="animate-spin"/> Subiendo datos... Por favor, no cierres esta ventana.</p>}
            {message && <p className={`mt-4 font-medium ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
          </div>

          {/* 2. ESTADO Y MANTENIMIENTO */}
          <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg flex flex-col justify-between">
            <div className='mb-6'>
                <Database className="mb-2" size={32} />
                <h3 className="text-xl font-bold mb-1">Base de Datos Segura</h3>
                <p className="opacity-80 text-sm">Protegida por reglas corporativas de Firebase.</p>
            </div>
            
            <button 
                onClick={vaciarBaseDeDatos}
                className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
            >
                <Trash2 size={18}/> Limpiar Data (Cierre Mensual)
            </button>
          </div>
        </div>

        {/* TABLA DE REGISTROS RECIENTES */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-black text-xl text-slate-800">Registros Recientes ({data.length})</h3>
            <button onClick={fetchData} className="text-sm text-blue-600 font-medium hover:underline">
                Actualizar Lista
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left">
              <thead className="bg-white text-slate-500 text-xs uppercase sticky top-0">
                <tr>
                  <th className="p-4">ID de Firebase</th>
                  <th className="p-4">Fecha Carga</th>
                  <th className="p-4">Cargado por</th>
                  {/* Aquí podrías agregar más columnas del Excel para visualización rápida */}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400 italic">No hay registros cargados en la base de datos.</td>
                    </tr>
                ) : (
                    data.slice(0, 10).map((item) => ( // Muestra solo los 10 más recientes
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-mono text-xs text-slate-700">{item.id}</td>
                            <td className="p-4 text-sm text-slate-500">{new Date(item.fechaCarga).toLocaleDateString()}</td>
                            <td className="p-4 text-sm text-slate-500">{item.usuarioCarga}</td>
                        </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4 text-center">Mostrando los 10 registros más recientes. Todos los datos están accesibles en la consola de Firebase.</p>
      </main>

      {/* MODAL DE CONFIRMACIÓN CUSTOM (REEMPLAZA A window.confirm) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
            <h4 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2"><Trash2 /> Confirmar Limpieza de Base</h4>
            <p className="text-slate-700 mb-6">
              Esta acción es irreversible y borrará **TODOS** los datos de cobranzas en Firebase. ¿Desea continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmVaciar}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Sí, Borrar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}