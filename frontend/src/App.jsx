import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search, 
  Bell, 
  User as UserIcon,
  Factory,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from './services/api';

const App = () => {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState('dashboard');
  const [showNewPO, setShowNewPO] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({ supplier: '', date: '', total_amount: '' });
  const [selectedPO, setSelectedPO] = useState(null);
  const [poApprovals, setPoApprovals] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [selectedForLogin, setSelectedForLogin] = useState(null);
  const [poFile, setPoFile] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState('users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showAddDept, setShowAddDept] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', role: 'Procurement Engineer', email: '', password: 'password123', profile_photo: null });
  const [editUserForm, setEditUserForm] = useState({ user_id: '', name: '', role: 'Procurement Engineer', email: '', password: '' });
  const [newPlantForm, setNewPlantForm] = useState({ name: '', location: '' });
  const [newDeptForm, setNewDeptForm] = useState({ name: '' });
  const [adminData, setAdminData] = useState({ plants: [], departments: [], auditLogs: [] });
  const [adminLoading, setAdminLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [poDetailsForm, setPoDetailsForm] = useState({
    material_details: 'Standard Industrial Raw Materials',
    quantity: 1,
    technical_details: 'All technical specifications met.',
    remarks: 'Urgent procurement request.'
  });

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchPOs(), fetchUsers(), fetchAdminData()]);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedPO) {
      fetchPOApprovals(selectedPO.po_id);
    }
  }, [selectedPO]);

  useEffect(() => {
    if (showAdminPanel) {
      fetchAdminData();
    }
  }, [showAdminPanel, adminTab]);

  useEffect(() => {
    if (pos.length > 0 && currentUser) {
      const pendingForMe = pos.filter(p => p.status.includes(currentUser.role));
      const newNotifs = pendingForMe.map(p => ({
        id: `notif-${p.po_id}`,
        title: 'Pending Approval',
        message: `PO #${p.po_id.toString().padStart(4, '0')} requires your signature.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        po: p
      }));
      setNotifications(newNotifs);
    }
  }, [pos, currentUser]);

  const fetchAdminData = async () => {
    setAdminLoading(true);
    try {
      const results = await Promise.allSettled([
        api.getPlants(),
        api.getDepartments(),
        api.getAuditLogs()
      ]);
      
      setAdminData({
        plants: results[0].status === 'fulfilled' ? results[0].value.data : [],
        departments: results[1].status === 'fulfilled' ? results[1].value.data : [],
        auditLogs: results[2].status === 'fulfilled' ? results[2].value.data : []
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!adminData.auditLogs.length) return;
    
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Target PO', 'Comments'];
    const csvData = adminData.auditLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.user_name,
      log.role,
      log.approval_status,
      `#PO-${log.po_id.toString().padStart(4, '0')}`,
      log.comments
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLog = () => {
    window.print();
  };

  const handlePrintPO = () => {
    window.print();
  };

  const fetchPOApprovals = async (poId) => {
    try {
      const response = await api.getPOApprovals(poId);
      setPoApprovals(response.data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  const fetchPOs = async () => {
    try {
      const response = await api.getPOs();
      setPos(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching POs:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      const usersData = response.data;
      setUsers(usersData);
      
      // If no users are returned from the database yet, use the seeded defaults
      if (usersData.length === 0 && !currentUser) {
        const defaultUser = { 
          user_id: 1, 
          name: 'System Admin', 
          role: 'Admin', 
          email: 'admin@factory.com',
          password: 'password123' 
        };
        setUsers([
          defaultUser,
          { user_id: 2, name: 'Procurement Engineer', role: 'Procurement Engineer', email: 'procurement@factory.com', password: 'password123' }
        ]);
        setCurrentUser(defaultUser);
      } else if (usersData.length > 0 && !currentUser) {
        setCurrentUser(usersData[0]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback in case of API error during deployment
      if (!currentUser) {
        const fallbackUser = { user_id: 1, name: 'System Admin', role: 'Admin', email: 'admin@factory.com', password: 'password123' };
        setUsers([fallbackUser]);
        setCurrentUser(fallbackUser);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUserForm);
      setNewUserForm({ name: '', role: 'Procurement Engineer', email: '', password: 'password123', profile_photo: null });
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(editUserForm.user_id, editUserForm);
      setShowEditUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (currentUser.user_id === id) {
      alert("You cannot delete your own account.");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    
    try {
      await api.deleteUser(id);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMsg = error.response?.data?.error || "Failed to delete user.";
      alert(errorMsg);
    }
  };

  const handleDeletePO = async (id) => {
    if (!window.confirm(`Are you sure you want to delete PO #PO-${id.toString().padStart(4, '0')}? This will remove all associated history and approvals.`)) return;
    
    try {
      await api.deletePO(id);
      fetchPOs();
    } catch (error) {
      console.error('Error deleting PO:', error);
      alert("Failed to delete Purchase Order.");
    }
  };

  const handleAddPlant = async (e) => {
    e.preventDefault();
    try {
      await api.createPlant(newPlantForm);
      setNewPlantForm({ name: '', location: '' });
      setShowAddPlant(false);
      fetchAdminData();
    } catch (error) {
      console.error('Error adding plant:', error);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    try {
      await api.createDepartment(newDeptForm);
      setNewDeptForm({ name: '' });
      setShowAddDept(false);
      fetchAdminData();
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  const handleDeletePlant = async (id) => {
    if (!window.confirm('Delete this plant?')) return;
    try {
      await api.deletePlant(id);
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting plant:', error);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await api.deleteDepartment(id);
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const handleUpdateSignature = async (userId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert image to base64 for simulation/storage
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await api.updateUserSignature(userId, { signature_path: reader.result });
        fetchUsers(); // Refresh users to show new signature
      } catch (error) {
        console.error('Error updating signature:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePhoto = async (userId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await api.updateUserPhoto(userId, { profile_photo: reader.result });
        fetchUsers();
      } catch (error) {
        console.error('Error updating profile photo:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = async (userId) => {
    try {
      await api.updateUserSignature(userId, { signature_path: null });
      fetchUsers();
    } catch (error) {
      console.error('Error removing signature:', error);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      const poData = {
        ...formData,
        ...poDetailsForm,
        created_by: currentUser.user_id
      };
      const response = await api.createPO(poData);
      const newPoId = response.data.po_id;
      
      // If creator is Procurement Engineer, automatically add first signature
      if (currentUser?.role === 'Procurement Engineer') {
        await api.submitApproval({
          po_id: newPoId,
          user_id: currentUser.user_id,
          approval_status: 'Approved',
          comments: 'PO Document uploaded and verified.'
        });
      }
      
      setFormData({ supplier: '', date: '', total_amount: '' });
      setPoFile(null);
      setShowNewPO(false);
      fetchPOs();
    } catch (error) {
      console.error('Error creating PO:', error);
    }
  };

  const getFilteredPOs = () => {
    let filtered = [...pos];
    
    // Main sidebar filtering
    if (mainTab === 'approvals') {
      filtered = pos.filter(p => p.status.includes(currentUser?.role || 'NONE'));
    } else if (mainTab === 'history') {
      filtered = pos.filter(p => p.status === 'Approved' || p.status === 'Rejected');
    } else if (mainTab === 'pos') {
      // Show all for POs tab
    }

    // Sub-tab filtering (All/Pending/Completed)
    if (activeTab === 'pending') {
      return filtered.filter(p => p.status.startsWith('Pending'));
    } else if (activeTab === 'completed') {
      return filtered.filter(p => p.status === 'Approved' || p.status === 'Rejected');
    }
    
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Rejected': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'Draft': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      case 'Pending Reporting Manager': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Pending Plant Manager 1': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Pending Plant Manager 2': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Pending Global Head': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'Pending MD': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const calculateStats = () => {
    const total = pos.length;
    const pending = pos.filter(p => p.status.startsWith('Pending')).length;
    const approved = pos.filter(p => p.status === 'Approved').length;
    const rejected = pos.filter(p => p.status === 'Rejected').length;

    // Calculate growth (POs from last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPOs = pos.filter(p => new Date(p.date) >= sevenDaysAgo).length;
    const growth = total > 0 ? Math.round((recentPOs / total) * 100) : 0;

    const approvedRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const rejectedRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      growth: `+${growth}%`,
      pendingIndicator: `+${pending}`,
      approvedRate: `${approvedRate}%`,
      rejectedRate: rejectedRate > 0 ? `-${rejectedRate}%` : '0%'
    };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              background: white !important;
              color: black !important;
              overflow: visible !important;
            }
            .print-po-container {
              width: 210mm;
              height: 297mm;
              padding: 20mm;
              margin: 0 auto;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}
      </style>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f172a] border-r border-white/5 z-50 print:hidden">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Factory className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white uppercase">Digital Project</h1>
          </div>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={mainTab === 'dashboard'} 
            onClick={() => setMainTab('dashboard')}
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Purchase Orders" 
            active={mainTab === 'pos'} 
            onClick={() => setMainTab('pos')}
          />
          <NavItem 
            icon={<CheckCircle2 size={20} />} 
            label="Approvals" 
            active={mainTab === 'approvals'} 
            badge={pos.filter(p => p.status.startsWith('Pending')).length.toString()} 
            onClick={() => setMainTab('approvals')}
          />
          <NavItem 
            icon={<Clock size={20} />} 
            label="History" 
            active={mainTab === 'history'} 
            onClick={() => setMainTab('history')}
          />
          {currentUser?.role === 'Admin' && (
            <button 
              onClick={() => setShowAdminPanel(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5 mt-4 border border-blue-500/20 bg-blue-500/5"
            >
              <ShieldCheck size={20} className="text-blue-400" />
              <span className="text-sm font-semibold">Admin Panel</span>
            </button>
          )}
        </nav>

        <div className="absolute bottom-8 left-4 right-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/5">
            <p className="text-xs font-medium text-blue-400 mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">All Systems Operational</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64 print:pl-0">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-40 print:hidden">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-96">
            <Search size={18} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search POs, Suppliers, or Dates..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 transition-colors rounded-xl ${showNotifications ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617] animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Notifications</p>
                      <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-[10px] font-bold rounded-full">
                        {notifications.length} New
                      </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={32} className="mx-auto text-slate-700 mb-3 opacity-20" />
                          <p className="text-xs text-slate-500 font-medium">No new notifications</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              setSelectedPO(notif.po);
                              setShowNotifications(false);
                            }}
                            className="w-full p-4 border-b border-white/5 hover:bg-white/[0.02] transition-all text-left group"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-tighter">{notif.title}</p>
                              <p className="text-[10px] text-slate-600 font-medium">{notif.time}</p>
                            </div>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed group-hover:text-white transition-colors">{notif.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 bg-white/5 text-center">
                        <button className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-[1px] bg-white/5" />
            <div className="relative">
              <button 
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all"
              >
                <div className="text-right">
                  <p className="text-base font-bold text-white leading-none mb-1">{currentUser?.name || 'Guest User'}</p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">{currentUser?.role || 'No Role'}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-xl shadow-blue-500/20 overflow-hidden border-2 border-white/10 group-hover:border-blue-500/50 transition-all">
                  {currentUser?.profile_photo ? (
                    <img src={currentUser.profile_photo} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.split(' ').map(n => n[0]).join('') || '??'
                  )}
                </div>
              </button>

              <AnimatePresence>
                {showRoleSwitcher && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Switch User Role</p>
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {users.map(user => (
                        <div key={user.user_id} className="mb-2 last:mb-0">
                          <button
                            onClick={() => {
                              if (currentUser?.user_id === user.user_id) return;
                              setLoginError('');
                              setLoginPassword('');
                              // Select user but wait for password
                              const selected = users.find(u => u.user_id === user.user_id);
                              setSelectedForLogin(user);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 ${currentUser?.user_id === user.user_id ? 'bg-blue-600/10 border border-blue-600/20' : ''}`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                              {user.profile_photo ? (
                                <img src={user.profile_photo} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                user.name.split(' ').map(n => n[0]).join('')
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-white">{user.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase">{user.role}</p>
                            </div>
                          </button>
                          
                          {selectedForLogin?.user_id === user.user_id && currentUser?.user_id !== user.user_id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="px-3 pb-3 pt-1 space-y-2"
                            >
                              <input 
                                type="password"
                                placeholder="Enter Password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 transition-all"
                              />
                              {loginError && <p className="text-[10px] text-rose-500 font-medium">{loginError}</p>}
                              <button 
                                onClick={() => {
                                  // In a real app, this would be a backend check
                                  if (loginPassword === user.password || (user.role === 'Admin' && loginPassword === 'admin123')) {
                                    setCurrentUser(user);
                                    setShowRoleSwitcher(false);
                                    if (user.role !== 'Admin') {
                                      setShowAdminPanel(false);
                                    }
                                    setSelectedForLogin(null);
                                    setLoginPassword('');
                                    setLoginError('');
                                  } else {
                                    setLoginError('Incorrect password');
                                  }
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded-lg transition-all"
                              >
                                Verify & Switch
                              </button>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 print:hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {mainTab === 'dashboard' && 'PO Dashboard'}
                {mainTab === 'pos' && 'Purchase Orders'}
                {mainTab === 'approvals' && 'Pending Approvals'}
                {mainTab === 'history' && 'Workflow History'}
              </h2>
              <p className="text-slate-400 mt-1">
                {mainTab === 'dashboard' && 'Manage and track your procurement workflows.'}
                {mainTab === 'pos' && 'View and manage all purchase orders.'}
                {mainTab === 'approvals' && 'Review and sign pending procurement requests.'}
                {mainTab === 'history' && 'Track completed and historical workflow actions.'}
              </p>
            </div>
            {(mainTab === 'dashboard' || mainTab === 'pos') && (
              <button 
                onClick={() => setShowNewPO(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/25 active:scale-95"
              >
                <Plus size={20} />
                New Purchase Order
              </button>
            )}
          </div>

          {/* Stats - Only on Dashboard */}
          {mainTab === 'dashboard' && (
            <div className="grid grid-cols-4 gap-6 mb-10">
              <StatCard icon={<FileText className="text-blue-400" />} label="Total POs" value={stats.total} change={stats.growth} />
              <StatCard icon={<Clock className="text-amber-400" />} label="Pending" value={stats.pending} change={stats.pendingIndicator} />
              <StatCard icon={<CheckCircle2 className="text-emerald-400" />} label="Approved" value={stats.approved} change={stats.approvedRate} />
              <StatCard icon={<AlertCircle className="text-rose-400" />} label="Rejected" value={stats.rejected} change={stats.rejectedRate} />
            </div>
          )}

          {/* PO List Table */}
          <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <TabButton label="All" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                <TabButton label="Pending" active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} />
                <TabButton label="Completed" active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} />
              </div>
              {mainTab === 'dashboard' && (
                <button 
                  onClick={() => setMainTab('history')}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  View History <ArrowRight size={14} />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4">PO ID</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          Loading orders...
                        </div>
                      </td>
                    </tr>
                  ) : getFilteredPOs().length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                        No purchase orders found.
                      </td>
                    </tr>
                  ) : (
                    getFilteredPOs().map((po) => (
                      <tr key={po.po_id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-blue-400 font-bold">#PO-{po.po_id.toString().padStart(4, '0')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                              <ShieldCheck size={16} className="text-slate-400" />
                            </div>
                            <span className="font-medium text-white">{po.supplier}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(po.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">
                          ${parseFloat(po.total_amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(po.status)}`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setSelectedPO(po)}
                              className="p-2 text-slate-500 hover:text-white transition-colors"
                              title="View Details"
                            >
                              <ArrowRight size={18} />
                            </button>
                            {mainTab === 'history' && currentUser?.role === 'Admin' && (
                              <button 
                                onClick={() => handleDeletePO(po.po_id)}
                                className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                                title="Delete from History"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* New PO Modal */}
      <AnimatePresence>
        {showNewPO && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewPO(false)}
              className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">Create Purchase Order</h3>
                <p className="text-slate-400 text-sm mb-8">Enter the details for the new procurement request.</p>
                
                <form className="space-y-6" onSubmit={handleCreatePO}>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Supplier Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        placeholder="e.g. Industrial Steel Co."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Order Date</label>
                      <input 
                        type="date" 
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Amount ($)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Quantity</label>
                      <input 
                        type="number" 
                        required
                        value={poDetailsForm.quantity}
                        onChange={(e) => setPoDetailsForm({ ...poDetailsForm, quantity: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Material Details</label>
                      <input 
                        type="text" 
                        required
                        value={poDetailsForm.material_details}
                        onChange={(e) => setPoDetailsForm({ ...poDetailsForm, material_details: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Technical Specifications</label>
                    <textarea 
                      required
                      value={poDetailsForm.technical_details}
                      onChange={(e) => setPoDetailsForm({ ...poDetailsForm, technical_details: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-20 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Upload PO Document (PDF/Image)</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        required
                        onChange={(e) => setPoFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-xl px-4 py-6 text-center group-hover:border-blue-500/50 transition-all">
                        <Plus className="mx-auto text-slate-500 mb-2 group-hover:text-blue-400 transition-colors" size={24} />
                        <p className="text-xs text-slate-400 font-medium">
                          {poFile ? poFile.name : 'Click or drag PO file here to upload'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowNewPO(false)}
                      className="flex-1 px-6 py-3 rounded-xl font-semibold bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                    >
                      Generate PO
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PO Details Modal */}
      <AnimatePresence>
        {selectedPO && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 print:p-0 print:block print:static">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPO(null)}
              className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md print:hidden"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden print:bg-white print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none"
            >
              <div className="p-8 print:p-0">
                <div className="flex items-center justify-between mb-8 print:hidden">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-1 rounded-md border border-blue-400/20">
                      PO Details
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-2">#PO-{selectedPO.po_id.toString().padStart(4, '0')}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(selectedPO.status)}`}>
                    {selectedPO.status}
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 print:border-none print:p-0 print:m-0">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 print:hidden">
                    <FileText size={16} className="text-blue-400" />
                    PO Document Preview
                  </h4>
                  
                  {/* Digital Paper Simulation */}
                  <div className="bg-white text-slate-900 p-8 shadow-2xl rounded-sm min-h-[400px] relative overflow-hidden print:shadow-none print:p-12 print:w-[210mm] print:min-h-[297mm] print:mx-auto print-po-container">
                    <div className="flex justify-between border-b-2 border-slate-200 pb-4 mb-6">
                      <div>
                        <h2 className="text-2xl font-black tracking-tighter text-blue-900">PURCHASE ORDER</h2>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Digital Project</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400">PO NUMBER</p>
                        <p className="text-sm font-black text-slate-900">#PO-{selectedPO.po_id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8 text-[11px]">
                      <div>
                        <p className="font-bold text-slate-400 uppercase mb-1">Supplier</p>
                        <p className="text-sm font-bold">{selectedPO.supplier}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-400 uppercase mb-1">Date</p>
                        <p className="text-sm font-bold">{new Date(selectedPO.date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="border border-slate-100 rounded-lg overflow-hidden mb-8">
                      <table className="w-full text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-4">Industrial Grade Raw Materials and Logistics</td>
                            <td className="px-4 py-4 text-right font-bold">${parseFloat(selectedPO.total_amount).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Signature Slots */}
                    <div className="mt-auto pt-8 border-t border-slate-100">
                      <div className="grid grid-cols-6 gap-1">
                        <SignatureSlot role="Procurement Eng." approval={poApprovals.find(a => a.role === 'Procurement Engineer')} />
                        <SignatureSlot role="Rep. Manager" approval={poApprovals.find(a => a.role === 'Reporting Manager')} />
                        <SignatureSlot role="Plant Mgr 1" approval={poApprovals.find(a => a.role === 'Plant Manager 1')} />
                        <SignatureSlot role="Plant Mgr 2" approval={poApprovals.find(a => a.role === 'Plant Manager 2')} />
                        <SignatureSlot role="Global Head" approval={poApprovals.find(a => a.role === 'Global Head')} />
                        <SignatureSlot role="MD" approval={poApprovals.find(a => a.role === 'MD')} />
                      </div>
                    </div>

                    {/* Watermark */}
                    {selectedPO.status === 'Approved' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] rotate-[-35deg]">
                        <p className="text-8xl font-black border-8 border-emerald-600 text-emerald-600 px-8 py-4">APPROVED</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 print:hidden">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-400" />
                    Workflow Action
                  </h4>
                  <div className="flex flex-col gap-4">
                    {selectedPO.status === 'Approved' && (
                      <button 
                        onClick={handlePrintPO}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <FileText size={20} />
                        Download / Print Signed PO
                      </button>
                    )}
                    
                    {selectedPO.status !== 'Approved' && selectedPO.status !== 'Rejected' && (
                      <div className="flex gap-4">
                        <button 
                          onClick={async () => {
                            try {
                              await api.submitApproval({
                                po_id: selectedPO.po_id,
                                user_id: currentUser.user_id,
                                approval_status: 'Approved',
                                comments: 'Verified and signed via Digital Portal.'
                              });
                              // Refresh current PO data instead of closing
                              const updatedPOs = await api.getPOs();
                              setPos(updatedPOs.data);
                              const currentPO = updatedPOs.data.find(p => p.po_id === selectedPO.po_id);
                              setSelectedPO(currentPO);
                              fetchPOApprovals(selectedPO.po_id);
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                        >
                          Approve & Sign
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await api.submitApproval({
                                po_id: selectedPO.po_id,
                                user_id: currentUser.user_id,
                                approval_status: 'Rejected',
                                comments: 'Insufficient details or error in documentation.'
                              });
                              setSelectedPO(null);
                              fetchPOs();
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 font-bold py-3 rounded-xl border border-rose-600/20 transition-all active:scale-95"
                        >
                          Reject Order
                        </button>
                      </div>
                    )}

                    {selectedPO.status === 'Rejected' && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                        <p className="text-rose-500 font-bold">This Purchase Order has been Rejected</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedPO(null)}
                  className="w-full text-center text-sm text-slate-500 hover:text-white transition-colors py-2 print:hidden"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
       </AnimatePresence>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminPanel && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminPanel(false)}
              className="absolute inset-0 bg-[#020617]/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex h-[80vh]"
            >
              {/* Admin Sidebar */}
              <div className="w-64 border-r border-white/5 p-6 bg-white/[0.02] print:hidden">
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                  <ShieldCheck className="text-blue-400" /> Admin
                </h3>
                <nav className="space-y-2">
                  <AdminNavItem label="User Management" active={adminTab === 'users'} onClick={() => setAdminTab('users')} />
                  <AdminNavItem label="Signature Vault" active={adminTab === 'signatures'} onClick={() => setAdminTab('signatures')} />
                  <AdminNavItem label="Plant & Dept" active={adminTab === 'org'} onClick={() => setAdminTab('org')} />
                  <AdminNavItem label="Audit Logs" active={adminTab === 'logs'} onClick={() => setAdminTab('logs')} />
                </nav>
              </div>

              {/* Admin Content */}
              <div className="flex-1 pt-12 pb-8 px-8 overflow-y-auto">
                {adminTab === 'users' && (
                  <>
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="text-2xl font-bold text-white">User Management</h4>
                      <button 
                        onClick={() => setShowAddUser(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={16} /> Add New User
                      </button>
                    </div>

                    <div className="space-y-4">
                      {users.map(user => (
                        <div key={user.user_id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="relative group/photo">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-blue-400 overflow-hidden border border-white/10">
                                {user.profile_photo ? (
                                  <img src={user.profile_photo} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                  user.name.split(' ').map(n => n[0]).join('')
                                )}
                              </div>
                              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer rounded-xl">
                                <Plus size={16} className="text-white" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => handleUpdatePhoto(user.user_id, e)}
                                />
                              </label>
                            </div>
                            <div>
                              <p className="font-bold text-white">{user.name}</p>
                              <p className="text-xs text-slate-500 uppercase tracking-wider">{user.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditUserForm(user);
                                setShowEditUser(true);
                              }}
                              className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                              title="Edit User"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.user_id, user.name)}
                              className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
                              <AlertCircle size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {adminTab === 'signatures' && (
                   <div className="space-y-6">
                     <div className="flex justify-between items-center mb-8">
                       <h4 className="text-2xl font-bold text-white">Signature Vault</h4>
                       <p className="text-xs text-slate-500">Secure storage for authorized digital signatures</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       {users.filter(u => u.role !== 'Admin').map(user => (
                         <div key={user.user_id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex flex-col items-center group hover:border-blue-500/30 transition-all">
                           <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-2xl text-blue-400 mb-4">
                             {user.name.split(' ').map(n => n[0]).join('')}
                           </div>
                           <p className="font-bold text-white mb-1">{user.name}</p>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-6">{user.role}</p>
                           
                           <div className="w-full h-24 bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 group-hover:border-blue-200 transition-all relative overflow-hidden">
                             {user.signature_path ? (
                               <img src={user.signature_path} alt="Signature" className="h-full object-contain p-2" />
                             ) : (
                               <span className="font-serif italic text-2xl text-slate-300 pointer-events-none">{user.name}</span>
                             )}
                             <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all">
                               <label className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl cursor-pointer">
                                 Update Image
                                 <input 
                                   type="file" 
                                   className="hidden" 
                                   accept="image/*"
                                   onChange={(e) => handleUpdateSignature(user.user_id, e)}
                                 />
                               </label>
                               {user.signature_path && (
                                 <button 
                                   onClick={() => handleRemoveSignature(user.user_id)}
                                   className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl"
                                 >
                                   Remove Sign
                                 </button>
                               )}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {adminTab === 'org' && (
                   <div className="space-y-8">
                     <div className="grid grid-cols-2 gap-8">
                       {/* Plants */}
                       <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <h5 className="font-bold text-white flex items-center gap-2"><Factory size={16} /> Plants</h5>
                           <button onClick={() => setShowAddPlant(true)} className="text-blue-400 hover:text-blue-300"><Plus size={16} /></button>
                         </div>
                         <div className="space-y-2">
                           {adminData.plants.map(plant => (
                             <div key={plant.plant_id} className="bg-white/[0.03] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                               <div>
                                 <p className="text-sm font-bold text-white">{plant.name}</p>
                                 <p className="text-[10px] text-slate-500 uppercase">{plant.location}</p>
                               </div>
                               <button onClick={() => handleDeletePlant(plant.plant_id)} className="text-slate-600 hover:text-rose-500"><AlertCircle size={14} /></button>
                             </div>
                           ))}
                         </div>
                       </div>
                       {/* Departments */}
                       <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <h5 className="font-bold text-white flex items-center gap-2"><ShieldCheck size={16} /> Departments</h5>
                           <button onClick={() => setShowAddDept(true)} className="text-blue-400 hover:text-blue-300"><Plus size={16} /></button>
                         </div>
                         <div className="space-y-2">
                           {adminData.departments.map(dept => (
                             <div key={dept.dept_id} className="bg-white/[0.03] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                               <p className="text-sm font-bold text-white">{dept.name}</p>
                               <button onClick={() => handleDeleteDept(dept.dept_id)} className="text-slate-600 hover:text-rose-500"><AlertCircle size={14} /></button>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>

                     {/* Add Plant Modal */}
                     <AnimatePresence>
                       {showAddPlant && (
                         <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddPlant(false)} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" />
                           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-[#0f172a] rounded-2xl border border-white/10 p-8 shadow-2xl">
                             <h5 className="text-xl font-bold text-white mb-6">Add New Plant</h5>
                             <form onSubmit={handleAddPlant} className="space-y-4">
                               <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Plant Name</label>
                                 <input type="text" required value={newPlantForm.name} onChange={(e) => setNewPlantForm({ ...newPlantForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. South Factory" />
                               </div>
                               <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Location</label>
                                 <input type="text" required value={newPlantForm.location} onChange={(e) => setNewPlantForm({ ...newPlantForm, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. Industrial Area" />
                               </div>
                               <div className="pt-4 flex gap-3">
                                 <button type="button" onClick={() => setShowAddPlant(false)} className="flex-1 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
                                 <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Add Plant</button>
                               </div>
                             </form>
                           </motion.div>
                         </div>
                       )}
                     </AnimatePresence>

                     {/* Add Dept Modal */}
                     <AnimatePresence>
                       {showAddDept && (
                         <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddDept(false)} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" />
                           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-[#0f172a] rounded-2xl border border-white/10 p-8 shadow-2xl">
                             <h5 className="text-xl font-bold text-white mb-6">Add New Department</h5>
                             <form onSubmit={handleAddDept} className="space-y-4">
                               <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Department Name</label>
                                 <input type="text" required value={newDeptForm.name} onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. Quality Control" />
                               </div>
                               <div className="pt-4 flex gap-3">
                                 <button type="button" onClick={() => setShowAddDept(false)} className="flex-1 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
                                 <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Add Department</button>
                               </div>
                             </form>
                           </motion.div>
                         </div>
                       )}
                     </AnimatePresence>
                   </div>
                 )}

                 {adminTab === 'logs' && (
                   <div className="space-y-6 print:m-0 print:p-0">
                     <div className="flex justify-between items-center print:hidden">
                       <h4 className="text-2xl font-bold text-white">System Audit Logs</h4>
                       <div className="flex gap-2">
                         <button 
                           onClick={handleExportCSV}
                           className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2"
                         >
                           <FileText size={14} /> Export CSV
                         </button>
                         <button 
                           onClick={handlePrintLog}
                           className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2"
                         >
                           <Clock size={14} /> Print Log
                         </button>
                       </div>
                     </div>
                     <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden print:border-none print:bg-white print:text-black">
                       <table className="w-full text-left text-xs">
                         <thead className="bg-white/[0.05] border-b border-white/5 print:bg-slate-100 print:border-slate-200">
                           <tr>
                             <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest print:text-slate-700">Timestamp</th>
                             <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest print:text-slate-700">User</th>
                             <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest print:text-slate-700">Action</th>
                             <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest print:text-slate-700">Target PO</th>
                             <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest print:text-slate-700">Comments</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5 print:divide-slate-200">
                           {adminLoading ? (
                             <tr>
                               <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                                 <div className="flex flex-col items-center gap-3">
                                   <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                   Loading audit trail...
                                 </div>
                               </td>
                             </tr>
                           ) : adminData.auditLogs.length === 0 ? (
                             <tr>
                               <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                                 No audit logs found.
                               </td>
                             </tr>
                           ) : (
                             adminData.auditLogs.map(log => (
                               <tr key={log.approval_id} className="hover:bg-white/[0.01] print:hover:bg-transparent">
                                 <td className="px-6 py-4 text-slate-400 font-mono print:text-slate-600">
                                   {new Date(log.timestamp).toLocaleString()}
                                 </td>
                                 <td className="px-6 py-4">
                                   <p className="font-bold text-white print:text-black">{log.user_name}</p>
                                   <p className="text-[10px] text-slate-500 uppercase">{log.role}</p>
                                 </td>
                                 <td className="px-6 py-4">
                                   <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${log.approval_status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                     {log.approval_status}
                                   </span>
                                 </td>
                                 <td className="px-6 py-4 font-bold text-blue-400 print:text-blue-700">
                                   #PO-{log.po_id.toString().padStart(4, '0')}
                                 </td>
                                 <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate print:text-slate-700">
                                   "{log.comments}"
                                 </td>
                               </tr>
                             ))
                           )}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 )}
                
                {/* Add User Sub-Modal */}
                <AnimatePresence>
                  {showAddUser && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAddUser(false)}
                        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md bg-[#0f172a] rounded-2xl border border-white/10 p-8 shadow-2xl"
                      >
                        <h5 className="text-xl font-bold text-white mb-6">Create Authorized User</h5>
                        <form onSubmit={handleAddUser} className="space-y-4">
                          <div className="flex flex-col items-center mb-6">
                            <div className="relative group">
                              <div className="w-20 h-20 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                                {newUserForm.profile_photo ? (
                                  <img src={newUserForm.profile_photo} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                  <UserIcon size={32} className="text-slate-600" />
                                )}
                              </div>
                              <label className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all rounded-2xl">
                                <Plus size={20} className="text-white" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setNewUserForm({ ...newUserForm, profile_photo: reader.result });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Upload Photo</p>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Full Name</label>
                            <input 
                              type="text" required
                              value={newUserForm.name}
                              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email</label>
                            <input 
                              type="email" required
                              value={newUserForm.email}
                              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Role</label>
                            <select 
                              value={newUserForm.role}
                              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                              className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                            >
                              <option>Procurement Engineer</option>
                              <option>Reporting Manager</option>
                              <option>Plant Manager 1</option>
                              <option>Plant Manager 2</option>
                              <option>Global Head</option>
                              <option>MD</option>
                              <option>Admin</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Set Password</label>
                            <input 
                              type="text" required
                              value={newUserForm.password}
                              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                              placeholder="Create password"
                            />
                          </div>
                          <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
                            <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Create User</button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Edit User Modal */}
                <AnimatePresence>
                  {showEditUser && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEditUser(false)}
                        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md bg-[#0f172a] rounded-2xl border border-white/10 p-8 shadow-2xl"
                      >
                        <h5 className="text-xl font-bold text-white mb-6">Edit Authorized User</h5>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Full Name</label>
                            <input 
                              type="text" required
                              value={editUserForm.name}
                              onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email</label>
                            <input 
                              type="email" required
                              value={editUserForm.email}
                              onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Role</label>
                            <select 
                              value={editUserForm.role}
                              onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                              className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                            >
                              <option>Procurement Engineer</option>
                              <option>Reporting Manager</option>
                              <option>Plant Manager 1</option>
                              <option>Plant Manager 2</option>
                              <option>Global Head</option>
                              <option>MD</option>
                              <option>Admin</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Password</label>
                            <input 
                              type="text" required
                              value={editUserForm.password}
                              onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                              placeholder="Password"
                            />
                          </div>
                          <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setShowEditUser(false)} className="flex-1 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
                            <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Update User</button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => setShowAdminPanel(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all z-[80] print:hidden"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
     </div>
   );
 };

 const AdminNavItem = ({ label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
  >
    {label}
  </button>
 );

 const NavItem = ({ icon, label, active = false, badge, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
  >
    <div className="flex items-center gap-3">
      <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'}>{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
    {badge && (
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-400'}`}>
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ icon, label, value, change }) => {
  const isPositive = change.startsWith('+') || (label === 'Approved' && parseInt(change) > 0);
  const isNegative = change.startsWith('-') || (label === 'Rejected' && parseInt(change) > 0);
  
  return (
    <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
          isPositive ? 'text-emerald-400 bg-emerald-400/10' : 
          isNegative ? 'text-rose-400 bg-rose-400/10' : 
          'text-slate-400 bg-slate-400/10'
        }`}>
          {change}
        </span>
      </div>
      <h4 className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1">{label}</h4>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );
};

const TabButton = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-1 py-2 text-sm font-semibold relative transition-colors ${active ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
  >
    {label}
    {active && (
      <motion.div 
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
      />
    )}
  </button>
);

const SignatureSlot = ({ role, approval }) => (
  <div className="flex flex-col items-center border-r border-slate-100 last:border-none px-2 py-4">
    <div className="h-12 flex items-center justify-center relative w-full mb-2">
      {approval ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-blue-600 font-serif italic text-sm font-black flex flex-col items-center w-full h-full"
        >
          {approval.signature_path ? (
            <img src={approval.signature_path} alt="Signature" className="h-full w-full object-contain" />
          ) : (
            <>
              <div className="text-[10px] text-blue-400 font-sans not-italic font-bold mb-[-4px]">SIGNED BY</div>
              {approval.user_name}
            </>
          )}
          <div className="text-[8px] text-slate-400 font-sans not-italic font-medium">
            {new Date(approval.timestamp).toLocaleDateString()}
          </div>
        </motion.div>
      ) : (
        <div className="text-[8px] text-slate-300 font-bold uppercase tracking-widest text-center">
          Awaiting {role}
        </div>
      )}
    </div>
    <div className="w-full h-[1px] bg-slate-200 mb-1" />
    <p className="text-[7px] text-slate-400 font-black uppercase text-center leading-tight">
      {role}
    </p>
  </div>
);

export default App;
