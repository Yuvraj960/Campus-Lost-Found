import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { Search, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({ search });
      setUsers(data.items || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(user.id, nextStatus);
      toast.success(`User ${user.name} is now ${nextStatus}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review registered campus accounts, roles, and moderate access.
          </p>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or email..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Spinner size="md" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No users match your query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-3xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {u.department || 'N/A'} {u.year ? `(Yr ${u.year})` : ''}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.role === 'ADMIN' ? 'primary' : 'default'} size="sm">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.status === 'ACTIVE' ? 'green' : 'red'} size="sm">
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant={u.status === 'ACTIVE' ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => toggleStatus(u)}
                          className={u.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : ''}
                        >
                          {u.status === 'ACTIVE' ? (
                            <>
                              <UserX className="w-3.5 h-3.5 mr-1" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
