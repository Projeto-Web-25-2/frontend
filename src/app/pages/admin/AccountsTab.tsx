import { useCallback, useEffect, useState } from 'react';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services';
import type { UserResponse } from '../../services';

interface AccountsTabProps {
  accessToken: string;
  isAdmin: boolean;
}

export const AccountsTab = ({ accessToken, isAdmin }: AccountsTabProps) => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!accessToken || !isAdmin) return;
    setUsersLoading(true);
    setUsersError(null);

    try {
      const data = await authService.listUsers(accessToken);
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários', error);
      setUsersError('Não foi possível carregar as contas de usuários.');
      toast.error('Falha ao carregar contas.');
    } finally {
      setUsersLoading(false);
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (uid: string, role?: string) => {
    if (!accessToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    if (role === 'admin') {
      toast.error('Não é permitido excluir contas de administradores.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta conta de usuário?')) {
      return;
    }

    try {
      await authService.deleteUser(uid, accessToken);
      setUsers((prev) => prev.filter((account) => account.uid !== uid));
      toast.success('Conta excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir usuário', error);
      toast.error('Não foi possível excluir a conta.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Contas de Usuários</h2>
      </div>

      {usersError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {usersError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Nome</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">E-mail</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">CPF</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Perfil</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      {Array.from({ length: 5 }).map((_, cellIndex) => (
                        <td key={cellIndex} className="py-4 px-4">
                          <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.length > 0
                ? users.map((account) => (
                    <tr key={account.uid} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                        {account.full_name || 'Sem nome'}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">{account.email}</td>
                      <td className="py-4 px-4 text-sm text-gray-700">{account.cpf}</td>
                      <td className="py-4 px-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            account.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : account.role === 'publisher'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {account.role === 'admin'
                            ? 'Admin'
                            : account.role === 'publisher'
                              ? 'Editor'
                              : 'Usuário'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleDeleteUser(account.uid, account.role)}
                          disabled={account.role === 'admin'}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          aria-label="Excluir conta"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                        Nenhuma conta encontrada.
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
