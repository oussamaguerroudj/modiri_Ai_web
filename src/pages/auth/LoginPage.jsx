import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from './AuthLayout.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
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
      await login(form);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', { state: { email: form.email } });
        return;
      }
      setError(err.message || 'Could not sign in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t('loginTitle', 'Welcome back')}
      subtitle={t('loginSubtitle', 'Sign in to manage your business.')}
      footer={
        <>
          {t('noAccount', "Don't have an account?")}{' '}
          <Link to="/register" className="font-semibold text-brand-blue hover:underline">
            {t('createAccount', 'Create one')}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <Input
          label={t('email', 'Email')}
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
          placeholder={t('emailPlaceholder')}
        />
        <Input
          label={t('password', 'Password')}
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={update('password')}
          placeholder="••••••••"
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand-blue hover:underline">
            {t('forgotPassword', 'Forgot password?')}
          </Link>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner size={18} /> : <LogIn size={18} />}
          {t('login', 'Sign in')}
        </button>
      </form>
    </AuthLayout>
  );
}
