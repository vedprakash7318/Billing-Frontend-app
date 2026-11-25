import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Ban,
  CheckCircle2,
  Phone,
  Mail,
  Briefcase,
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog, toastSuccess, toastError } from '../utils/alerts';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/employees', { params: { search: search.trim() } });
      if (res.data?.success) {
        setEmployees(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleStatus = async (emp) => {
    const isSuspended = emp.status === 'SUSPENDED';
    const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
    const confirmed = await confirmDialog({
      title: isSuspended ? 'Activate Employee?' : 'Suspend Employee?',
      text: isSuspended
        ? `Allow "${emp.name}" to access store billing again?`
        : `Block "${emp.name}" from accessing the store?`,
      confirmButtonText: isSuspended ? 'Yes, Activate' : 'Yes, Suspend',
      isDangerous: !isSuspended,
    });
    if (!confirmed) return;

    try {
      await api.put(`/admin/employees/${emp.id || emp._id}`, { status: newStatus });
      toastSuccess(`Employee status changed to ${newStatus}`);
      fetchEmployees();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (emp) => {
    const confirmed = await confirmDialog({
      title: 'Remove Employee?',
      text: `Are you sure you want to permanently remove "${emp.name}" (${emp.designation})?`,
      confirmButtonText: 'Yes, Remove',
      isDangerous: true,
    });
    if (!confirmed) return;

    try {
      await api.delete(`/admin/employees/${emp.id || emp._id}`);
      toastSuccess('Employee removed successfully');
      fetchEmployees();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to remove employee');
    }
  };

  return (
    <AppLayout
      title="Store Employees"
      subtitle={`${employees.length} staff members`}
      backTo="/profile"
      actionButton={
        <Link
          to="/employees/new"
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>

        {/* Employees List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No employees added yet</h3>
            <p className="text-xs text-slate-500">
              Add your cashiers, billing staff, or store managers to manage your store.
            </p>
            <Link
              to="/employees/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Employee</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((emp) => {
              const empId = emp.id || emp._id;
              const isSuspended = emp.status === 'SUSPENDED';

              return (
                <div
                  key={empId}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
                        {emp.name?.charAt(0)?.toUpperCase() || 'E'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{emp.name}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isSuspended
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3" />
                          <span>{emp.designation || 'Cashier'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        to={`/employees/${empId}/edit`}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => toggleStatus(emp)}
                        className={`p-2 rounded-lg transition-colors ${
                          isSuspended
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                        title={isSuspended ? 'Activate' : 'Suspend'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                        title="Remove Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {emp.email}
                    </span>
                    {emp.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {emp.phone}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
