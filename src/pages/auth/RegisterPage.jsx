import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthLayout from './AuthLayout.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import * as authApi from '../../api/auth';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError(t('passwordTooShort', 'Password must be at least 6 characters.'));
      return;
    }

    setLoading(true);
    try {
      await authApi.register(form);
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t('registerTitle', 'Create your account')}
      subtitle={t('onboardingDesc1', 'Set up Modiri AI for your business in a couple of minutes.')}
      footer={
        <>
          {t('haveAccount', 'Already have an account?')}{' '}
          <Link to="/login" className="font-semibold text-brand-blue hover:underline">
            {t('login', 'Sign in')}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <Input
          label={t('fullName', 'Full name')}
          required
          value={form.name}
          onChange={update('name')}
          placeholder={t('yourNameHint', 'Osama Ben Ali')}
        />
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
          autoComplete="new-password"
          required
          minLength={6}
          value={form.password}
          onChange={update('password')}
          placeholder={t('passwordTooShort', 'At least 6 characters')}
        />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner size={18} /> : <UserPlus size={18} />}
          {t('createAccount', 'Create account')}
        </button>
      </form>
    </AuthLayout>
  );
}
