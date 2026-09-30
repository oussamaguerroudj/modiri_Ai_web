import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import AuthLayout from './AuthLayout.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import * as authApi from '../../api/auth';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(form);
      navigate('/login', { state: { justReset: true } });
    } catch (err) {
      setError(err.message || 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t('resetPasswordButton', 'Reset your password')}
      subtitle={t('resetPasswordSubtitle', 'Enter the code from your email and a new password.').replace('{email}', form.email)}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <Input label={t('email', 'Email')} type="email" required value={form.email} onChange={update('email')} />
        <Input
          label={t('verifyCodeLabel', 'Reset code')}
          inputMode="numeric"
          maxLength={6}
          required
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.replace(/\D/g, '') }))}
          placeholder="123456"
          className="tracking-[0.5em] text-center text-lg"
        />
        <Input
          label={t('newPassword', 'New password')}
          type="password"
          minLength={6}
          required
          value={form.newPassword}
          onChange={update('newPassword')}
          placeholder={t('passwordTooShort', 'At least 6 characters')}
        />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner size={18} /> : <KeyRound size={18} />}
          {t('resetPasswordButton', 'Reset password')}
        </button>
      </form>
    </AuthLayout>
  );
}
