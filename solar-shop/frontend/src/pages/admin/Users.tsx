import React, { useEffect, useState } from 'react';
import { FiUserCheck, FiUserX } from 'react-icons/fi';
import { User } from '../../types';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const response = await adminApi.getUsers({ page: 1, limit: 50 });
      setUsers(response.data.data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleBlock = async (id: string, isBlocked: boolean) => {
    try {
      isBlocked ? await adminApi.unblockUser(id) : await adminApi.blockUser(id);
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
      loadUsers();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-toolbar">
          <h1>Users ({users.length})</h1>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.firstName} {user.lastName}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td><span className={`badge badge-${user.role === 'admin' ? 'primary' : 'secondary'}`}>{user.role}</span></td>
                  <td><span className={`badge badge-${user.status === 'active' ? 'success' : 'error'}`}>{user.status}</span></td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="actions">
                    {user.role !== 'admin' && (
                      <button 
                        className={`action-btn ${user.status === 'active' ? 'danger' : ''}`}
                        onClick={() => handleBlock(user.id, user.status === 'blocked')}
                      >
                        {user.status === 'blocked' ? <FiUserCheck /> : <FiUserX />}
                      </button>
                    )}
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

export default Users;
